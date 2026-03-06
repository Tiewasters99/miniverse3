import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { roomConfigs, addCustomRoom, getAllRoomConfigs } from './config/rooms.js';
import { storage } from './utils/storage.js';
import { buildTextMesh } from './utils/geometries.js';
import { WALL_TEXT_SPOTS } from './utils/constants.js';
import SceneManager from './engine/SceneManager.jsx';
import ArrangeController from './engine/ArrangeController.js';
import HUD from './ui/HUD.jsx';
import ContentModal from './ui/ContentModal.jsx';
import NavigationMenu from './ui/NavigationMenu.jsx';
import SettingsPanel from './ui/SettingsPanel.jsx';
import ChatPanel from './ui/ChatPanel.jsx';
import AudioPlayerUI from './ui/AudioPlayerUI.jsx';
import Toolbar from './ui/Toolbar.jsx';
import ArrangeToolbar from './ui/ArrangeToolbar.jsx';
import BuildWithClaude from './ui/BuildWithClaude.jsx';
import { AudioMenu, InviteModal, ReggaeMenu, ConnectModal, EscalationModal, NowPlaying } from './ui/Modals.jsx';

export default function App() {
  // Core state
  const [currentRoom, setCurrentRoom] = useState('study');
  const config = getAllRoomConfigs()[currentRoom] || { name: currentRoom, subtitle: 'Your Miniverse\u2122', isExterior: false, doors: [] };

  // Arrange mode state
  const [arrangeMode, setArrangeMode] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const movableObjectsRef = useRef([]);

  // UI panel states
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [reggaeMenuOpen, setReggaeMenuOpen] = useState(false);
  const [miniverseInviteOpen, setMiniverseInviteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { user: 'System', text: 'Welcome to this Miniverse! Chat with other guests here.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [tabsVisible, setTabsVisible] = useState(true);
  const [iconSettings, setIconSettings] = useState({
    chat: true, connect: true, write: true, architect: true,
    music: true, invite: true, reggae: true,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [doorMenuOpen, setDoorMenuOpen] = useState(false);
  const [comingSoonTip, setComingSoonTip] = useState(false);
  const [selectedWallPanel, setSelectedWallPanel] = useState(null);
  const [hintDismissed, setHintDismissed] = useState(false);

  // Wall text state
  const [wallTexts, setWallTexts] = useState({});
  const wallTextsRef = useRef({});
  const wallTextMeshesRef = useRef([]);

  // Architect state
  const [architectOpen, setArchitectOpen] = useState(false);
  const [architectMessages, setArchitectMessages] = useState([]);
  const [architectInput, setArchitectInput] = useState('');
  const [architectLoading, setArchitectLoading] = useState(false);
  const [architectModel, setArchitectModel] = useState('claude-opus-4-6');
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [escalationSummary, setEscalationSummary] = useState('');

  // Custom audio state
  const [customAudioOpen, setCustomAudioOpen] = useState(false);
  const [customAudioName, setCustomAudioName] = useState('');
  const [customAudioReady, setCustomAudioReady] = useState(false);
  const [customAudioPlaying, setCustomAudioPlaying] = useState(false);
  const [customAudioDuration, setCustomAudioDuration] = useState(0);
  const [customAudioTime, setCustomAudioTime] = useState(0);
  const [savedLibrary, setSavedLibrary] = useState([]);
  const [librarySaving, setLibrarySaving] = useState(false);
  const [libraryMsg, setLibraryMsg] = useState('');
  const [currentSavedInLibrary, setCurrentSavedInLibrary] = useState(false);

  // Refs
  const synthRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const clickableObjectsRef = useRef([]);
  const audioCtxRef = useRef(null);
  const audioBufferRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioStartTimeRef = useRef(0);
  const audioOffsetRef = useRef(0);
  const audioTimerRef = useRef(null);
  const audioRawDataRef = useRef(null);

  // Navigate between rooms
  const navigate = (room) => {
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (synthRef.current) synthRef.current.dispose();
      setIsPlaying(false);
      setCurrentTrack(null);
    }
    // Stop custom audio
    if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch (e) { /* */ } }
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    setCustomAudioPlaying(false);

    setAudioMenuOpen(false);
    setInviteModalOpen(false);
    setReggaeMenuOpen(false);
    setMiniverseInviteOpen(false);
    setChatOpen(false);
    setArchitectOpen(false);
    setEscalationOpen(false);
    setDoorMenuOpen(false);
    setSettingsOpen(false);
    setSelectedWallPanel(null);
    setHintDismissed(false);
    setCustomAudioOpen(false);
    setArrangeMode(false);
    setSelectedFurniture(null);
    setCurrentRoom(room);
  };

  // Create a new room
  const createRoom = (name) => {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!id) return;
    addCustomRoom(id, name, currentRoom);
    navigate(id);
  };

  // Load library on room change
  useEffect(() => {
    (async () => {
      try {
        const result = await storage.get(`audio-lib-idx:${currentRoom}`);
        const idx = result ? JSON.parse(result.value) : [];
        setSavedLibrary(idx);
      } catch { setSavedLibrary([]); }
    })();
  }, [currentRoom]);

  // Tone.js cleanup
  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.dispose();
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  // Chat
  const sendChatMessage = () => {
    if (chatInput.trim()) {
      setChatMessages(prev => [...prev, {
        user: 'You', text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setChatInput('');
    }
  };

  // Mozart playback
  const playTrack = async (track) => {
    await Tone.start();
    if (synthRef.current) synthRef.current.dispose();
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 },
    }).toDestination();
    synthRef.current.volume.value = -6;
    Tone.Transport.bpm.value = track.tempo;
    Tone.Transport.cancel();
    track.notes.forEach(({ note, duration, time }) => {
      Tone.Transport.schedule((t) => {
        synthRef.current.triggerAttackRelease(note, duration, t);
      }, time);
    });
    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = Math.max(...track.notes.map(n => n.time)) + 1;
    Tone.Transport.start();
    setCurrentTrack(track);
    setIsPlaying(true);
    setAudioMenuOpen(false);
  };

  const stopPlayback = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (synthRef.current) synthRef.current.dispose();
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  // Custom audio functions
  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch (e) { /* */ } }
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    setCustomAudioPlaying(false);
    setCustomAudioReady(false);
    setCustomAudioTime(0);
    setCurrentSavedInLibrary(false);
    setCustomAudioName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        audioRawDataRef.current = ev.target.result.slice(0);
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const buffer = await ctx.decodeAudioData(ev.target.result);
        audioBufferRef.current = buffer;
        audioOffsetRef.current = 0;
        setCustomAudioDuration(buffer.duration);
        setCustomAudioReady(true);
      } catch {
        setCustomAudioName('Error: Could not decode audio');
        setCustomAudioReady(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const playCustomAudio = () => {
    if (!audioBufferRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(ctx.destination);
    source.onended = () => {
      if (customAudioPlaying) {
        setCustomAudioPlaying(false);
        setCustomAudioTime(0);
        audioOffsetRef.current = 0;
        if (audioTimerRef.current) clearInterval(audioTimerRef.current);
      }
    };
    source.start(0, audioOffsetRef.current);
    audioSourceRef.current = source;
    audioStartTimeRef.current = ctx.currentTime - audioOffsetRef.current;
    setCustomAudioPlaying(true);
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    audioTimerRef.current = setInterval(() => {
      const t = ctx.currentTime - audioStartTimeRef.current;
      setCustomAudioTime(Math.min(t, audioBufferRef.current?.duration || 0));
    }, 250);
  };

  const pauseCustomAudio = () => {
    if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch (e) { /* */ } }
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    const ctx = audioCtxRef.current;
    if (ctx) audioOffsetRef.current = ctx.currentTime - audioStartTimeRef.current;
    setCustomAudioPlaying(false);
  };

  const saveToLibrary = async () => {
    if (!audioRawDataRef.current || !customAudioName || !customAudioReady) return;
    if (savedLibrary.length >= 3) {
      setLibraryMsg('Library full (max 3 tracks per room)');
      setTimeout(() => setLibraryMsg(''), 3000);
      return;
    }
    if (audioRawDataRef.current.byteLength > 3.5 * 1024 * 1024) {
      setLibraryMsg('Track too large to save (max ~3.5MB)');
      setTimeout(() => setLibraryMsg(''), 3000);
      return;
    }
    setLibrarySaving(true);
    try {
      const bytes = new Uint8Array(audioRawDataRef.current);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      const trackKey = `audio-trk:${currentRoom}:${Date.now()}`;
      await storage.set(trackKey, b64);
      const newEntry = { name: customAudioName, duration: customAudioDuration, key: trackKey };
      const newIdx = [...savedLibrary, newEntry];
      await storage.set(`audio-lib-idx:${currentRoom}`, JSON.stringify(newIdx));
      setSavedLibrary(newIdx);
      setCurrentSavedInLibrary(true);
      setLibraryMsg('Saved!');
      setTimeout(() => setLibraryMsg(''), 2000);
    } catch {
      setLibraryMsg('Could not save \u2014 file may be too large');
      setTimeout(() => setLibraryMsg(''), 3000);
    }
    setLibrarySaving(false);
  };

  const loadFromLibrary = async (track) => {
    if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch (e) { /* */ } }
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    setCustomAudioPlaying(false);
    setCustomAudioReady(false);
    setCustomAudioTime(0);
    setCustomAudioName(track.name);
    setLibraryMsg('Loading...');
    try {
      const result = await storage.get(track.key);
      if (!result) { setLibraryMsg('Track not found'); return; }
      const binary = atob(result.value);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const arrayBuffer = bytes.buffer;
      audioRawDataRef.current = arrayBuffer.slice(0);
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      audioBufferRef.current = buffer;
      audioOffsetRef.current = 0;
      setCustomAudioDuration(buffer.duration);
      setCustomAudioReady(true);
      setCurrentSavedInLibrary(true);
      setLibraryMsg('');
    } catch {
      setLibraryMsg('Could not load track');
      setTimeout(() => setLibraryMsg(''), 3000);
    }
  };

  const removeFromLibrary = async (idx) => {
    const track = savedLibrary[idx];
    if (!track) return;
    try {
      await storage.delete(track.key);
      const newIdx = savedLibrary.filter((_, i) => i !== idx);
      await storage.set(`audio-lib-idx:${currentRoom}`, JSON.stringify(newIdx));
      setSavedLibrary(newIdx);
    } catch { /* */ }
  };

  // Wall text click handler
  const onClickWallText = (idx) => {
    const texts = wallTextsRef.current[currentRoom] || [];
    const wt = texts[idx];
    if (!wt) return;
    // Wall text editing would go here - currently coming soon
  };

  // Arrange mode handlers
  const handleToggleArrange = () => {
    setArrangeMode(prev => {
      if (prev) {
        // Exiting arrange mode — deselect
        setSelectedFurniture(null);
      }
      return !prev;
    });
  };

  const handleRotateLeft = () => {
    if (!selectedFurniture) return;
    selectedFurniture.rotation.y -= Math.PI / 12;
    // Save layout
    const STORAGE_PREFIX = 'miniverse:furniture-layout:';
    const movables = movableObjectsRef.current || [];
    const data = {};
    movables.forEach(obj => {
      const id = obj.userData.furnitureId;
      if (!id) return;
      data[id] = { x: obj.position.x, y: obj.position.y, z: obj.position.z, ry: obj.rotation.y };
    });
    try { localStorage.setItem(STORAGE_PREFIX + currentRoom, JSON.stringify(data)); } catch (e) { /* */ }
    setSelectedFurniture({ ...selectedFurniture }); // force re-render
  };

  const handleRotateRight = () => {
    if (!selectedFurniture) return;
    selectedFurniture.rotation.y += Math.PI / 12;
    const STORAGE_PREFIX = 'miniverse:furniture-layout:';
    const movables = movableObjectsRef.current || [];
    const data = {};
    movables.forEach(obj => {
      const id = obj.userData.furnitureId;
      if (!id) return;
      data[id] = { x: obj.position.x, y: obj.position.y, z: obj.position.z, ry: obj.rotation.y };
    });
    try { localStorage.setItem(STORAGE_PREFIX + currentRoom, JSON.stringify(data)); } catch (e) { /* */ }
    setSelectedFurniture({ ...selectedFurniture });
  };

  const handleHeightChange = (value) => {
    if (!selectedFurniture) return;
    selectedFurniture.position.y = value;
    const STORAGE_PREFIX = 'miniverse:furniture-layout:';
    const movables = movableObjectsRef.current || [];
    const data = {};
    movables.forEach(obj => {
      const id = obj.userData.furnitureId;
      if (!id) return;
      data[id] = { x: obj.position.x, y: obj.position.y, z: obj.position.z, ry: obj.rotation.y };
    });
    try { localStorage.setItem(STORAGE_PREFIX + currentRoom, JSON.stringify(data)); } catch (e) { /* */ }
    setSelectedFurniture({ ...selectedFurniture });
  };

  const handleResetObject = () => {
    if (!selectedFurniture) return;
    ArrangeController.resetObject(selectedFurniture);
    const STORAGE_PREFIX = 'miniverse:furniture-layout:';
    const movables = movableObjectsRef.current || [];
    const data = {};
    movables.forEach(obj => {
      const id = obj.userData.furnitureId;
      if (!id) return;
      data[id] = { x: obj.position.x, y: obj.position.y, z: obj.position.z, ry: obj.rotation.y };
    });
    try { localStorage.setItem(STORAGE_PREFIX + currentRoom, JSON.stringify(data)); } catch (e) { /* */ }
    setSelectedFurniture({ ...selectedFurniture });
  };

  const handleResetAll = () => {
    ArrangeController.resetAll(currentRoom, movableObjectsRef);
    setSelectedFurniture(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative', background: '#0a0a0f', fontFamily: 'Georgia, serif' }}>
      <SceneManager
        currentRoom={currentRoom}
        wallTextsRef={wallTextsRef}
        wallTextMeshesRef={wallTextMeshesRef}
        clickableObjectsRef={clickableObjectsRef}
        movableObjectsRef={movableObjectsRef}
        sceneRef={sceneRef}
        cameraRef={cameraRef}
        onClickPanel={setSelectedWallPanel}
        onClickWallText={onClickWallText}
        arrangeMode={arrangeMode}
        onSelectFurniture={setSelectedFurniture}
        onDeselectFurniture={() => setSelectedFurniture(null)}
      />

      <HUD config={config} />

      {/* Arrange Mode Banner */}
      {arrangeMode && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'linear-gradient(135deg, rgba(180,140,30,0.85), rgba(120,90,20,0.85))',
          padding: '8px 16px', textAlign: 'center', zIndex: 100,
          borderBottom: '2px solid rgba(212,175,55,0.6)',
        }}>
          <span style={{ color: '#fff', fontSize: '13px', fontFamily: 'Georgia, serif', fontWeight: 'bold', letterSpacing: '1px' }}>
            ARRANGE MODE
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginLeft: '12px' }}>
            Click furniture to select {'\u2022'} Drag to move
          </span>
          <button onClick={handleToggleArrange} style={{
            marginLeft: '16px', padding: '3px 12px',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px', color: '#fff', fontSize: '11px', cursor: 'pointer',
          }}>Done</button>
        </div>
      )}

      {/* Arrange Toolbar */}
      {arrangeMode && selectedFurniture && (
        <ArrangeToolbar
          selectedFurniture={selectedFurniture}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onHeightChange={handleHeightChange}
          onResetObject={handleResetObject}
          onResetAll={handleResetAll}
        />
      )}

      {/* Wall Panel Overlay */}
      {selectedWallPanel && (
        <ContentModal panelId={selectedWallPanel} onClose={() => setSelectedWallPanel(null)} />
      )}

      {/* French Room hint */}
      {currentRoom === 'french' && !selectedWallPanel && !hintDismissed && (
        <div onClick={() => setHintDismissed(true)} style={{
          position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,20,25,0.85)', borderRadius: '10px', padding: '10px 18px',
          border: '1px solid rgba(212,175,55,0.25)', cursor: 'pointer',
        }}>
          <p style={{ margin: 0, color: '#d4af37', fontSize: '12px', textAlign: 'center' }}>
            Moli{'\u00e8'}re panel on the left wall {'\u2022'} Walk through the arch to the stage for the Com{'\u00e9'}die-Fran{'\u00e7'}aise
            <span style={{ color: '#666', fontSize: '10px', display: 'block', marginTop: '4px' }}>tap to dismiss</span>
          </p>
        </div>
      )}

      {/* Hide/Show Toggle */}
      <button onClick={() => setTabsVisible(!tabsVisible)} style={{
        position: 'absolute', top: '16px', right: '16px', padding: '6px 10px',
        background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px', color: '#888', fontSize: '10px', cursor: 'pointer', zIndex: 50,
      }}>
        {tabsVisible ? '\u25c0' : '\u25b6'}
      </button>

      {/* Toolbar */}
      <Toolbar
        config={config}
        iconSettings={iconSettings}
        tabsVisible={tabsVisible}
        setSettingsOpen={setSettingsOpen}
        settingsOpen={settingsOpen}
        setChatOpen={setChatOpen}
        setMiniverseInviteOpen={setMiniverseInviteOpen}
        setArchitectOpen={setArchitectOpen}
        architectOpen={architectOpen}
        setAudioMenuOpen={setAudioMenuOpen}
        setInviteModalOpen={setInviteModalOpen}
        setReggaeMenuOpen={setReggaeMenuOpen}
        setCustomAudioOpen={setCustomAudioOpen}
        customAudioOpen={customAudioOpen}
        customAudioPlaying={customAudioPlaying}
        setDoorMenuOpen={setDoorMenuOpen}
        doorMenuOpen={doorMenuOpen}
        comingSoonTip={comingSoonTip}
        setComingSoonTip={setComingSoonTip}
        arrangeMode={arrangeMode}
        onToggleArrange={handleToggleArrange}
      />

      {/* Door Menu */}
      {doorMenuOpen && (
        <NavigationMenu doors={config.doors} onNavigate={navigate} onClose={() => setDoorMenuOpen(false)} onCreateRoom={createRoom} />
      )}

      {/* Settings */}
      {settingsOpen && (
        <SettingsPanel iconSettings={iconSettings} setIconSettings={setIconSettings} onClose={() => setSettingsOpen(false)} />
      )}

      {/* Now Playing */}
      {isPlaying && currentTrack && (
        <NowPlaying currentTrack={currentTrack} stopPlayback={stopPlayback} />
      )}

      {/* Custom Audio Player */}
      <AudioPlayerUI
        customAudioOpen={customAudioOpen}
        onClose={() => setCustomAudioOpen(false)}
        customAudioName={customAudioName}
        customAudioReady={customAudioReady}
        customAudioPlaying={customAudioPlaying}
        customAudioDuration={customAudioDuration}
        customAudioTime={customAudioTime}
        playCustomAudio={playCustomAudio}
        pauseCustomAudio={pauseCustomAudio}
        handleAudioUpload={handleAudioUpload}
        savedLibrary={savedLibrary}
        loadFromLibrary={loadFromLibrary}
        removeFromLibrary={removeFromLibrary}
        saveToLibrary={saveToLibrary}
        librarySaving={librarySaving}
        libraryMsg={libraryMsg}
        currentSavedInLibrary={currentSavedInLibrary}
      />

      {/* Architect Panel */}
      <BuildWithClaude
        architectOpen={architectOpen}
        onClose={() => setArchitectOpen(false)}
        architectMessages={architectMessages}
        setArchitectMessages={setArchitectMessages}
        architectInput={architectInput}
        setArchitectInput={setArchitectInput}
        architectLoading={architectLoading}
        setArchitectLoading={setArchitectLoading}
        architectModel={architectModel}
        setArchitectModel={setArchitectModel}
        currentRoom={currentRoom}
        setEscalationOpen={setEscalationOpen}
        setEscalationSummary={setEscalationSummary}
      />

      {/* Escalation Modal */}
      {escalationOpen && (
        <EscalationModal onClose={() => setEscalationOpen(false)} escalationSummary={escalationSummary} />
      )}

      {/* Chat */}
      {chatOpen && (
        <ChatPanel chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} sendChatMessage={sendChatMessage} onClose={() => setChatOpen(false)} />
      )}

      {/* Audio Menu */}
      {audioMenuOpen && (
        <AudioMenu onClose={() => setAudioMenuOpen(false)} playTrack={playTrack} />
      )}

      {/* Invite */}
      {inviteModalOpen && <InviteModal onClose={() => setInviteModalOpen(false)} />}

      {/* Reggae */}
      {reggaeMenuOpen && <ReggaeMenu onClose={() => setReggaeMenuOpen(false)} />}

      {/* Connect */}
      {miniverseInviteOpen && <ConnectModal onClose={() => setMiniverseInviteOpen(false)} />}

      {/* Instructions */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: config.isExterior ? '#2d5a30' : '#6a6560', fontSize: '11px' }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>Drag to look around<br/>WASD to move</p>
      </div>
    </div>
  );
}
