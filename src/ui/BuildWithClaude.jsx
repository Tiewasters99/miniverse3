import React, { useRef, useState, useEffect, useCallback } from 'react';
import { getAllRoomConfigs } from '../config/rooms.js';

// --- Speech helpers ---
const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

// Extract only the spoken portion from Archie's response.
// The response has two parts: spoken (before the brief) and written (the brief itself).
// We only speak the first part, and keep it concise.
function extractSpeakableText(text) {
  // If there's a DEVELOPER_BRIEF, only speak what comes before it
  const briefIdx = text.indexOf('```DEVELOPER_BRIEF');
  const beforeBrief = briefIdx > -1 ? text.slice(0, briefIdx) : text;
  // Also strip any other code blocks
  let speakable = beforeBrief
    .replace(/```[\w]*\n?[\s\S]*?```/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\*\*/g, '')  // strip markdown bold
    .replace(/\*/g, '')    // strip markdown italic
    .trim();
  // Trim any trailing incomplete sentence fragment (ends mid-word or with dangling punctuation)
  // Find the last sentence-ending punctuation and cut there
  const lastEnd = Math.max(
    speakable.lastIndexOf('.'),
    speakable.lastIndexOf('?'),
    speakable.lastIndexOf('!'),
  );
  if (lastEnd > speakable.length * 0.5) {
    speakable = speakable.slice(0, lastEnd + 1);
  }
  return speakable;
}

// localStorage keys
const USER_STORAGE_KEY = 'miniverse:user';
const GREETED_STORAGE_PREFIX = 'miniverse:greeted:';
const CONVO_STORAGE_PREFIX = 'miniverse:convo:';

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function hasBeenGreeted(name) {
  return localStorage.getItem(GREETED_STORAGE_PREFIX + name.toLowerCase()) === '1';
}

function markGreeted(name) {
  localStorage.setItem(GREETED_STORAGE_PREFIX + name.toLowerCase(), '1');
}

function loadConversation(room) {
  try {
    const raw = localStorage.getItem(CONVO_STORAGE_PREFIX + room);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Only restore messages that are displayable (skip developer-live)
    const msgs = (data.messages || []).filter(m =>
      m.role === 'user' || m.role === 'assistant' || m.role === 'developer'
    );
    // Cap at 50 messages to prevent localStorage bloat
    return msgs.length > 0 ? msgs.slice(-50) : null;
  } catch { return null; }
}

function saveConversationLocal(room, messages) {
  try {
    // Only save displayable messages, cap at 50
    const msgs = messages
      .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'developer')
      .slice(-50)
      .map(m => ({ role: m.role, content: m.content }));
    if (msgs.length > 0) {
      localStorage.setItem(CONVO_STORAGE_PREFIX + room, JSON.stringify({ messages: msgs, updated: Date.now() }));
    }
  } catch { /* localStorage full or unavailable */ }
}

export default function BuildWithClaude({
  architectOpen, onClose,
  architectMessages, setArchitectMessages,
  architectInput, setArchitectInput,
  architectLoading, setArchitectLoading,
  architectModel, setArchitectModel,
  currentRoom,
  setEscalationOpen, setEscalationSummary,
}) {
  const scrollRef = useRef(null);
  const [agentWorking, setAgentWorking] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const lastSavedCountRef = useRef(0);
  const lastCallTimeRef = useRef(0);
  const abortRef = useRef(null); // AbortController for cancelling agent requests

  // User identification
  const [currentUser, setCurrentUser] = useState(() => loadUser());
  const [showIdentityCard, setShowIdentityCard] = useState(false);
  const [identityName, setIdentityName] = useState('');
  const [identityNickname, setIdentityNickname] = useState('');

  // Voice options (dormant — UI hidden, ttsEnabled defaults to false)
  const VOICES = [
    { id: 'KTjyUd6ZeCmAkkfvuuU2', label: 'The Professor' },
    { id: 'fQ2OuF5p14ONNX1XeDIB', label: 'The Lawyer' },
    { id: 'lrjOvoJ62V44bS4Oybws', label: 'The Friend' },
  ];

  // Voice state (dormant)
  const [listening, setListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  // --- TTS: speak via ElevenLabs (falls back to browser TTS) ---
  // Keep a stable ref to the blob URL so it doesn't get revoked prematurely
  const blobUrlRef = useRef(null);

  const speakText = useCallback(async (text) => {
    if (!ttsEnabled) return;
    // Stop any ongoing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    const speakable = extractSpeakableText(text);
    if (!speakable) return;

    setSpeaking(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speakable, voice_id: selectedVoice }),
      });
      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.warn('[TTS] ElevenLabs error:', response.status, errBody);
        throw new Error('TTS endpoint failed');
      }
      const blob = await response.blob();
      if (blob.size < 100) {
        console.warn('[TTS] Audio blob too small:', blob.size, 'bytes');
        throw new Error('Empty audio');
      }
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const audio = new Audio(url);
      // Prevent garbage collection by holding strong ref
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        if (blobUrlRef.current === url) {
          URL.revokeObjectURL(url);
          blobUrlRef.current = null;
        }
        audioRef.current = null;
      };
      audio.onerror = (e) => {
        console.warn('[TTS] Audio playback error:', e);
        setSpeaking(false);
        if (blobUrlRef.current === url) {
          URL.revokeObjectURL(url);
          blobUrlRef.current = null;
        }
        audioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.warn('[TTS] Falling back to browser speech:', err.message);
      // Fallback to browser TTS if ElevenLabs fails
      const synth = window.speechSynthesis;
      if (synth) {
        const utterance = new SpeechSynthesisUtterance(speakable);
        utterance.rate = 1.0;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        synth.speak(utterance);
      } else {
        setSpeaking(false);
      }
    }
  }, [ttsEnabled, selectedVoice]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    // Also stop browser TTS fallback
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // --- STT: microphone input (continuous toggle mode) ---
  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;       // Stay on until user clicks stop
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onerror = (e) => {
      // 'no-speech' is normal — user paused. Don't stop listening.
      if (e.error === 'no-speech') return;
      setListening(false);
    };
    // If recognition ends unexpectedly (browser timeout), restart it
    recognition.onend = () => {
      if (recognitionRef.current === recognition && listening) {
        try { recognition.start(); } catch { setListening(false); }
      }
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setArchitectInput(transcript);
    };

    recognitionRef.current = recognition;
    stopSpeaking();
    recognition.start();
  }, [setArchitectInput, stopSpeaking, listening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null;  // Prevent auto-restart in onend
      ref.stop();
      setListening(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Save conversation to research database
  const saveConversation = async (messages, filesModified = []) => {
    if (messages.length <= 1) return;
    if (messages.length === lastSavedCountRef.current) return;
    lastSavedCountRef.current = messages.length;
    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: currentRoom,
          model: architectModel,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content || '',
            ...(m.steps ? { steps: m.steps } : {}),
          })),
          filesModified,
          sessionDuration: Math.round((Date.now() - sessionStartRef.current) / 1000),
        }),
      });
    } catch { /* silent fail */ }
  };

  // Handle saving a new identity from the card
  const handleIdentitySave = useCallback((name, nickname) => {
    const user = { name: name.trim(), nickname: nickname.trim() || name.trim() };
    saveUser(user);
    setCurrentUser(user);
    setShowIdentityCard(false);
    setIdentityName('');
    setIdentityNickname('');
  }, []);

  // Handle switching user (clear identity)
  const handleSwitchUser = useCallback(() => {
    setIdentityName(currentUser?.name || '');
    setIdentityNickname(currentUser?.nickname || '');
    setShowIdentityCard(true);
  }, [currentUser]);

  // Generate a greeting for the current user
  const makeGreeting = useCallback(() => {
    if (!currentUser) return null;
    const roomName = getAllRoomConfigs()[currentRoom]?.name || currentRoom;
    const displayName = currentUser.nickname || currentUser.name;
    const alreadyGreeted = hasBeenGreeted(currentUser.name);

    if (alreadyGreeted) {
      return `Hey ${displayName} — welcome back. We're in the ${roomName}. What are we working on?`;
    }
    markGreeted(currentUser.name);
    return `Hey ${displayName}, I'm Archie — the architect here. I can design and build just about anything in your ${roomName}. Tell me what you're thinking.`;
  }, [currentUser, currentRoom]);

  // Start a new conversation (clear history, re-greet)
  const startNewConversation = useCallback(() => {
    localStorage.removeItem(CONVO_STORAGE_PREFIX + currentRoom);
    setArchitectMessages([]);
    setHasGreeted(false);
  }, [currentRoom, setArchitectMessages]);

  // Greet or restore conversation when the panel opens
  useEffect(() => {
    if (architectOpen && !hasGreeted && architectMessages.length === 0) {
      setHasGreeted(true);

      // If no user is set, show the identity card first — greeting happens after they identify
      if (!currentUser) {
        setShowIdentityCard(true);
        return;
      }

      // Try to restore a saved conversation for this room
      const saved = loadConversation(currentRoom);
      if (saved) {
        const roomName = getAllRoomConfigs()[currentRoom]?.name || currentRoom;
        const displayName = currentUser.nickname || currentUser.name;
        // Restore old messages + add a short "welcome back" as the latest
        const resumeGreeting = `Welcome back, ${displayName}. I remember where we left off in the ${roomName}. What's next?`;
        setArchitectMessages([...saved, { role: 'assistant', content: resumeGreeting }]);
        speakText(resumeGreeting);
        return;
      }

      // No saved conversation — fresh greeting
      const greeting = makeGreeting();
      if (greeting) {
        setArchitectMessages([{ role: 'assistant', content: greeting }]);
        speakText(greeting);
      }
    }
  }, [architectOpen, currentUser]);

  // When identity card is submitted and no greeting has happened yet, trigger greeting
  useEffect(() => {
    if (currentUser && hasGreeted && architectMessages.length === 0) {
      const greeting = makeGreeting();
      if (greeting) {
        setArchitectMessages([{ role: 'assistant', content: greeting }]);
        speakText(greeting);
      }
    }
  }, [currentUser]);

  // Auto-save conversation to localStorage whenever messages change
  useEffect(() => {
    if (architectMessages.length > 0) {
      saveConversationLocal(currentRoom, architectMessages);
    }
  }, [architectMessages, currentRoom]);

  if (!architectOpen) return null;

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  };

  // Strip code blocks from older messages to save tokens
  const stripCodeBlocks = (content) => {
    return content
      .replace(/```[\w]*\n?[\s\S]*?```/g, '[Code block omitted]');
  };

  // Trim messages to stay under API token limits.
  // Keep ALL messages so Archie never loses conversational context.
  // Only strip code blocks from older messages and hard-truncate at 30+.
  const trimMessages = (msgs) => {
    const chatMsgs = msgs.filter(m => m.role === 'user' || m.role === 'assistant');
    if (chatMsgs.length <= 6) return chatMsgs;

    const recent = chatMsgs.slice(-4);
    const older = chatMsgs.slice(0, -4).map(m => ({
      ...m,
      content: m.role === 'assistant' ? stripCodeBlocks(m.content) : m.content,
    }));

    if (older.length > 26) {
      const kept = older.slice(-12);
      const dropped = older.slice(0, -12);
      const topics = dropped
        .filter(m => m.role === 'user')
        .map(m => m.content.slice(0, 80))
        .join('; ');
      const summary = { role: 'user', content: `[Earlier in this conversation we discussed: ${topics}]` };
      return [summary, ...kept, ...recent];
    }

    return [...older, ...recent];
  };

  const sendMessage = async (overrideInput) => {
    const msgText = overrideInput || architectInput;
    if (!msgText.trim()) return;

    // If Archie is currently working, abort and queue the new message as an interjection
    if (architectLoading || agentWorking) {
      if (abortRef.current) abortRef.current.abort();
      // Wait a tick for the abort to propagate and state to clear
      await new Promise(r => setTimeout(r, 100));
    }

    // Client-side rate limiting (skip if we just interrupted)
    const now = Date.now();
    const elapsed = now - lastCallTimeRef.current;
    if (elapsed < 3000 && lastCallTimeRef.current > 0 && !abortRef.current) {
      const waitSec = Math.ceil((3000 - elapsed) / 1000);
      const waitMsg = `Give me a second — I'm still processing. Try again in ${waitSec}.`;
      setArchitectMessages(prev => [...prev, { role: 'assistant', content: waitMsg }]);
      speakText(waitMsg);
      return;
    }

    const userMsg = msgText.trim();
    setArchitectInput('');
    const newMessages = [...architectMessages, { role: 'user', content: userMsg }];
    setArchitectMessages(newMessages);
    setArchitectLoading(true);
    setAgentWorking(true);
    lastCallTimeRef.current = Date.now();

    // Prepare the assistant message placeholder with a unique id
    const msgId = Date.now();
    const assistantMsg = { role: 'assistant', id: msgId, content: '', steps: [] };
    setArchitectMessages(prev => [...prev, assistantMsg]);
    scrollToBottom();

    const steps = [];
    let fullText = '';

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: architectModel,
          currentRoom,
          allRooms: Object.keys(getAllRoomConfigs()).join(', '),
          currentUser: currentUser || null,
          messages: trimMessages(newMessages).map(m => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'text') {
              fullText += event.content;
              setArchitectMessages(prev => prev.map(m =>
                m.id === msgId ? { ...m, content: fullText } : m
              ));
              scrollToBottom();
            } else if (event.type === 'status' || event.type === 'thinking') {
              steps.push({ icon: '\ud83d\udca1', text: event.message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
              setArchitectMessages(prev => prev.map(m =>
                m.id === msgId ? { ...m, steps: [...steps] } : m
              ));
              scrollToBottom();
            } else if (event.type === 'tool') {
              const icon = event.action === 'read' ? '\ud83d\udcc2' : event.action === 'write' ? '\u270f\ufe0f' : '\ud83d\udcc1';
              steps.push({ icon, text: event.message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
              setArchitectMessages(prev => prev.map(m =>
                m.id === msgId ? { ...m, steps: [...steps] } : m
              ));
              scrollToBottom();
            } else if (event.type === 'file_written') {
              steps.push({ icon: '\u2705', text: event.message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
              setArchitectMessages(prev => prev.map(m =>
                m.id === msgId ? { ...m, steps: [...steps] } : m
              ));
              scrollToBottom();
            } else if (event.type === 'rebuild_done') {
              steps.push({ icon: '🔄', text: event.message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
              setArchitectMessages(prev => prev.map(m =>
                m.id === msgId ? { ...m, steps: [...steps] } : m
              ));
              scrollToBottom();
            } else if (event.type === 'done') {
              const finalText = event.reply || fullText || 'Done.';
              const filesNote = event.filesModified?.length > 0
                ? `\n\nFiles updated: ${event.filesModified.join(', ')}`
                : '';
              setArchitectMessages(prev => prev.map(m =>
                m.id === msgId
                  ? { ...m, role: 'assistant', content: finalText + filesNote, steps: steps.length > 0 ? steps : undefined }
                  : m
              ));
              // Save and speak
              const updatedMsgs = [...newMessages, { role: 'assistant', content: finalText + filesNote, steps: steps.length > 0 ? steps : undefined }];
              saveConversation(updatedMsgs, event.filesModified || []);
              speakText(finalText);
            } else if (event.type === 'error') {
              steps.push({ icon: '\u274c', text: event.message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) });
              setArchitectMessages(prev => prev.map(m =>
                m.id === msgId
                  ? { ...m, content: `Error: ${event.message}`, steps }
                  : m
              ));
              speakText('There was an issue. You can check the details in the chat.');
            }
          } catch { /* skip malformed events */ }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled — show what we had so far
        const abortText = fullText || 'Stopped by user.';
        const filesNote = steps.filter(s => s.icon === '\u2705').length > 0
          ? '\n\n(Some files may have been written before stopping.)'
          : '';
        setArchitectMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, content: abortText + filesNote, steps: steps.length > 0 ? steps : undefined } : m
        ));
      } else {
        const errMsg = `Connection error: ${err.message}. Please try again.`;
        setArchitectMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, content: errMsg } : m
        ));
      }
    }
    abortRef.current = null;
    setArchitectLoading(false);
    setAgentWorking(false);
    scrollToBottom();
  };

  const suggestions = currentRoom === 'study' ? [
    'I want to play my own music in here',
    'Can you hang a painting above the fireplace?',
    'Make this room feel more cozy',
  ] : currentRoom === 'french' ? [
    'Add more artwork to the gallery',
    'I want a chandelier in the theater',
    'Can you add a section about Victor Hugo?',
  ] : currentRoom === 'versailles' ? [
    'I want a hedge maze in the gardens',
    'Add a fountain with water',
    'Put some statues along the path',
  ] : [
    'What could I add to this room?',
    'I want something interactive to click on',
    'Make this space feel more alive',
  ];

  return (
    <div style={{
      position: 'absolute', top: '20px', right: '20px', bottom: '80px',
      width: '380px', background: 'linear-gradient(165deg, #1a1028 0%, #0d0a14 100%)',
      borderRadius: '16px', border: '1px solid rgba(139,92,246,0.3)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', zIndex: 90,
    }}>
      {/* Identity Card Modal */}
      {showIdentityCard && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '300px', padding: '24px',
            background: 'linear-gradient(165deg, #1e1533 0%, #120e1a 100%)',
            borderRadius: '16px', border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ margin: '0 0 4px', color: '#c4b5fd', fontSize: '15px', fontWeight: 700 }}>
              Who's speaking?
            </h3>
            <p style={{ margin: '0 0 16px', color: '#7c6f9f', fontSize: '11px' }}>
              So Archie knows who he's talking to. No registration needed.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ color: '#8b7fb0', fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  First name
                </label>
                <input
                  value={identityName}
                  onChange={(e) => setIdentityName(e.target.value)}
                  placeholder="Your first name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && identityName.trim()) handleIdentitySave(identityName, identityNickname);
                  }}
                  style={{
                    width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: '8px', color: '#e0d8f0', fontSize: '13px', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#8b7fb0', fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Nickname <span style={{ color: '#5a5078', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  value={identityNickname}
                  onChange={(e) => setIdentityNickname(e.target.value)}
                  placeholder="What should Archie call you?"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && identityName.trim()) handleIdentitySave(identityName, identityNickname);
                  }}
                  style={{
                    width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: '8px', color: '#e0d8f0', fontSize: '13px', outline: 'none',
                  }}
                />
              </div>
              <button
                onClick={() => { if (identityName.trim()) handleIdentitySave(identityName, identityNickname); }}
                disabled={!identityName.trim()}
                style={{
                  marginTop: '4px', padding: '10px 16px',
                  background: identityName.trim()
                    ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                    : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: '10px',
                  color: identityName.trim() ? '#fff' : '#555',
                  fontSize: '13px', fontWeight: 600,
                  cursor: identityName.trim() ? 'pointer' : 'default',
                }}
              >
                Continue
              </button>
              {currentUser && (
                <button
                  onClick={() => setShowIdentityCard(false)}
                  style={{
                    padding: '6px 12px', background: 'none', border: 'none',
                    color: '#7c6f9f', fontSize: '11px', cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid rgba(139,92,246,0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>{'\ud83c\udfdb\ufe0f'}</span>
          <div>
            <h3 style={{ margin: 0, color: '#c4b5fd', fontSize: '15px', fontWeight: 700 }}>Archie</h3>
            <p style={{ margin: 0, color: '#7c6f9f', fontSize: '10px' }}>Miniverse Architect</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Who's speaking button */}
          <button
            onClick={handleSwitchUser}
            title={currentUser ? `Speaking as: ${currentUser.nickname || currentUser.name}` : 'Identify yourself'}
            style={{
              padding: '4px 8px', borderRadius: '6px',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#a78bfa', fontSize: '10px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              maxWidth: '90px', overflow: 'hidden', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '12px' }}>{'\ud83d\udc64'}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser ? (currentUser.nickname || currentUser.name) : '?'}
            </span>
          </button>
          <select value={architectModel} onChange={(e) => setArchitectModel(e.target.value)} style={{
            padding: '5px 8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '6px', color: '#c4b5fd', fontSize: '10px', outline: 'none', cursor: 'pointer',
          }}>
            <option value="claude-opus-4-6">Opus 4.6</option>
            <option value="claude-sonnet-4-20250514">Sonnet 4 (faster)</option>
          </select>
          <button onClick={() => { stopSpeaking(); onClose(); }} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
          }}>&#x2715;</button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {architectMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{'\ud83c\udfdb\ufe0f'}</div>
            <p style={{ color: '#8b7fb0', fontSize: '14px', margin: '0 0 8px', fontWeight: 600 }}>Archie</p>
            <p style={{ color: '#5a5078', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
              Your architect for the {getAllRoomConfigs()[currentRoom]?.name || currentRoom}.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {suggestions.map((q, i) => (
                <button key={i} onClick={() => setArchitectInput(q)} style={{
                  padding: '8px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: '8px', color: '#a78bfa', fontSize: '11px', cursor: 'pointer', textAlign: 'left',
                }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {architectMessages.map((msg, i) => (
          <div key={msg.id || i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            {(msg.role === 'assistant' || msg.role === 'developer') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px' }}>{'\ud83c\udfdb\ufe0f'}</span>
                <span style={{ color: '#7c6f9f', fontSize: '10px', fontWeight: 600 }}>Archie</span>
              </div>
            )}

            {/* Live activity feed — shows tool steps inline with assistant messages */}
            {showLiveFeed && msg.steps?.length > 0 && (
              <div style={{
                padding: '10px 14px', borderRadius: '12px', marginBottom: msg.content ? '6px' : 0,
                background: 'rgba(74,222,128,0.05)',
                border: '1px solid rgba(74,222,128,0.2)',
                maxHeight: '200px', overflowY: 'auto',
              }}>
                <div style={{ fontSize: '10px', color: '#4ade80', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 600 }}>
                  {agentWorking && msg.id ? 'LIVE FEED' : 'BUILD LOG'}
                </div>
                {(msg.steps || []).map((step, j) => (
                  <div key={j} style={{
                    display: 'flex', gap: '8px', alignItems: 'flex-start',
                    padding: '3px 0', fontSize: '11px', color: '#86efac',
                    fontFamily: 'monospace',
                  }}>
                    <span style={{ flexShrink: 0 }}>{step.icon}</span>
                    <span style={{ flex: 1, opacity: 0.9 }}>{step.text}</span>
                    <span style={{ flexShrink: 0, color: '#4ade8066', fontSize: '9px' }}>{step.time}</span>
                  </div>
                ))}
                {agentWorking && msg.id && (
                  <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>
                    {'\u25cf'} working...
                  </div>
                )}
              </div>
            )}

            {/* Message content */}
            {msg.content && (
              <div style={{
                padding: '10px 14px', borderRadius: '12px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                  : msg.role === 'developer'
                    ? 'rgba(74,222,128,0.08)'
                    : 'rgba(255,255,255,0.06)',
                border: msg.role === 'developer'
                  ? '1px solid rgba(74,222,128,0.25)'
                  : msg.role === 'assistant'
                    ? '1px solid rgba(139,92,246,0.15)'
                    : 'none',
                color: msg.role === 'user' ? '#fff' : msg.role === 'developer' ? '#a7f3d0' : '#d4ccec',
                fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {/* Only show "Thinking..." when loading but not yet streaming (no placeholder msg) */}
        {architectLoading && !agentWorking && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px' }}>{'\ud83c\udfdb\ufe0f'}</span>
              <span style={{ color: '#7c6f9f', fontSize: '10px', fontWeight: 600 }}>Archie</span>
            </div>
            <div style={{
              padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.15)',
              color: '#8b7fb0', fontSize: '13px',
            }}>Thinking...</div>
          </div>
        )}
      </div>

      {/* Input + Actions */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid rgba(139,92,246,0.2)',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {/* Live Feed toggle — visible when agent is working or has done tool work */}
        {agentWorking && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{
              flex: 1, padding: '10px 16px', background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px',
              color: '#c4b5fd', fontSize: '12px', textAlign: 'center',
            }}>
              {'\ud83c\udfdb\ufe0f'} Archie is working...
            </div>
            <button onClick={() => { if (abortRef.current) abortRef.current.abort(); }} style={{
              padding: '10px 12px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '10px',
              color: '#f87171',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              {'\u25a0'} Stop
            </button>
            <button onClick={() => setShowLiveFeed(!showLiveFeed)} style={{
              padding: '10px 12px',
              background: showLiveFeed ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
              border: showLiveFeed ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: showLiveFeed ? '#4ade80' : '#888',
              fontSize: '11px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              {'\ud83d\udcfa'} Live
            </button>
          </div>
        )}

        {/* Input row */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={architectInput} onChange={(e) => setArchitectInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            placeholder="Talk to Archie..."
            style={{
              flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '10px',
              color: '#e0d8f0', fontSize: '13px', outline: 'none',
            }}
          />
          {/* Send button — enabled during agent work so user can interject */}
          <button onClick={() => sendMessage()} disabled={!architectInput.trim()} style={{
            padding: '10px 16px',
            background: architectInput.trim() ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: '10px',
            color: architectInput.trim() ? '#fff' : '#555',
            fontSize: '14px', cursor: architectInput.trim() ? 'pointer' : 'default',
          }}>{'\u2192'}</button>
        </div>

        {architectMessages.length > 0 && !agentWorking && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={startNewConversation} style={{
              flex: 1, padding: '8px 12px', background: 'none',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              color: '#7c6f9f', fontSize: '11px', cursor: 'pointer', textAlign: 'center',
            }}>New conversation</button>
            <button onClick={() => {
              const summary = architectMessages.map(m =>
                `${m.role === 'user' ? 'User' : m.role === 'developer' ? 'Developer' : 'Archie'}: ${m.content}`
              ).join('\n\n');
              setEscalationSummary(summary);
              setEscalationOpen(true);
            }} style={{
              flex: 1, padding: '8px 12px', background: 'none',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              color: '#7c6f9f', fontSize: '11px', cursor: 'pointer', textAlign: 'center',
            }}>{'\ud83d\udc64'} Escalate</button>
          </div>
        )}
      </div>

    </div>
  );
}
