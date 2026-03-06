import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as Tone from 'tone';

export default function MargaretsMiniverse() {
  const mountRef = useRef(null);
  const [currentRoom, setCurrentRoom] = useState('study');
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [reggaeMenuOpen, setReggaeMenuOpen] = useState(false);
  const [miniverseInviteOpen, setMiniverseInviteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { user: 'System', text: 'Welcome to this Miniverse! Chat with other guests here.', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
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
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = new, number = editing existing
  const [wallTexts, setWallTexts] = useState({});
  const wallTextsRef = useRef({});
  const wallTextMeshesRef = useRef([]); // track placed text meshes for clicking/removal
  const [editingText, setEditingText] = useState('');
  const [editingFont, setEditingFont] = useState('Georgia');
  const [editingSize, setEditingSize] = useState(48);
  const [editingColor, setEditingColor] = useState('#d4af37');
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const [architectOpen, setArchitectOpen] = useState(false);
  const [architectMessages, setArchitectMessages] = useState([]);
  const [architectInput, setArchitectInput] = useState('');
  const [architectLoading, setArchitectLoading] = useState(false);
  const [architectModel, setArchitectModel] = useState('claude-sonnet-4-20250514');
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [escalationSummary, setEscalationSummary] = useState('');
  const architectScrollRef = useRef(null);
  const [customAudioOpen, setCustomAudioOpen] = useState(false);
  const synthRef = useRef(null);
  const movementRef = useRef({ forward: false, backward: false, left: false, right: false });
  const clickableObjectsRef = useRef([]);

  const navigate = (room) => {
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (synthRef.current) synthRef.current.dispose();
      setIsPlaying(false);
      setCurrentTrack(null);
    }
    setAudioMenuOpen(false);
    setInviteModalOpen(false);
    setReggaeMenuOpen(false);
    setMiniverseInviteOpen(false);
    setChatOpen(false);
    setTextEditorOpen(false);
    setEditingIndex(null);
    setArchitectOpen(false);
    setEscalationOpen(false);
    setDoorMenuOpen(false);
    setSettingsOpen(false);
    setSelectedWallPanel(null);
    setHintDismissed(false);
    setCurrentRoom(room);
  };

  // Custom audio player - Web Audio API (bypasses sandbox blob URL restrictions)
  const [customAudioName, setCustomAudioName] = useState('');
  const [customAudioReady, setCustomAudioReady] = useState(false);
  const [customAudioPlaying, setCustomAudioPlaying] = useState(false);
  const [customAudioDuration, setCustomAudioDuration] = useState(0);
  const [customAudioTime, setCustomAudioTime] = useState(0);
  const [savedLibrary, setSavedLibrary] = useState([]); // [{name, duration}]
  const [librarySaving, setLibrarySaving] = useState(false);
  const [libraryMsg, setLibraryMsg] = useState('');
  const [currentSavedInLibrary, setCurrentSavedInLibrary] = useState(false);
  const audioCtxRef = useRef(null);
  const audioBufferRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioStartTimeRef = useRef(0);
  const audioOffsetRef = useRef(0);
  const audioTimerRef = useRef(null);
  const audioRawDataRef = useRef(null); // raw ArrayBuffer for saving to library

  // Load library index for current room
  const loadLibraryIndex = async () => {
    try {
      const result = await window.storage.get(`audio-lib-idx:${currentRoom}`);
      const idx = result ? JSON.parse(result.value) : [];
      setSavedLibrary(idx);
    } catch { setSavedLibrary([]); }
  };

  // Load library on room change
  React.useEffect(() => { loadLibraryIndex(); }, [currentRoom]);

  // Save current track to library
  const saveToLibrary = async () => {
    if (!audioRawDataRef.current || !customAudioName || !customAudioReady) return;
    if (savedLibrary.length >= 3) {
      setLibraryMsg('Library full (max 3 tracks per room)');
      setTimeout(() => setLibraryMsg(''), 3000);
      return;
    }
    const rawBytes = audioRawDataRef.current.byteLength;
    if (rawBytes > 3.5 * 1024 * 1024) {
      setLibraryMsg('Track too large to save (max ~3.5MB)');
      setTimeout(() => setLibraryMsg(''), 3000);
      return;
    }
    setLibrarySaving(true);
    try {
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(audioRawDataRef.current);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      // Save audio data
      const trackKey = `audio-trk:${currentRoom}:${Date.now()}`;
      await window.storage.set(trackKey, b64);
      // Update index
      const newEntry = { name: customAudioName, duration: customAudioDuration, key: trackKey };
      const newIdx = [...savedLibrary, newEntry];
      await window.storage.set(`audio-lib-idx:${currentRoom}`, JSON.stringify(newIdx));
      setSavedLibrary(newIdx);
      setCurrentSavedInLibrary(true);
      setLibraryMsg('Saved!');
      setTimeout(() => setLibraryMsg(''), 2000);
    } catch (err) {
      setLibraryMsg('Could not save — file may be too large');
      setTimeout(() => setLibraryMsg(''), 3000);
    }
    setLibrarySaving(false);
  };

  // Load a saved track from library
  const loadFromLibrary = async (track) => {
    // Stop current playback
    if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e){} }
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    setCustomAudioPlaying(false);
    setCustomAudioReady(false);
    setCustomAudioTime(0);
    setCustomAudioName(track.name);
    setLibraryMsg('Loading...');
    try {
      const result = await window.storage.get(track.key);
      if (!result) { setLibraryMsg('Track not found'); return; }
      // Decode base64 back to ArrayBuffer
      const binary = atob(result.value);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const arrayBuffer = bytes.buffer;
      audioRawDataRef.current = arrayBuffer.slice(0); // keep a copy
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

  // Remove a saved track
  const removeFromLibrary = async (idx) => {
    const track = savedLibrary[idx];
    if (!track) return;
    try {
      await window.storage.delete(track.key);
      const newIdx = savedLibrary.filter((_, i) => i !== idx);
      await window.storage.set(`audio-lib-idx:${currentRoom}`, JSON.stringify(newIdx));
      setSavedLibrary(newIdx);
    } catch {}
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e){} }
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    setCustomAudioPlaying(false);
    setCustomAudioReady(false);
    setCustomAudioTime(0);
    setCurrentSavedInLibrary(false);
    setCustomAudioName(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        audioRawDataRef.current = ev.target.result.slice(0); // keep copy for saving
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const buffer = await ctx.decodeAudioData(ev.target.result);
        audioBufferRef.current = buffer;
        audioOffsetRef.current = 0;
        setCustomAudioDuration(buffer.duration);
        setCustomAudioReady(true);
      } catch (err) {
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
    // Update time display
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    audioTimerRef.current = setInterval(() => {
      const t = ctx.currentTime - audioStartTimeRef.current;
      setCustomAudioTime(Math.min(t, audioBufferRef.current?.duration || 0));
    }, 250);
  };

  const pauseCustomAudio = () => {
    if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e){} }
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    const ctx = audioCtxRef.current;
    if (ctx) audioOffsetRef.current = ctx.currentTime - audioStartTimeRef.current;
    setCustomAudioPlaying(false);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const sendChatMessage = () => {
    if (chatInput.trim()) {
      setChatMessages(prev => [...prev, {
        user: 'You',
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
      setChatInput('');
    }
  };

  const getArchitectSystemPrompt = () => {
    return `You are the Architect — the creative lead inside Grapheon's Miniverse platform. You design features, envision solutions, and coordinate with the Grapheon Developer to build them. You have COMPLETE knowledge of this project's code, architecture, and current state.

## CRITICAL: WHO YOU ARE TALKING TO
The user is a CREATOR, not a developer. They do not code. They describe what they want in plain language, and the build team (you + the Developer) makes it happen.

## YOUR ROLE vs THE DEVELOPER'S ROLE
- YOU: Understand the user's vision. Design the solution. Write the technical brief. Communicate results back to the user.
- THE DEVELOPER: Receives your brief. Edits the actual code. Tests it. Delivers the working result.
- In the current environment, the Developer is a separate agent the user will relay your brief to. In production, this handoff will be automated and instant.

## HOW YOU WORK
1. User describes what they want in plain language.
2. You respond with a clear DESIGN DESCRIPTION of what you're going to build — in plain English. Describe how it will look, where it will appear, how it will behave. Paint the picture.
3. Behind the scenes, you prepare a complete technical specification (exact positions, materials, code patterns). Include this in your response ONLY inside a section clearly marked "## DEVELOPER SPEC" at the end — this section is for the Developer agent, not the user. The user can see it but it's clearly labeled as technical handoff.
4. End with: "I'll send this to the Developer to implement now." This sets the expectation that a build step follows.

## PLATFORM
Grapheon Miniverses are single-file React components using Three.js (imported as THREE) and Tone.js for audio. Everything runs in a browser artifact sandbox. The entire Miniverse is one component: MargaretsMiniverse in miniverse.jsx (~2300 lines).

## CURRENT STATE
The user is currently in the "${currentRoom}" room.
Rooms available: ${Object.keys(roomConfigs || {}).join(', ')}

## ARCHITECTURE
- Single useEffect rebuilds the entire Three.js scene when currentRoom changes
- Each room has a dedicated build function: buildStudy(), buildJamaica(), buildOpenSea(), buildCabin(), buildFrench(), buildVersailles(), buildOrangerie()
- Camera: perspective, orbital drag controls (theta/phi/radius), WASD movement in some rooms
- Raycasting system for clickable 3D objects (clickableObjectsRef)
- HTML overlay modals triggered by selectedWallPanel state

## ROOM DETAILS

### Scholar's Study (currentRoom='study')
- 14x8x14 room, warm wood/leather theme
- Materials: richWood (#3e2218), leather (#5c2a0a), velvet (#2a0a1a), brass, parchment (#f4e8c1)
- Objects: desk, bookshelves (6 shelves), fireplace with mantel, globe on brass stand, leather armchair, reading lamp, rug
- Lighting: ambient #1a1410, warm point light over desk, fireplace glow
- Walls at z=-7 (back), z=7 (front), x=-7 and x=7 (sides), floor y=0, ceiling y=8

### Jamaica Beach (currentRoom='jamaica')
- Large open scene, sandy beach + ocean
- Sand plane, palm trees (procedural trunks + frond geometry), ocean plane with blue material
- Beach bar with stools, surfboards, beach chairs
- Reggae audio streaming UI (not actual streaming — placeholder)
- Lighting: bright sun, sky blue ambient

### Open Sea (currentRoom='opensea')
- Vast ocean scene, ship deck
- Large water plane, wooden ship deck, masts, rigging
- Barrel props, crates, ship wheel
- Dramatic sky lighting

### Captain's Cabin (currentRoom='cabin')
- 12x8x12 interior room
- Dark wood walls, navigation desk, maps on walls
- Porthole windows (torus frames), lantern lighting
- Bookshelf, treasure chest, navigation instruments

### French Literature Wing (currentRoom='french')
- Long gallery: 30x10x20, extends to x=40 for theater stage
- Left wall (z=-9): Molière portrait (base64 texture in gold frame at x=-6,y=5), clickable Molière book panel (burgundy, gold frame at x=-3,y=5) → opens overlay with link to Complete Works PDF + YouTube video
- Gallery frames: paintings along walls using addFrame() and addSmallFrame() helpers
- Theater/stage area (x=30-40): raised wooden platform, gold proscenium arch with pillars, red velvet curtains with gold tiebacks, valance, stage spotlights, footlights
- Clickable Comédie-Française panel on stage back wall → overlay with YouTube link
- Materials: galleryWall (#e8e0d0), galleryTrim (#c9b896), richWood, goldMat (#d4af37), marbleMat
- Lighting: warm gallery spots, stage point lights

### Versailles Gardens (currentRoom='versailles')
- Massive outdoor: 200x200 ground plane
- Formal French garden: geometric hedges, gravel paths, fountain centerpiece
- Statuary, topiary, balustrades
- Palace facade backdrop
- Lighting: daylight ambient, sun directional

### Orangerie (currentRoom='orangerie')
- Glass-roofed conservatory
- Citrus trees in planters (procedural: trunk + sphere foliage + orange spheres)
- Cypress trees, stone floors, arched windows
- Warm interior lighting

## PATTERNS THE USER CAN REQUEST

### Clickable Wall Panels (Quainton Law Pattern)
1. Create a 3D mesh (BoxGeometry for frame + child mesh for face)
2. Set userData.panelId = 'someId'
3. Push to clickableObjectsRef.current
4. Add entry to wallPanels config object: { title, subtitle, icon, color, links: [{label, url}] }
5. Raycaster detects click → sets selectedWallPanel → HTML overlay renders with styled <a> buttons

### Image Textures
- Embed base64: const img = new Image(); img.onload = () => { tex = new THREE.Texture(img); tex.needsUpdate=true; ... }; img.src = 'data:image/jpeg;base64,...'
- External URL (needs CORS): new THREE.TextureLoader().load(url, callback)
- Host on Imgur, Wikimedia Commons, or Unsplash for CORS support

### Audio
- Mozart tracks: Tone.js synth sequences (synthRef, Tone.Transport)
- Reggae: streaming UI placeholder (reggaeMenuOpen state)

### Navigation
- Room tabs rendered conditionally based on roomConfigs
- navigate(roomKey) resets all state and sets currentRoom

### Wall Text (coming soon)
- Canvas-as-texture approach: draw on HTML canvas → THREE.CanvasTexture → PlaneGeometry with MeshBasicMaterial
- buildTextMesh() helper exists but the interactive editor needs work

## HOW YOU WORK

When a user requests a new feature or change:

1. **Acknowledge warmly and describe your vision.** Paint the picture in plain English — what it will look like, where it will appear, how it will behave. Be specific and enthusiastic. Keep this under 80 words.

2. **Be transparent about the build process.** Say something like: "To build this, I'm going to call in a Grapheon Developer. Together we'll get this implemented for you. If we hit anything unexpected, we may need to bring in a human developer, but let's see how we go."

3. **Provide a DEVELOPER BRIEF.** This is a clearly labeled technical section addressed to the Developer. It should contain:
   - What the user wants (plain language summary)
   - Exact technical spec: positions, materials, geometries, state variables, handler functions, JSX blocks
   - Which existing patterns to follow (e.g. "Use the Quainton Law pattern" or "Same approach as the Molière portrait")
   - Known gotchas to avoid (e.g. "Use MeshBasicMaterial not MeshStandard — lighting issues in the Study")
   - The current room context and any relevant room-specific details

4. **Close with a clear next step.** "I'll hand this to the Developer now — they'll build it and you should see the result shortly."

### If the user reports it doesn't work after the Developer builds it:
- "Sorry about that — let me send the Developer a revised brief." Then provide an updated DEVELOPER BRIEF addressing the most likely failure mode. ONE retry.

### If it fails a second time:
- "This one needs a human developer for a hands-on session. Let me prepare a brief." Then provide a structured summary for human escalation. STOP trying.

## ABSOLUTE RULES — NEVER VIOLATE THESE
1. NEVER tell the user to copy code, paste code, edit files, check consoles, open DevTools, or do anything technical.
2. NEVER ask to see code, files, or project structure.
3. NEVER ask "what error did you get?" or "did you save/refresh?"
4. NEVER pretend you can directly modify the Miniverse in this environment. Be honest that the Developer handles the build step.
5. NEVER do more than TWO attempts before escalating to human.
6. Keep the user-facing portion warm, non-technical, and under 80 words. The DEVELOPER BRIEF can be as detailed as needed.
7. The DEVELOPER BRIEF should be COMPLETE — the Developer should be able to implement without asking follow-up questions.`;
  };

  const sendArchitectMessage = async () => {
    if (!architectInput.trim() || architectLoading) return;
    const userMsg = architectInput.trim();
    setArchitectInput('');
    const newMessages = [...architectMessages, { role: 'user', content: userMsg }];
    setArchitectMessages(newMessages);
    setArchitectLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: architectModel,
          max_tokens: 2048,
          system: getArchitectSystemPrompt(),
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.map(b => b.type === 'text' ? b.text : '').filter(Boolean).join('\n') || 'Sorry, I couldn\'t generate a response.';
      setArchitectMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setArchitectMessages(prev => [...prev, { role: 'assistant', content: `Connection error: ${err.message}. Please try again.` }]);
    }
    setArchitectLoading(false);
    setTimeout(() => {
      if (architectScrollRef.current) architectScrollRef.current.scrollTop = architectScrollRef.current.scrollHeight;
    }, 50);
  };

  const mozartTracks = [
    {
      name: "Eine kleine Nachtmusik",
      notes: [
        { note: "G4", duration: "8n", time: 0 },
        { note: "D4", duration: "8n", time: 0.15 },
        { note: "G4", duration: "4n", time: 0.3 },
        { note: "D4", duration: "8n", time: 0.6 },
        { note: "G4", duration: "8n", time: 0.75 },
        { note: "B4", duration: "8n", time: 0.9 },
        { note: "D5", duration: "2n", time: 1.05 },
        { note: "C5", duration: "8n", time: 1.8 },
        { note: "A4", duration: "8n", time: 1.95 },
        { note: "C5", duration: "4n", time: 2.1 },
        { note: "A4", duration: "8n", time: 2.4 },
        { note: "F#4", duration: "8n", time: 2.7 },
        { note: "D4", duration: "2n", time: 3.0 },
      ],
      tempo: 140
    },
    {
      name: "Rondo alla Turca",
      notes: [
        { note: "B4", duration: "16n", time: 0 },
        { note: "A4", duration: "16n", time: 0.1 },
        { note: "G#4", duration: "16n", time: 0.2 },
        { note: "A4", duration: "8n", time: 0.3 },
        { note: "C5", duration: "4n", time: 0.5 },
        { note: "E5", duration: "4n", time: 1.0 },
        { note: "D5", duration: "8n", time: 1.4 },
        { note: "C5", duration: "4n", time: 1.6 },
      ],
      tempo: 130
    },
  ];

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

  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.dispose();
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 400;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    let camera;
    let theta = 0, phi = 0.3, radius = 10;
    clickableObjectsRef.current = [];

    if (currentRoom === 'study') {
      camera = buildStudy(scene, width, height);
      radius = 10; phi = 0.3;
    } else if (currentRoom === 'jamaica') {
      camera = buildJamaica(scene, width, height);
      radius = 25; phi = 0.35;
    } else if (currentRoom === 'opensea') {
      camera = buildOpenSea(scene, width, height);
      radius = 60; phi = 0.25;
    } else if (currentRoom === 'cabin') {
      camera = buildCabin(scene, width, height);
      radius = 10; phi = 0.3;
    } else if (currentRoom === 'french') {
      camera = buildFrench(scene, width, height);
      radius = 15; phi = 0.25;
      theta = 0;
    } else if (currentRoom === 'versailles') {
      camera = buildVersailles(scene, width, height);
      radius = 80; phi = 0.4;
    } else if (currentRoom === 'orangerie') {
      camera = buildOrangerie(scene, width, height);
      radius = 55; phi = 0.35;
    }

    // Store refs for wall text placement
    sceneRef.current = scene;
    cameraRef.current = camera;

    // Render any stored wall texts for this room
    wallTextMeshesRef.current = [];
    const roomTexts = wallTextsRef.current[currentRoom] || [];
    roomTexts.forEach((wt, idx) => {
      const mesh = buildTextMesh(wt, idx);
      scene.add(mesh);
      wallTextMeshesRef.current.push(mesh);
    });

    // Camera controls
    let isDragging = false, prevX = 0, prevY = 0;
    const updateCamera = () => {
      if (currentRoom === 'versailles') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 15;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        camera.lookAt(0, 0, -50);
      } else if (currentRoom === 'orangerie') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 8;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi) + 25;
        camera.lookAt(0, 6, 0);
      } else if (currentRoom === 'jamaica') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 4;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi) + 15;
        camera.lookAt(0, 2, 5);
      } else if (currentRoom === 'opensea') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 15;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi) + 30;
        camera.lookAt(0, 5, 0);
      } else if (currentRoom === 'cabin') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 2;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        camera.lookAt(0, 2, 0);
      } else if (currentRoom === 'french') {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi) - 8;
        camera.position.y = radius * Math.sin(phi) + 3;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        camera.lookAt(15, 5, 0);
      } else {
        camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
        camera.position.y = radius * Math.sin(phi) + 2;
        camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
        camera.lookAt(0, 2, 0);
      }
    };

    let dragDist = 0;
    const onMouseDown = (e) => { isDragging = true; dragDist = 0; prevX = e.clientX; prevY = e.clientY; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX, dy = e.clientY - prevY;
      dragDist += Math.abs(dx) + Math.abs(dy);
      theta -= dx * 0.008;
      phi = Math.max(0.1, Math.min(0.8, phi + dy * 0.008));
      updateCamera();
      prevX = e.clientX; prevY = e.clientY;
    };

    // Raycaster for clickable wall objects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
      if (dragDist > 5) { dragDist = 0; return; }
      dragDist = 0;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Check wall text meshes first
      if (wallTextMeshesRef.current.length > 0) {
        const textHits = raycaster.intersectObjects(wallTextMeshesRef.current);
        if (textHits.length > 0) {
          const idx = textHits[0].object.userData.wallTextIndex;
          if (idx !== undefined) {
            const texts = wallTextsRef.current[currentRoom] || [];
            const wt = texts[idx];
            if (wt) {
              setEditingText(wt.text);
              setEditingFont(wt.font);
              setEditingSize(wt.size);
              setEditingColor(wt.color);
              setEditingIndex(idx);
              setTextEditorOpen(true);
              return;
            }
          }
        }
      }

      // Then check clickable panels
      if (clickableObjectsRef.current.length === 0) return;
      const intersects = raycaster.intersectObjects(clickableObjectsRef.current);
      if (intersects.length > 0) {
        const panelId = intersects[0].object.userData.panelId;
        if (panelId) {
          setSelectedWallPanel(panelId);
        }
      }
    };

    renderer.domElement.addEventListener('click', onClick);

    // Hover cursor change for clickable objects
    const onHoverMove = (e) => {
      const allClickable = [...clickableObjectsRef.current, ...wallTextMeshesRef.current];
      if (allClickable.length === 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(allClickable);
      renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
    };

    renderer.domElement.addEventListener('mousemove', onHoverMove);

    // WASD movement controls
    let targetX = 0, targetZ = 0;
    const moveSpeed = 0.05;
    
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch(e.key.toLowerCase()) {
        case 'w': movementRef.current.forward = true; break;
        case 's': movementRef.current.backward = true; break;
        case 'a': movementRef.current.left = true; break;
        case 'd': movementRef.current.right = true; break;
      }
    };
    
    const onKeyUp = (e) => {
      switch(e.key.toLowerCase()) {
        case 'w': movementRef.current.forward = false; break;
        case 's': movementRef.current.backward = false; break;
        case 'a': movementRef.current.left = false; break;
        case 'd': movementRef.current.right = false; break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);

    const fireLight = scene.getObjectByName('fireLight');
    const fireGlow = scene.getObjectByName('fireGlow');

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      
      const move = movementRef.current;
      if (move.forward || move.backward || move.left || move.right) {
        const forward = new THREE.Vector3(-Math.sin(theta), 0, -Math.cos(theta));
        const right = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
        if (move.forward) { targetX += forward.x * moveSpeed; targetZ += forward.z * moveSpeed; }
        if (move.backward) { targetX -= forward.x * moveSpeed; targetZ -= forward.z * moveSpeed; }
        if (move.left) { targetX -= right.x * moveSpeed; targetZ -= right.z * moveSpeed; }
        if (move.right) { targetX += right.x * moveSpeed; targetZ += right.z * moveSpeed; }
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.z += (targetZ - camera.position.z) * 0.05;
      }
      
      if (fireLight) fireLight.intensity = 1.0 + Math.random() * 0.4;
      if (fireGlow) fireGlow.material.opacity = 0.5 + Math.random() * 0.2;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('mousemove', onHoverMove);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [currentRoom]);

  // ==========================================
  // ROOM BUILDERS
  // ==========================================

  function buildStudy(scene, width, height) {
    scene.background = new THREE.Color('#1a1a2a');
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 2, 0);

    scene.add(new THREE.AmbientLight('#ffd4a3', 0.3));
    const fireLight = new THREE.PointLight('#ff6622', 1.2, 15);
    fireLight.position.set(0, 1.5, -6);
    fireLight.name = 'fireLight';
    scene.add(fireLight);
    scene.add(new THREE.PointLight('#ffaa66', 0.6, 10).translateX(-4).translateY(3).translateZ(2));

    const darkWood = new THREE.MeshStandardMaterial({ color: '#2a1a0a', roughness: 0.7 });
    const richWood = new THREE.MeshStandardMaterial({ color: '#4a2a1a', roughness: 0.6 });
    const wall = new THREE.MeshStandardMaterial({ color: '#2a2a3d', roughness: 0.9 });
    const leather = new THREE.MeshStandardMaterial({ color: '#5a3020', roughness: 0.5 });
    const gold = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.8, roughness: 0.3 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: '#1a1a2a' }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const rug = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ color: '#4a2030' }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.01, 1);
    scene.add(rug);

    [['back', 0, 5, -7, 0], ['left', -7, 5, 0, Math.PI/2], ['right', 7, 5, 0, -Math.PI/2]].forEach(([, x, y, z, ry]) => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), wall);
      w.position.set(x, y, z);
      w.rotation.y = ry;
      scene.add(w);
    });

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), wall);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 10;
    scene.add(ceiling);

    const mantel = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 0.8), richWood);
    mantel.position.set(0, 4, -6.5);
    scene.add(mantel);

    const fireOpening = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3), new THREE.MeshBasicMaterial({ color: '#0a0505' }));
    fireOpening.position.set(0, 1.5, -6.9);
    scene.add(fireOpening);

    const fireGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 1.5),
      new THREE.MeshBasicMaterial({ color: '#ff4400', transparent: true, opacity: 0.6 })
    );
    fireGlow.position.set(0, 0.8, -6.85);
    fireGlow.name = 'fireGlow';
    scene.add(fireGlow);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), leather);
    seat.position.set(-2.5, 0.5, 2);
    scene.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.2), leather);
    back.position.set(-2.5, 1.1, 1.5);
    scene.add(back);

    const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 0.15), darkWood);
    shelfBack.position.set(-6.4, 3, -2);
    shelfBack.rotation.y = Math.PI / 2;
    scene.add(shelfBack);

    const bookColors = ['#8B0000', '#2F4F4F', '#4A5568', '#7C3238', '#6B4423'];
    for (let i = 0; i < 5; i++) {
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.4), new THREE.MeshStandardMaterial({ color: bookColors[i] }));
      book.position.set(-6.3, 1.5, -3.2 + i * 0.35);
      scene.add(book);
    }

    const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.15), gold);
    frame.position.set(0, 6, -6.85);
    scene.add(frame);

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.5, 2), richWood);
    doorFrame.position.set(-6.9, 1.75, 2);
    scene.add(doorFrame);

    const doorPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.2), new THREE.MeshStandardMaterial({ color: '#3a2a1a' }));
    doorPanel.position.set(-6.88, 1.75, 2);
    doorPanel.rotation.y = Math.PI / 2;
    scene.add(doorPanel);

    const doorWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), new THREE.MeshBasicMaterial({ color: '#40e0d0', transparent: true, opacity: 0.4 }));
    doorWindow.position.set(-6.86, 2.2, 2);
    doorWindow.rotation.y = Math.PI / 2;
    scene.add(doorWindow);

    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), gold);
    handle.position.set(-6.82, 1.5, 2.6);
    scene.add(handle);

    return camera;
  }

  function buildJamaica(scene, width, height) {
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 6, 35);
    camera.lookAt(0, 2, 5);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 32),
      new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color('#1e90ff') },
          horizonColor: { value: new THREE.Color('#87ceeb') },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 horizonColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            float blend = pow(max(h, 0.0), 0.4);
            gl_FragColor = vec4(mix(horizonColor, topColor, blend), 1.0);
          }
        `,
        side: THREE.BackSide,
      })
    );
    scene.add(sky);

    scene.add(new THREE.AmbientLight('#fff8f0', 0.6));
    const sun = new THREE.DirectionalLight('#fffae0', 1.0);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight('#87ceeb', '#f0e8d0', 0.4));

    const whiteSand = new THREE.MeshStandardMaterial({ color: '#faf8f0', roughness: 0.9 });
    const oceanDeep = new THREE.MeshStandardMaterial({ color: '#006994', roughness: 0.1, metalness: 0.3 });
    const oceanShallow = new THREE.MeshStandardMaterial({ color: '#40e0d0', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.9 });
    const foam = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });

    const beach = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), whiteSand);
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(0, 0, 10);
    beach.receiveShadow = true;
    scene.add(beach);

    const shallowWater = new THREE.Mesh(new THREE.PlaneGeometry(200, 30), oceanShallow);
    shallowWater.rotation.x = -Math.PI / 2;
    shallowWater.position.set(0, -0.1, -25);
    scene.add(shallowWater);

    const deepOcean = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), oceanDeep);
    deepOcean.rotation.x = -Math.PI / 2;
    deepOcean.position.set(0, -0.3, -180);
    scene.add(deepOcean);

    const createWave = (z, width, intensity) => {
      const waveGroup = new THREE.Group();
      const crest = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, 2), foam);
      crest.position.set(0, 0.15 * intensity, 0);
      waveGroup.add(crest);
      for (let i = 0; i < 20; i++) {
        const foamBit = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 6), foam);
        foamBit.position.set((Math.random() - 0.5) * width * 0.9, 0.1, (Math.random() - 0.5) * 3);
        foamBit.scale.y = 0.3;
        waveGroup.add(foamBit);
      }
      waveGroup.position.set(0, 0, z);
      scene.add(waveGroup);
    };

    createWave(-8, 180, 1.0);
    createWave(-18, 160, 0.8);
    createWave(-30, 140, 0.6);
    createWave(-45, 120, 0.5);
    createWave(-65, 100, 0.4);

    const shoreGradient = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 15),
      new THREE.MeshStandardMaterial({ color: '#e0f0f0', roughness: 0.5, transparent: true, opacity: 0.6 })
    );
    shoreGradient.rotation.x = -Math.PI / 2;
    shoreGradient.position.set(0, 0.02, -5);
    scene.add(shoreGradient);

    const wetSand = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 8),
      new THREE.MeshStandardMaterial({ color: '#d8d0c0', roughness: 0.6 })
    );
    wetSand.rotation.x = -Math.PI / 2;
    wetSand.position.set(0, 0.01, -2);
    scene.add(wetSand);

    const umbrellaColors = ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#f72585', '#4cc9f0'];
    const chairFabric = new THREE.MeshStandardMaterial({ color: '#f8f8f8', roughness: 0.8 });
    const woodLight = new THREE.MeshStandardMaterial({ color: '#c4a77d', roughness: 0.6 });

    const createBeachChair = (x, z, umbrellaColor) => {
      const chairGroup = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 2), woodLight);
      frame.position.set(0, 0.35, 0);
      chairGroup.add(frame);
      const legGeo = new THREE.BoxGeometry(0.08, 0.35, 0.08);
      [[-0.3, 0.175, -0.8], [0.3, 0.175, -0.8], [-0.3, 0.175, 0.8], [0.3, 0.175, 0.8]].forEach(pos => {
        const leg = new THREE.Mesh(legGeo, woodLight);
        leg.position.set(...pos);
        chairGroup.add(leg);
      });
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.9), woodLight);
      backrest.position.set(0, 0.6, -0.7);
      backrest.rotation.x = -0.5;
      chairGroup.add(backrest);
      const seatFabric = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.8), chairFabric);
      seatFabric.rotation.x = -Math.PI / 2;
      seatFabric.position.set(0, 0.42, 0);
      chairGroup.add(seatFabric);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), woodLight);
      pole.position.set(0.6, 1.25, -0.3);
      chairGroup.add(pole);
      const umbrellaGeo = new THREE.ConeGeometry(1.2, 0.4, 8, 1, true);
      const umbrellaMat = new THREE.MeshStandardMaterial({ color: umbrellaColor, side: THREE.DoubleSide });
      const umbrella = new THREE.Mesh(umbrellaGeo, umbrellaMat);
      umbrella.position.set(0.6, 2.4, -0.3);
      umbrella.rotation.x = Math.PI;
      chairGroup.add(umbrella);
      chairGroup.position.set(x, 0, z);
      chairGroup.rotation.y = -0.2 + Math.random() * 0.4;
      scene.add(chairGroup);
    };

    createBeachChair(-12, 2, umbrellaColors[0]);
    createBeachChair(-8, 1, umbrellaColors[1]);
    createBeachChair(-4, 2.5, umbrellaColors[2]);
    createBeachChair(4, 1.5, umbrellaColors[3]);
    createBeachChair(8, 2, umbrellaColors[4]);
    createBeachChair(12, 1, umbrellaColors[5]);

    const tinRoof = new THREE.MeshStandardMaterial({ color: '#7a8a8a', metalness: 0.6, roughness: 0.4 });
    const woodWall = new THREE.MeshStandardMaterial({ color: '#8b7355', roughness: 0.7 });

    const createStorefront = (x, z, width, storeColor) => {
      const store = new THREE.Group();
      const walls = new THREE.Mesh(new THREE.BoxGeometry(width, 3, 4), new THREE.MeshStandardMaterial({ color: storeColor, roughness: 0.8 }));
      walls.position.set(0, 1.5, 0);
      store.add(walls);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 1, 0.1, 5), tinRoof);
      roof.position.set(0, 3.2, 0.3);
      roof.rotation.x = 0.15;
      store.add(roof);
      const supportGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
      [[-width/2 + 0.3, 2.8, 2.2], [width/2 - 0.3, 2.8, 2.2]].forEach(pos => {
        const support = new THREE.Mesh(supportGeo, woodWall);
        support.position.set(...pos);
        store.add(support);
      });
      const opening = new THREE.Mesh(new THREE.PlaneGeometry(width - 1, 1.5), new THREE.MeshStandardMaterial({ color: '#2a2a2a' }));
      opening.position.set(0, 1.8, 2.01);
      store.add(opening);
      const counter = new THREE.Mesh(new THREE.BoxGeometry(width - 0.5, 0.15, 0.6), woodWall);
      counter.position.set(0, 1.1, 2.3);
      store.add(counter);
      store.position.set(x, 0, z);
      scene.add(store);
    };

    createStorefront(-15, 28, 6, '#e07050');
    createStorefront(0, 30, 7, '#50a0c0');
    createStorefront(15, 28, 6, '#e0c050');

    const tableMat = new THREE.MeshStandardMaterial({ color: '#f0e8d8', roughness: 0.6 });
    const chairMat = new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.7 });

    const createTableWithChairs = (x, z) => {
      const group = new THREE.Group();
      const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 16), tableMat);
      tableTop.position.set(0, 0.75, 0);
      group.add(tableTop);
      const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 8), chairMat);
      tableLeg.position.set(0, 0.35, 0);
      group.add(tableLeg);
      const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.08, 12), chairMat);
      tableBase.position.set(0, 0.04, 0);
      group.add(tableBase);
      group.position.set(x, 0, z);
      scene.add(group);
    };

    createTableWithChairs(-17, 23);
    createTableWithChairs(-13, 24);
    createTableWithChairs(-3, 25);
    createTableWithChairs(3, 25);
    createTableWithChairs(13, 23);
    createTableWithChairs(17, 24);

    // Stage
    const stageGroup = new THREE.Group();
    const stagePlatform = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 7), new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.7 }));
    stagePlatform.position.set(0, 0.6, 0);
    stageGroup.add(stagePlatform);

    ['#009b3a', '#fed100', '#000000'].forEach((color, i) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.35, 0.1), new THREE.MeshStandardMaterial({ color }));
      stripe.position.set(0, 1.0 - i * 0.35, 3.51);
      stageGroup.add(stripe);
    });

    const stageRoof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.12, 8), new THREE.MeshStandardMaterial({ color: '#a05030', roughness: 0.4, metalness: 0.5 }));
    stageRoof.position.set(0, 4.5, 0);
    stageGroup.add(stageRoof);

    [[-5, 3], [5, 3], [-5, -3], [5, -3]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.3, 8), new THREE.MeshStandardMaterial({ color: '#3a2a1a', roughness: 0.6 }));
      post.position.set(px, 2.85, pz);
      stageGroup.add(post);
    });

    stageGroup.position.set(32, 0, 10);
    stageGroup.rotation.y = -0.4;
    scene.add(stageGroup);

    // Boat
    const boatGroup = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 8), new THREE.MeshStandardMaterial({ color: '#f8f8f8', roughness: 0.4 }));
    hull.position.set(0, 0.4, 0);
    boatGroup.add(hull);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 7.5), new THREE.MeshStandardMaterial({ color: '#c49a6c', roughness: 0.6 }));
    deck.position.set(0, 1.05, 0);
    boatGroup.add(deck);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 3), new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.5 }));
    cabin.position.set(0, 1.85, -0.5);
    boatGroup.add(cabin);
    boatGroup.position.set(25, 0, -45);
    boatGroup.rotation.y = -0.3;
    scene.add(boatGroup);

    return camera;
  }

  function buildOpenSea(scene, width, height) {
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 15, 60);
    camera.lookAt(0, 5, 0);

    scene.background = new THREE.Color('#1e90ff');
    scene.add(new THREE.AmbientLight('#ffffff', 0.6));
    const sun = new THREE.DirectionalLight('#fffef8', 0.9);
    sun.position.set(20, 40, 20);
    scene.add(sun);

    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: '#1060a0', roughness: 0.3 }));
    ocean.rotation.x = -Math.PI / 2;
    scene.add(ocean);

    const boatGroup = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 18), new THREE.MeshStandardMaterial({ color: '#f5f5f0' }));
    hull.position.y = 1.5;
    boatGroup.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 18, 8), new THREE.MeshStandardMaterial({ color: '#5a4030' }));
    mast.position.set(0, 11, 0);
    boatGroup.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(8, 12), new THREE.MeshStandardMaterial({ color: '#fff8f0', side: THREE.DoubleSide }));
    sail.position.set(2, 10, 0);
    sail.rotation.y = Math.PI / 6;
    boatGroup.add(sail);
    const cabinSea = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 5), new THREE.MeshStandardMaterial({ color: '#6a5040' }));
    cabinSea.position.set(0, 4.5, -4);
    boatGroup.add(cabinSea);
    scene.add(boatGroup);

    // Dolphin
    const dolphinGroup = new THREE.Group();
    const dolphinBody = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), new THREE.MeshStandardMaterial({ color: '#4a6a7a' }));
    dolphinBody.scale.set(1, 0.7, 2.5);
    dolphinGroup.add(dolphinBody);
    const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 4), new THREE.MeshStandardMaterial({ color: '#3a5a6a' }));
    dorsalFin.position.set(0, 1, 0);
    dorsalFin.rotation.z = 0.2;
    dolphinGroup.add(dorsalFin);
    dolphinGroup.position.set(-35, 4, -25);
    dolphinGroup.rotation.z = 0.5;
    scene.add(dolphinGroup);

    // Whale tail
    const whaleTailGroup = new THREE.Group();
    const whaleMat = new THREE.MeshStandardMaterial({ color: '#2a3a4a' });
    const leftFluke = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 3), whaleMat);
    leftFluke.position.set(-3.5, 0, 0);
    leftFluke.rotation.z = 0.3;
    whaleTailGroup.add(leftFluke);
    const rightFluke = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 3), whaleMat);
    rightFluke.position.set(3.5, 0, 0);
    rightFluke.rotation.z = -0.3;
    whaleTailGroup.add(rightFluke);
    const tailStock = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.5, 6, 8), whaleMat);
    tailStock.position.set(0, -4, 0);
    whaleTailGroup.add(tailStock);
    whaleTailGroup.position.set(40, 10, -50);
    scene.add(whaleTailGroup);

    return camera;
  }

  function buildCabin(scene, width, height) {
    scene.background = new THREE.Color('#1a1a2a');
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 2, 0);

    scene.add(new THREE.AmbientLight('#ffd4a3', 0.25));
    scene.add(new THREE.PointLight('#ffaa66', 0.8, 12).translateX(-3).translateY(3).translateZ(2));
    scene.add(new THREE.PointLight('#ffaa66', 0.5, 10).translateX(3).translateY(3).translateZ(-2));
    scene.add(new THREE.PointLight('#4a90c0', 0.3, 8).translateZ(-6).translateY(3));

    const darkWood = new THREE.MeshStandardMaterial({ color: '#2a1a0a', roughness: 0.7 });
    const richWood = new THREE.MeshStandardMaterial({ color: '#4a2a1a', roughness: 0.6 });
    const wallMat = new THREE.MeshStandardMaterial({ color: '#3a3a4d', roughness: 0.9 });
    const brass = new THREE.MeshStandardMaterial({ color: '#b8962e', metalness: 0.7, roughness: 0.3 });
    const leather = new THREE.MeshStandardMaterial({ color: '#5a3020', roughness: 0.5 });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), richWood);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    [['back', 0, 4, -6, 0], ['left', -6, 4, 0, Math.PI/2], ['right', 6, 4, 0, -Math.PI/2]].forEach(([, x, y, z, ry]) => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), wallMat);
      w.position.set(x, y, z);
      w.rotation.y = ry;
      scene.add(w);
    });

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8;
    scene.add(ceiling);

    // Portholes
    const createPorthole = (x, y, z, rotY = 0) => {
      const pFrame = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.1, 12, 24), brass);
      pFrame.position.set(x, y, z);
      pFrame.rotation.y = rotY;
      scene.add(pFrame);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshStandardMaterial({ color: '#4a7090', transparent: true, opacity: 0.5 }));
      glass.position.set(x, y, z + 0.05);
      glass.rotation.y = rotY;
      scene.add(glass);
    };
    createPorthole(0, 4, -5.9);
    createPorthole(-5.9, 4, -2, Math.PI / 2);
    createPorthole(-5.9, 4, 2, Math.PI / 2);

    // Bookshelf
    const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 4), darkWood);
    shelfBack.position.set(-5.85, 2.5, -2);
    scene.add(shelfBack);
    for (let i = 0; i < 4; i++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 4), richWood);
      shelf.position.set(-5.6, 0.8 + i * 1.2, -2);
      scene.add(shelf);
    }

    const seaBooks = ['#1a3a5a', '#2a4a3a', '#4a2a1a', '#3a3a5a', '#5a3a2a', '#2a3a4a'];
    for (let row = 0; row < 3; row++) {
      for (let b = 0; b < 6; b++) {
        const bookHeight = 0.7 + Math.random() * 0.25;
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, bookHeight, 0.15 + Math.random() * 0.1),
          new THREE.MeshStandardMaterial({ color: seaBooks[(row * 6 + b) % seaBooks.length] })
        );
        book.position.set(-5.4, 1.2 + row * 1.2, -3.6 + b * 0.55);
        book.rotation.y = Math.PI / 2;
        scene.add(book);
      }
    }

    // Ship's wheel
    const wheelGroup = new THREE.Group();
    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.08, 12, 24), richWood);
    wheelGroup.add(wheelRim);
    const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 12), brass);
    wheelHub.rotation.x = Math.PI / 2;
    wheelGroup.add(wheelHub);
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), richWood);
      spoke.rotation.z = (i / 8) * Math.PI * 2;
      spoke.position.x = Math.cos((i / 8) * Math.PI * 2) * 0.35;
      spoke.position.y = Math.sin((i / 8) * Math.PI * 2) * 0.35;
      wheelGroup.add(spoke);
    }
    wheelGroup.position.set(0, 5.5, -5.85);
    scene.add(wheelGroup);

    // Desk
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.5), richWood);
    deskTop.position.set(3, 1.5, -2.5);
    scene.add(deskTop);
    const deskLegL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 1.3), richWood);
    deskLegL.position.set(1.6, 0.75, -2.5);
    scene.add(deskLegL);
    const deskLegR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 1.3), richWood);
    deskLegR.position.set(4.4, 0.75, -2.5);
    scene.add(deskLegR);

    // Chair
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), leather);
    seat.position.set(-2.5, 0.5, 2);
    scene.add(seat);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.2), leather);
    chairBack.position.set(-2.5, 1.1, 1.5);
    scene.add(chairBack);

    // Map on wall
    const mapFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 0.1), richWood);
    mapFrame.position.set(3, 4.5, -5.9);
    scene.add(mapFrame);
    const mapSurface = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshStandardMaterial({ color: '#d4c8a0' }));
    mapSurface.position.set(3, 4.5, -5.85);
    scene.add(mapSurface);

    return camera;
  }

  function buildFrench(scene, width, height) {
    scene.background = new THREE.Color('#1a1212');
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(-8, 4, 0);
    camera.lookAt(15, 5, 0);

    scene.add(new THREE.AmbientLight('#fffef8', 0.3));
    const theaterLight = new THREE.PointLight('#ffddaa', 1.2, 60);
    theaterLight.position.set(20, 8, 0);
    scene.add(theaterLight);
    const galleryLight1 = new THREE.PointLight('#fff8e0', 0.5, 15);
    galleryLight1.position.set(-10, 6, 0);
    scene.add(galleryLight1);
    const galleryLight2 = new THREE.PointLight('#fff8e0', 0.4, 12);
    galleryLight2.position.set(-8, 6, -6);
    scene.add(galleryLight2);

    const goldMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.7, roughness: 0.3 });
    const redVelvet = new THREE.MeshStandardMaterial({ color: '#7a2a3a', roughness: 0.9 });
    const creamMat = new THREE.MeshStandardMaterial({ color: '#f0e8d8', roughness: 0.7 });
    const wallCream = new THREE.MeshStandardMaterial({ color: '#e8e0d0', roughness: 0.8 });
    const darkWood = new THREE.MeshStandardMaterial({ color: '#3a2010', roughness: 0.6 });

    // Gallery floor
    const galleryFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 18),
      new THREE.MeshStandardMaterial({ color: '#b8956a', roughness: 0.6 })
    );
    galleryFloor.rotation.x = -Math.PI / 2;
    galleryFloor.position.set(-5, 0, 0);
    scene.add(galleryFloor);
    
    // Walls
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), wallCream);
    backWall.position.set(-15, 5, 0);
    backWall.rotation.y = Math.PI / 2;
    scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallCream);
    leftWall.position.set(-5, 5, -9);
    scene.add(leftWall);
    const rightWallBack = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), wallCream);
    rightWallBack.position.set(-11, 5, 9);
    rightWallBack.rotation.y = Math.PI;
    scene.add(rightWallBack);
    const galleryCeiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 18), wallCream);
    galleryCeiling.rotation.x = Math.PI / 2;
    galleryCeiling.position.set(-5, 10, 0);
    scene.add(galleryCeiling);

    // ==========================================
    // CLICKABLE WALL PANELS (Quainton Law style)
    // ==========================================

    // Molière Complete Works - clickable book panel on left wall, near the Comédie panel
    const moliereFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 3.2, 0.15),
      goldMat
    );
    moliereFrame.position.set(-3, 5, -8.92);
    scene.add(moliereFrame);

    const molierePanel = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.8, 0.2),
      new THREE.MeshStandardMaterial({ color: '#4a1a2a', roughness: 0.4, emissive: '#1a0a10', emissiveIntensity: 0.15 })
    );
    molierePanel.position.set(-3, 5, -8.85);
    molierePanel.userData = { panelId: 'moliere' };
    scene.add(molierePanel);
    clickableObjectsRef.current.push(molierePanel);

    // Gold title bar on Molière book panel
    const moliereTitle = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.4),
      new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.6, roughness: 0.3 })
    );
    moliereTitle.position.set(-3, 5.8, -8.82);
    moliereTitle.userData = { panelId: 'moliere' };
    scene.add(moliereTitle);
    clickableObjectsRef.current.push(moliereTitle);

    // Molière portrait - embedded base64 texture
    const moliereImg = new Image();
    moliereImg.onload = () => {
      const tex = new THREE.Texture(moliereImg);
      tex.needsUpdate = true;
      const pw = 2, ph = pw * (moliereImg.height / moliereImg.width);
      const pFrame = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.3, ph + 0.3, 0.15), goldMat);
      pFrame.position.set(-6, 5, -8.92);
      scene.add(pFrame);
      const pCanvas = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: tex }));
      pCanvas.position.set(-6, 5, -8.82);
      scene.add(pCanvas);
    };
    moliereImg.src = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCACdAIADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDmZJpdx/eP/wB9GmedL/z0f/vo09lzk1E1a3EP86TH+sf/AL6NIZ5P+ej/APfRqMnNFK4D/Ok/56N/30aPOk/vt+ZqOii4EnnSf32/Ojzn/vt+ZpgGaeIztzilcdg85/77fnSec/8Afb86DGeTjik2HGaLhYXzX/vt+dHmv/fb86jop3ESea/99vzo81/7zfnTKKLgP8x/7zfnTlkfj5m/Ooc1Ivai4izkEcDpUco4qZRhiO5qGUjHTmmMgpO1OxSHpSGJmgDNJT4xSAlijB5PFadtp7yIGCko3Aqlap51wqfw55z7V0un3zbVXyUMZO3KHp+FctabWxvTirFOfR2itd7DPPI9BWPdwhPudPbpXW3+qQWn7qQF3P8ACBWDqFxbTxErE0T47rjNRTlNPUuSTRhNwabUrrjmo67TlYlLSUtABUi9qj709eooEW+A6n2qKU5NPU5kA/CmSjrzTAgbrTSaU9aSkMM1JHjac0wDipU+6QelJjRqaGF+3Lvx904rpYoYYz8i8nNchpbbL+Mj6VvyXG9T5m+PqAVUk+/NcNde+dVLWIghjvJ55JRncSBzyB0qlqNqqROxfjAAX0xSWcotJX8yZpFYYBPQf4Uk8c9429B+7B4yepqVeMt9C3ZrYxpgAMjJqCrl3BPESZEIHr2qoRXfF3RxyVmJRRRVEh0p6dRTMU9OooEWUP77J7U2QluB3pVOJOf4hTHPpTAhpQpI4FWYrfPJxmpTGEPAyKzc0bxpNq5T2EdRQWJ6DFST/eJIxnoKjQbyRnHFMzas7I1NItx56lh1XIralMIAS4YrjowOM1HDaf6FFLCpLIuT7+o/SobyVJoNrDIIrgqXlO51Q0VkZ19MqgxwyMVPUk1rWdqptomJdtq/Lztrn2gMfzEHBOF960p9SeCCPywCQMNnsa0qQbSjEUZbtl69RWTZjr1ycg1zl3amE5UfL6elb0E8d3D5iH5u47iopoPODL39azpTdN2Zc4qcTm6Kt3doYDkD5SfyqM2zbM4Oe3Fd6kmrnG4NOxCKcvUU0dacvWqIJgfnz6VYjt85ZvXgVDEm6UfWtQAdPxrOpKx0UKfM7sjWPalMcYFTueMVUu3ICEcYNc8btnbK0YlO4X962OgNPhjIRyQc7TTocu+49zk1ZxgsOxFbOVtDmhTUveOo0JidMUE4cCsqby7jUJFiK7OM7TkE45xVvSLuM2qRsdu8YJ7g4xVW6s/sVxujYbHOAPQ1g3eIRVmV7mEhHfacL8qk9M/5zWNeb0O0n5evWuvuLZSIYiSQHy3ucVzOsoscoVfUjp6VVF62ZFTa5St2kEg8tip9RXTaaZTGPO5J6HHUVz1jEzzrjgDqfSuqtdr9eFXn8KWId9ApXSuVLyzaXOQNpPA9ap6qiR2A678jawPX2Nac9yrS4UHYn8R/wrP1CYTRuiJhW7kfyqIXTRUtUc/T16ipbi38oK2etRJ1ruTucrVjRtY/m3flVsn5vSkh2hRiiTlTiuebuz0KUeWINiqF78q496smXH3uGqndNvkxngGiEWmKrJOI63HFWN2Bn0qKHhRipT1+tOW5VPSI+1mMblf4eorTt5zdyJFK25lcEH1AFYsqlQrDp0NJHctBcgoTgHIqXC+qMZvldmddeSKt3DGQMAH8zxXHa1L5moPjoDgVrHUVnmM2AQi8D3NYFy2+dj6mqpr3mzKb90taeyrjd0PWtuK9BJEKkuOBxxWBbjac9hmtrR48ENJnLHJ9qiqluzSOyNiO3CwM0qhpH69OtULqIZjBAwpweK25fmWTGeoxVFkEk75OckHkfpWTVgTOYv8AHzJ1KZFZ+MNWzqPlnzWGCzNmshyDJxXXSd0Y1VqapIyMZwOKfuHTOKhnkEZwB061GZJGJIUAe9ZuLZ3RnFaDrlfl3gjIqgxBYAfjViSViMMR+dQMMPuXvWkFZanPVkpO6LEXSp2IxVWNyMCrCrk5zzUSNqTurICSKiuYcoWTgjmrLADk1FkuxGAF71KfVFVIq1mVYwY4jIT9B71HFGWbc3TrUs0iu+OAo4AowWQbeFzitjj5bsliyBux+FW4bzZKvPykVAnyrzUcikrujPvismlJ6nTKLSVjpI9TRDkfMSMjHTNZWo6tJGxVG5bqFOMD3NZ0c068L1/vHmoZVwTuOSeSaUaVnqYybtdBJcySE5wAfSo05bim5ycCnp8v4nFdKVjnepcxvcnrzU6gA4xmoI3wQPU1MeT/ACrGe5209riMgIHOPwqKSEqpYEDHrVnhVyabHA8xDZzu6KB0qVKxdRJFRJFzhlDfSp4mwSBjB9e1WX01yvMLq3Y7etZ/lSxSFXU+2aq8ZbGCbiyd97dQRQy5QrnGepqSHcwIkwR9aSWFwCUPHtU31saX7lcWoznOaPunAAwOpPrSESltqkn15prQsq/M4A9OtX6slK2qQssuBUS3DBuQMelMmYcAHpTd/GKpRVjGVR825aSSMndux7Ghwj9CPzqoCpPI7U8RgrkNgUcth+1bVrBhY2znJ9BQG3Pk/lTdhxmlRcMM1aMWyQthhirccnzLnsMmqOfmGe1PRj8wzSlG5rCfKXow95OIkbbu7nsK63T9Kht0G4AsOrc81yWluqXGWJGOc11kN4fLBVztHViK5p2Tt0NLuWpJOjkkIcj0IrNu7eJOZvnYjgYzzWi04iUlVLSP93NV2KvMwaUOVGD6A+1ZSstRq5zrWjyyEQqcZ75GKtxWUyxfPICR2xmtU/KOg4/WoLg5QDH1ArOVWT0NImTexFIvMUFT3XH8qxpJdx7n3rpJnOwhWDgDlW61kSQQiQnYSByR0rpoz01IqqTWhQDAjBAppx2FaUdraTDCMAT33HimvpTAZ8z9K2VSN7HM4MzsUvIFWHspEHy4b6VWOa0TT2JasKGIqaN/nGeagp6feFOwrkjoMnB5pqNg5qUdcUxxhqCnpqizZlQGYuQ3sa27O7hjKAkuSe5rnFJHHH5VNASJQc89KxnT5tS1USVrHVXE4G1YlDvIM9en5dqyjLNHdvslTGPmBGcmmz3LWkgjiUAkct3qmnyymU/NIDncaxjTvqzRztsbMLSyrnafwqNwVYlVkGOTjnNXLVykMbgAiTA2nt+NS3z+RZmRQNxYDpWXIr6FqbMKczStgRtj1+7iofstzKTlFbHVS2DV9Jy0i+YqsG9OMVLJCo+ZSVPsau/LsJtszrTTZUky5UY7CtFcKu0nOOwpYmLyhGPI70lziONn5OO2etS25PUVkkQzJG5yPlb1FZ89lE7FixjbvgZWnrfcf6ofnRLdNsUhFBOema2jGcSHysy5YhG5UMr47r0oRTkcVKxMshZiOewGKcVww9zXSjBn/9k=';

    // Additional gallery frames (non-clickable decoration)
    const addFrame = (x, y, z, rotY, color) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 2), goldMat);
      frame.position.set(x, y, z);
      frame.rotation.y = rotY;
      scene.add(frame);
      const canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 2.1),
        new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
      );
      canvas.position.set(x + (rotY === Math.PI/2 ? 0.1 : 0), y, z);
      canvas.rotation.y = rotY;
      scene.add(canvas);
    };
    
    // Left wall - decorative frame where Comédie panel used to be
    addFrame(-8, 5, -8.9, 0, '#3a2a3a');
    addFrame(-14.9, 5, 0, Math.PI/2, '#3a2a2a');
    addFrame(-14.9, 5, 4, Math.PI/2, '#2a2a3a');

    const addSmallFrame = (x, y, z, rotY, color) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1), goldMat);
      frame.position.set(x, y, z);
      frame.rotation.y = rotY;
      scene.add(frame);
      const canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.9),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
      );
      canvas.position.set(x + (rotY === Math.PI/2 ? 0.08 : 0), y, z);
      canvas.rotation.y = rotY;
      scene.add(canvas);
    };
    
    addSmallFrame(-14.9, 3, -2, Math.PI/2, '#5a4a3a');
    addSmallFrame(-14.9, 3, 6, Math.PI/2, '#4a4a5a');
    addSmallFrame(-14.9, 7, -2, Math.PI/2, '#3a4a4a');
    addSmallFrame(-14.9, 7, 2, Math.PI/2, '#5a3a4a');
    
    // Left wall frames
    addFrame(-2, 5, -8.9, 0, '#2a3a3a');

    // Bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 1), redVelvet);
    bench.position.set(-10, 0.6, 0);
    scene.add(bench);
    const benchBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 1.2), darkWood);
    benchBase.position.set(-10, 0.2, 0);
    scene.add(benchBase);

    // Gilded archway
    const archLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10, 1), goldMat);
    archLeft.position.set(5, 5, -7);
    scene.add(archLeft);
    const archRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10, 1), goldMat);
    archRight.position.set(5, 5, 7);
    scene.add(archRight);
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 15), goldMat);
    archTop.position.set(5, 9.5, 0);
    scene.add(archTop);

    // Theater
    const theaterFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 25),
      new THREE.MeshStandardMaterial({ color: '#7a2222', roughness: 0.8 })
    );
    theaterFloor.rotation.x = -Math.PI / 2;
    theaterFloor.position.set(20, 0, 0);
    scene.add(theaterFloor);
    
    const aisle = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 20),
      new THREE.MeshStandardMaterial({ color: '#aa3333', roughness: 0.7 })
    );
    aisle.rotation.x = -Math.PI / 2;
    aisle.position.set(15, 0.01, 0);
    scene.add(aisle);

    const seatMat = new THREE.MeshStandardMaterial({ color: '#5a1818', roughness: 0.8 });
    for (let row = 0; row < 6; row++) {
      for (let seat = 0; seat < 8; seat++) {
        if (Math.abs(seat - 3.5) < 0.6) continue;
        const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), seatMat);
        seatMesh.position.set(8 + row * 1.5, 0.25, (seat - 3.5) * 1.2);
        scene.add(seatMesh);
        const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.5), seatMat);
        seatBack.position.set(8 + row * 1.5 - 0.35, 0.6, (seat - 3.5) * 1.2);
        scene.add(seatBack);
      }
    }
    
    for (let tier = 0; tier < 3; tier++) {
      const tierY = 3 + tier * 2.5;
      const tierDepth = 28 - tier * 1;
      const balconyFront = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 16), creamMat);
      balconyFront.position.set(tierDepth, tierY, 0);
      scene.add(balconyFront);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 16.2), goldMat);
      trim.position.set(tierDepth, tierY + 0.75, 0);
      scene.add(trim);
      for (let p = 0; p < 7; p++) {
        const pz = (p - 3) * 2.2;
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 1.4), new THREE.MeshStandardMaterial({ color: '#e8dcc8' }));
        panel.position.set(tierDepth + 0.2, tierY, pz);
        scene.add(panel);
        const accent = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.4), goldMat);
        accent.position.set(tierDepth + 0.22, tierY, pz);
        scene.add(accent);
      }
    }
    
    const royalBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 4), goldMat);
    royalBox.position.set(26, 9, 0);
    scene.add(royalBox);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 8), goldMat);
    crown.position.set(26, 10.8, 0);
    scene.add(crown);

    // ==========================================
    // PROSCENIUM STAGE (far end of theater)
    // ==========================================

    const stageX = 34;

    // Stage wall (back of theater)
    const stageWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshStandardMaterial({ color: '#1a0a0a', roughness: 0.95 }));
    stageWall.position.set(stageX + 1, 6, 0);
    stageWall.rotation.y = -Math.PI / 2;
    scene.add(stageWall);

    // Raised stage platform
    const stagePlatform = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.2, 14),
      new THREE.MeshStandardMaterial({ color: '#3a2010', roughness: 0.6 })
    );
    stagePlatform.position.set(stageX - 2, 0.6, 0);
    scene.add(stagePlatform);

    // Stage floor (polished wood)
    const stageFloorTop = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 14),
      new THREE.MeshStandardMaterial({ color: '#5a3a20', roughness: 0.4 })
    );
    stageFloorTop.rotation.x = -Math.PI / 2;
    stageFloorTop.rotation.z = Math.PI / 2;
    stageFloorTop.position.set(stageX - 2, 1.21, 0);
    scene.add(stageFloorTop);

    // Proscenium arch — grand gold frame
    const proscLeft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 11, 1.5), goldMat);
    proscLeft.position.set(stageX - 4.5, 5.5, -7);
    scene.add(proscLeft);
    const proscRight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 11, 1.5), goldMat);
    proscRight.position.set(stageX - 4.5, 5.5, 7);
    scene.add(proscRight);
    const proscTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 15.5), goldMat);
    proscTop.position.set(stageX - 4.5, 11, 0);
    scene.add(proscTop);

    // Decorative cornice on proscenium
    const proscCornice = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 16), goldMat);
    proscCornice.position.set(stageX - 4.5, 11.8, 0);
    scene.add(proscCornice);

    // Ornamental crest above proscenium
    const crest = new THREE.Mesh(new THREE.ConeGeometry(1, 1.5, 6), goldMat);
    crest.position.set(stageX - 4.5, 12.8, 0);
    scene.add(crest);

    // Red velvet curtains — left drape
    const curtainMat = new THREE.MeshStandardMaterial({ color: '#6a1515', roughness: 0.9 });
    const curtainGathered = new THREE.MeshStandardMaterial({ color: '#8a2020', roughness: 0.85 });

    // Left curtain — gathered to side
    const leftCurtainMain = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 3), curtainMat);
    leftCurtainMain.position.set(stageX - 3.5, 5.5, -5.5);
    scene.add(leftCurtainMain);
    // Gathered folds
    const leftGather = new THREE.Mesh(new THREE.BoxGeometry(0.6, 10, 1.5), curtainGathered);
    leftGather.position.set(stageX - 3.2, 5.5, -6.5);
    scene.add(leftGather);
    // Tieback (gold rope)
    const leftTie = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 16, Math.PI), goldMat);
    leftTie.position.set(stageX - 3.3, 4, -5);
    leftTie.rotation.y = Math.PI / 2;
    leftTie.rotation.z = Math.PI / 2;
    scene.add(leftTie);

    // Right curtain — gathered to side
    const rightCurtainMain = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 3), curtainMat);
    rightCurtainMain.position.set(stageX - 3.5, 5.5, 5.5);
    scene.add(rightCurtainMain);
    const rightGather = new THREE.Mesh(new THREE.BoxGeometry(0.6, 10, 1.5), curtainGathered);
    rightGather.position.set(stageX - 3.2, 5.5, 6.5);
    scene.add(rightGather);
    const rightTie = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 16, Math.PI), goldMat);
    rightTie.position.set(stageX - 3.3, 4, 5);
    rightTie.rotation.y = Math.PI / 2;
    rightTie.rotation.z = -Math.PI / 2;
    scene.add(rightTie);

    // Valance (top curtain swag)
    const valance = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 12), curtainMat);
    valance.position.set(stageX - 4, 10.5, 0);
    scene.add(valance);
    // Scalloped fringe
    for (let i = 0; i < 7; i++) {
      const scallop = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: '#7a1818', roughness: 0.8 })
      );
      scallop.position.set(stageX - 4, 9.8, -5.4 + i * 1.8);
      scallop.rotation.x = Math.PI;
      scene.add(scallop);
    }
    // Gold fringe along valance bottom
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 12), goldMat);
    fringe.position.set(stageX - 4.1, 9.65, 0);
    scene.add(fringe);

    // Stage spotlights (warm glow)
    const stageSpot1 = new THREE.PointLight('#ffddaa', 0.8, 20);
    stageSpot1.position.set(stageX - 2, 10, -3);
    scene.add(stageSpot1);
    const stageSpot2 = new THREE.PointLight('#ffddaa', 0.8, 20);
    stageSpot2.position.set(stageX - 2, 10, 3);
    scene.add(stageSpot2);
    // Footlights
    const footlightMat = new THREE.MeshBasicMaterial({ color: '#ffeecc' });
    for (let i = 0; i < 5; i++) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), footlightMat);
      fl.position.set(stageX - 4.8, 1.3, -3.2 + i * 1.6);
      scene.add(fl);
    }

    // ==========================================
    // CLICKABLE PANEL — center stage on back wall
    // ==========================================
    const comedieFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 4.5, 6),
      goldMat
    );
    comedieFrame.position.set(stageX + 0.9, 5.5, 0);
    comedieFrame.rotation.y = 0;
    scene.add(comedieFrame);

    const comediePanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 4, 5.5),
      new THREE.MeshStandardMaterial({ color: '#5a1a1a', roughness: 0.7, emissive: '#2a0808', emissiveIntensity: 0.15 })
    );
    comediePanel.position.set(stageX + 0.95, 5.5, 0);
    comediePanel.userData = { panelId: 'comedie' };
    scene.add(comediePanel);
    clickableObjectsRef.current.push(comediePanel);
    
    const theaterCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 25),
      new THREE.MeshStandardMaterial({ color: '#e8dcd0', roughness: 0.7 })
    );
    theaterCeiling.rotation.x = Math.PI / 2;
    theaterCeiling.position.set(20, 12, 0);
    scene.add(theaterCeiling);
    
    [{ x: 18, z: -4 }, { x: 18, z: 4 }, { x: 24, z: 0 }].forEach(pos => {
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffffdd' }));
      light.position.set(pos.x, 11, pos.z);
      scene.add(light);
      const pl = new THREE.PointLight('#ffeecc', 0.25, 10);
      pl.position.set(pos.x, 11, pos.z);
      scene.add(pl);
    });

    return camera;
  }

  function buildVersailles(scene, width, height) {
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 25, 60);
    camera.lookAt(0, 0, -50);

    scene.add(new THREE.Mesh(new THREE.SphereGeometry(500, 32, 32), new THREE.MeshBasicMaterial({ color: '#87CEEB', side: THREE.BackSide })));
    scene.add(new THREE.AmbientLight('#fffef8', 0.5));
    const sun = new THREE.DirectionalLight('#fffae0', 0.9);
    sun.position.set(20, 40, 30);
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 600), new THREE.MeshStandardMaterial({ color: '#4a6b35' }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -150;
    scene.add(ground);

    const parterre = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), new THREE.MeshStandardMaterial({ color: '#d4c9b0' }));
    parterre.rotation.x = -Math.PI / 2;
    parterre.position.set(0, 0.02, 20);
    scene.add(parterre);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(8, 0.4, 8, 32), new THREE.MeshStandardMaterial({ color: '#a8a090' }));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 0.3, 0);
    scene.add(rim);
    const water = new THREE.Mesh(new THREE.CircleGeometry(7.5, 32), new THREE.MeshStandardMaterial({ color: '#5a7a8a', metalness: 0.3 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.15, 0);
    scene.add(water);

    const canal = new THREE.Mesh(new THREE.PlaneGeometry(15, 250), new THREE.MeshStandardMaterial({ color: '#4a6a7a', metalness: 0.4 }));
    canal.rotation.x = -Math.PI / 2;
    canal.position.set(0, 0.01, -180);
    scene.add(canal);

    const treeWall = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 200), new THREE.MeshStandardMaterial({ color: '#2d4a25' }));
    treeWall.position.set(-50, 6, -60);
    scene.add(treeWall);
    const treeWall2 = treeWall.clone();
    treeWall2.position.set(50, 6, -60);
    scene.add(treeWall2);

    return camera;
  }

  function buildOrangerie(scene, width, height) {
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 5, 45);
    camera.lookAt(0, 8, -20);

    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color('#6a9fd4') },
        horizonColor: { value: new THREE.Color('#c8d8e8') },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          float blend = pow(max(h, 0.0), 0.5);
          gl_FragColor = vec4(mix(horizonColor, topColor, blend), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    scene.add(new THREE.AmbientLight('#fff8f0', 0.4));
    const sun = new THREE.DirectionalLight('#fffae0', 1.0);
    sun.position.set(40, 60, 30);
    sun.castShadow = true;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight('#87ceeb', '#3d5c2e', 0.3));

    const limestone = new THREE.MeshStandardMaterial({ color: '#e8dcc0', roughness: 0.65 });
    const limestoneDark = new THREE.MeshStandardMaterial({ color: '#d0c4a8', roughness: 0.6 });
    const limestoneLight = new THREE.MeshStandardMaterial({ color: '#f0e8d8', roughness: 0.7 });
    const windowDark = new THREE.MeshStandardMaterial({ color: '#3a4550', roughness: 0.3 });
    const planterGreen = new THREE.MeshStandardMaterial({ color: '#5a8a7a', roughness: 0.5 });
    const foliageLight = new THREE.MeshStandardMaterial({ color: '#4a7a3a', roughness: 0.9 });
    const foliageDark = new THREE.MeshStandardMaterial({ color: '#2d4a25', roughness: 0.9 });
    const gravel = new THREE.MeshStandardMaterial({ color: '#d4c8b0', roughness: 0.9 });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: '#4a6a38' }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    scene.add(ground);

    const parterre = new THREE.Mesh(new THREE.BoxGeometry(90, 0.3, 45), gravel);
    parterre.position.set(0, 0.15, 0);
    scene.add(parterre);

    // Reflecting pool
    const poolWidth = 50, poolLength = 35, rimHeight = 0.8, poolCenterZ = 32;
    const borderMat = new THREE.MeshStandardMaterial({ color: '#b8a890', roughness: 0.6 });
    const frontBorder = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + 2, rimHeight, 1.5), borderMat);
    frontBorder.position.set(0, rimHeight / 2, poolCenterZ + poolLength / 2 + 0.75);
    scene.add(frontBorder);
    const backBorder = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + 2, rimHeight, 1.5), borderMat);
    backBorder.position.set(0, rimHeight / 2, poolCenterZ - poolLength / 2 - 0.75);
    scene.add(backBorder);
    const leftBorder = new THREE.Mesh(new THREE.BoxGeometry(1.5, rimHeight, poolLength + 2), borderMat);
    leftBorder.position.set(-poolWidth / 2 - 0.75, rimHeight / 2, poolCenterZ);
    scene.add(leftBorder);
    const rightBorder = new THREE.Mesh(new THREE.BoxGeometry(1.5, rimHeight, poolLength + 2), borderMat);
    rightBorder.position.set(poolWidth / 2 + 0.75, rimHeight / 2, poolCenterZ);
    scene.add(rightBorder);

    const waterSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(poolWidth, poolLength),
      new THREE.MeshStandardMaterial({ color: '#4a90b8', roughness: 0.1, metalness: 0.3 })
    );
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.set(0, rimHeight - 0.15, poolCenterZ);
    scene.add(waterSurface);

    // L-shaped arcade
    const createArcadeWing = (startX, startZ, length, rotation, numArches) => {
      const wingGroup = new THREE.Group();
      const archWidth = length / numArches;
      const arcadeHeight = 11;
      const bWall = new THREE.Mesh(new THREE.BoxGeometry(length + 4, arcadeHeight, 2), limestone);
      bWall.position.set(length / 2, arcadeHeight / 2, -4);
      wingGroup.add(bWall);
      for (let i = 0; i < numArches; i++) {
        const bayX = archWidth / 2 + i * archWidth;
        const openingWidth = archWidth - 1.8;
        const openingHeight = 8;
        const archVoid = new THREE.Mesh(new THREE.PlaneGeometry(openingWidth, openingHeight), windowDark);
        archVoid.position.set(bayX, openingHeight / 2 + 0.5, 0.1);
        wingGroup.add(archVoid);
        const archTopMesh = new THREE.Mesh(new THREE.CircleGeometry(openingWidth / 2, 24, 0, Math.PI), windowDark);
        archTopMesh.position.set(bayX, openingHeight + 0.5, 0.1);
        wingGroup.add(archTopMesh);
        if (i > 0) {
          const pilaster = new THREE.Mesh(new THREE.BoxGeometry(1.2, arcadeHeight, 0.6), limestoneLight);
          pilaster.position.set(i * archWidth, arcadeHeight / 2, 0);
          wingGroup.add(pilaster);
        }
      }
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(length + 4, 1, 1.5), limestoneDark);
      cornice.position.set(length / 2, arcadeHeight + 0.5, 0.25);
      wingGroup.add(cornice);
      wingGroup.rotation.y = rotation;
      wingGroup.position.set(startX, 0, startZ);
      scene.add(wingGroup);
    };

    createArcadeWing(-35, -18, 70, 0, 9);
    createArcadeWing(-35, -18, 35, Math.PI / 2, 4);
    createArcadeWing(35, -18, 35, -Math.PI / 2, 4);

    const palaceFacade = new THREE.Mesh(new THREE.BoxGeometry(85, 20, 3), limestone);
    palaceFacade.position.set(0, 24, -25);
    scene.add(palaceFacade);

    // Citrus trees
    const createCitrusTree = (x, z, scale = 1) => {
      const tree = new THREE.Group();
      const planterH = 1.1 * scale;
      const planterW = 1.3 * scale;
      const box = new THREE.Mesh(new THREE.BoxGeometry(planterW, planterH, planterW), planterGreen);
      box.position.y = planterH / 2 + 0.3;
      tree.add(box);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.14 * scale, 1.2 * scale, 8), new THREE.MeshStandardMaterial({ color: '#5a4a3a' }));
      trunk.position.y = planterH + 0.9 * scale;
      tree.add(trunk);
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.6 * scale, 16, 12), foliageLight);
      foliage.position.y = planterH + 2.4 * scale;
      tree.add(foliage);
      for (let i = 0; i < 8; i++) {
        const orange = new THREE.Mesh(new THREE.SphereGeometry(0.1 * scale, 6, 6), new THREE.MeshStandardMaterial({ color: '#e89030' }));
        const t = Math.random() * Math.PI * 2;
        const p = Math.random() * Math.PI * 0.6 + 0.2;
        orange.position.set(Math.sin(p) * Math.cos(t) * 1.3 * scale, planterH + 2.4 * scale + Math.cos(p) * 0.9 * scale, Math.sin(p) * Math.sin(t) * 1.3 * scale);
        tree.add(orange);
      }
      tree.position.set(x, 0, z);
      scene.add(tree);
    };

    for (let i = 0; i < 9; i++) createCitrusTree(-20 + i * 5, 12, 1);
    for (let i = 0; i < 11; i++) createCitrusTree(-25 + i * 5, 5, 0.95);
    for (let i = 0; i < 9; i++) createCitrusTree(-20 + i * 5, -2, 1);
    for (let i = 0; i < 11; i++) createCitrusTree(-25 + i * 5, -9, 0.9);

    const createCypress = (x, z, h = 10) => {
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.0, h, 12), foliageDark);
      foliage.position.set(x, h / 2 + 0.6, z);
      scene.add(foliage);
    };
    createCypress(-15, 8, 11);
    createCypress(15, 8, 10);
    createCypress(-10, 1, 9);
    createCypress(10, 1, 9.5);
    createCypress(0, -5, 10);

    return camera;
  }

  // Room configs
  // Wall text placement positions per room (where text goes on the wall)
  const wallTextSpots = {
    study: { x: 0, y: 7, z: -6.85, rotY: 0, w: 5, h: 1.5 },
    jamaica: { x: 0, y: 5, z: 31.9, rotY: Math.PI, w: 6, h: 2 },
    opensea: { x: 0, y: 18, z: 0, rotY: 0, w: 8, h: 2 },
    cabin: { x: -5.85, y: 6.5, z: 2, rotY: Math.PI / 2, w: 4, h: 1.5 },
    french: { x: -5, y: 8.5, z: -8.8, rotY: 0, w: 6, h: 1.5 },
    versailles: { x: 0, y: 32, z: -23, rotY: 0, w: 12, h: 3 },
    orangerie: { x: 0, y: 13.5, z: -19, rotY: 0, w: 10, h: 2 },
  };

  // Build a 3D text mesh from a wall text object
  const buildTextMesh = (wt, idx) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, 512, 256);
    ctx.font = `${Math.min(wt.size * 2, 120)}px ${wt.font}`;
    ctx.fillStyle = wt.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const words = wt.text.split(' ');
    let lines = [];
    let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > 470) { lines.push(line); line = w; }
      else { line = test; }
    });
    if (line) lines.push(line);
    const lineHeight = Math.min(wt.size * 2, 120) * 1.3;
    const startY = 128 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, 256, startY + i * lineHeight));
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(wt.w || 4, wt.h || 2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    plane.position.set(wt.x, wt.y, wt.z);
    if (wt.rotY) plane.rotation.y = wt.rotY;
    plane.renderOrder = 1;
    plane.userData = { wallTextIndex: idx };
    return plane;
  };

  const placeWallText = () => {
    if (!editingText.trim() || !sceneRef.current) return;
    const spot = wallTextSpots[currentRoom];
    if (!spot) return;

    const newText = {
      text: editingText.trim(),
      font: editingFont,
      size: editingSize,
      color: editingColor,
      ...spot,
    };

    let updatedTexts;
    if (editingIndex !== null) {
      // Editing existing — remove old mesh from scene
      const oldMesh = wallTextMeshesRef.current[editingIndex];
      if (oldMesh) sceneRef.current.remove(oldMesh);
      // Update the array
      const arr = [...(wallTextsRef.current[currentRoom] || [])];
      arr[editingIndex] = newText;
      updatedTexts = arr;
      // Build and add new mesh
      const mesh = buildTextMesh(newText, editingIndex);
      sceneRef.current.add(mesh);
      wallTextMeshesRef.current[editingIndex] = mesh;
    } else {
      // New text
      const arr = [...(wallTextsRef.current[currentRoom] || [])];
      const idx = arr.length;
      arr.push(newText);
      updatedTexts = arr;
      const mesh = buildTextMesh(newText, idx);
      sceneRef.current.add(mesh);
      wallTextMeshesRef.current.push(mesh);
    }

    setWallTexts(prev => {
      const updated = { ...prev, [currentRoom]: updatedTexts };
      wallTextsRef.current = updated;
      return updated;
    });
    setEditingText('');
    setEditingIndex(null);
    setTextEditorOpen(false);
  };

  const deleteWallText = () => {
    if (editingIndex === null || !sceneRef.current) return;
    // Remove mesh from scene
    const oldMesh = wallTextMeshesRef.current[editingIndex];
    if (oldMesh) sceneRef.current.remove(oldMesh);
    // Remove from array and rebuild indices
    const arr = [...(wallTextsRef.current[currentRoom] || [])];
    arr.splice(editingIndex, 1);
    // Remove mesh ref
    wallTextMeshesRef.current.splice(editingIndex, 1);
    // Re-index remaining meshes
    wallTextMeshesRef.current.forEach((m, i) => { m.userData.wallTextIndex = i; });

    setWallTexts(prev => {
      const updated = { ...prev, [currentRoom]: arr };
      wallTextsRef.current = updated;
      return updated;
    });
    setEditingText('');
    setEditingIndex(null);
    setTextEditorOpen(false);
  };

  const roomConfigs = {
    study: { name: "Scholar's Study", subtitle: "Home • Your Miniverse™", isExterior: false, doors: [{ to: 'french', label: 'French Literature Wing', icon: '🚪' }, { to: 'jamaica', label: 'The Vibes of Jamaica', icon: '🏝️' }] },
    jamaica: { name: "The Vibes of Jamaica", subtitle: "Your Miniverse™", isExterior: true, hasReggaeMusic: true, doors: [{ to: 'opensea', label: 'To the Open Sea', icon: '⛵' }, { to: 'study', label: 'Return to Study', icon: '🏠' }] },
    opensea: { name: "The Open Sea", subtitle: "Your Miniverse™", isExterior: true, doors: [{ to: 'cabin', label: 'To My Cabin', icon: '🚪' }, { to: 'jamaica', label: 'Return to Jamaica', icon: '🏝️' }, { to: 'study', label: 'Return Home', icon: '🏠' }] },
    cabin: { name: "The Captain's Cabin", subtitle: "Your Miniverse™", isExterior: false, doors: [{ to: 'opensea', label: 'Return to Open Sea', icon: '⛵' }, { to: 'study', label: 'Return Home', icon: '🏠' }] },
    french: { name: "The Golden Age of French Literature", subtitle: "Molière • Racine • Corneille", isExterior: false, doors: [{ to: 'versailles', label: 'Gardens of Versailles', icon: '🌳' }, { to: 'study', label: 'Return Home', icon: '🏠' }] },
    versailles: { name: "Gardens of Versailles — Central Vista", subtitle: "The Art of Perspective", isExterior: true, doors: [{ to: 'orangerie', label: 'The Orangerie', icon: '🍊' }, { to: 'french', label: 'Return to French Literature', icon: '↩️' }, { to: 'study', label: 'Return Home', icon: '🏠' }] },
    orangerie: { name: "The Orangerie", subtitle: "Gardens of Versailles", isExterior: true, hasMusic: true, doors: [{ to: 'versailles', label: 'Return to Central Vista', icon: '↩️' }, { to: 'study', label: 'Return Home', icon: '🏠' }] }
  };

  const config = roomConfigs[currentRoom];

  // Wall panel content definitions
  const wallPanels = {
    moliere: {
      title: "The Complete Works of Molière",
      subtitle: "Œuvres Complètes (in French)",
      icon: "📜",
      color: '#4a1a2a',
      links: [
        { label: "📜 Read the Complete Works of Molière", url: "https://dn790006.ca.archive.org/0/items/uvrescompltes03moli/uvrescompltes03moli.pdf", desc: "Volume III — Internet Archive (PDF)" }
      ]
    },
    comedie: {
      title: "A Command Performance",
      subtitle: "at the Comédie-Française",
      icon: "🎭",
      color: '#5a1a1a',
      links: [
        { label: "🎭 Watch the Performance", url: "https://youtu.be/KQjOScrkemo", desc: "Video — YouTube" }
      ]
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative', background: '#0a0a0f', fontFamily: 'Georgia, serif' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 24px',
        background: config.isExterior ? 'linear-gradient(to bottom, rgba(135,206,235,0.5), transparent)' : 'linear-gradient(to bottom, rgba(10,10,15,0.95), transparent)',
      }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 300, color: config.isExterior ? '#1a1a1a' : '#e8e4df', letterSpacing: '2px' }}>
          {config.name}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: config.isExterior ? '#333' : '#8a8578', letterSpacing: '2px' }}>
          {config.subtitle}
        </p>
      </div>

      {/* Wall Panel Overlay (Quainton Law style) */}
      {selectedWallPanel && wallPanels[selectedWallPanel] && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedWallPanel(null); }}
        >
          <div style={{
            background: 'linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)',
            borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%',
            border: '1px solid rgba(212,175,55,0.4)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            {/* Panel header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{wallPanels[selectedWallPanel].icon}</div>
                <h3 style={{ margin: 0, color: '#d4af37', fontSize: '20px', lineHeight: 1.3 }}>
                  {wallPanels[selectedWallPanel].title}
                </h3>
                <p style={{ margin: '6px 0 0', color: '#8a8578', fontSize: '13px', fontStyle: 'italic' }}>
                  {wallPanels[selectedWallPanel].subtitle}
                </p>
              </div>
              <button onClick={() => setSelectedWallPanel(null)} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px',
                flexShrink: 0, marginLeft: '12px',
              }}>✕</button>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {wallPanels[selectedWallPanel].links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', padding: '18px 20px',
                    background: `linear-gradient(135deg, ${wallPanels[selectedWallPanel].color} 0%, ${wallPanels[selectedWallPanel].color}dd 100%)`,
                    color: '#f0e8d8', textDecoration: 'none', borderRadius: '12px',
                    fontSize: '16px', fontWeight: 600, textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(212,175,55,0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
                >
                  {link.label}
                  {link.desc && <div style={{ fontSize: '11px', color: '#d4af37', marginTop: '6px', fontWeight: 400 }}>{link.desc}</div>}
                </a>
              ))}
            </div>

            {/* Hint */}
            <p style={{ margin: '20px 0 0', color: '#555', fontSize: '11px', textAlign: 'center', fontStyle: 'italic' }}>
              Click outside or ✕ to close
            </p>
          </div>
        </div>
      )}

      {/* French Room hint - click the wall objects */}
      {currentRoom === 'french' && !selectedWallPanel && !hintDismissed && (
        <div onClick={() => setHintDismissed(true)} style={{
          position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,20,25,0.85)', borderRadius: '10px', padding: '10px 18px',
          border: '1px solid rgba(212,175,55,0.25)', cursor: 'pointer',
        }}>
          <p style={{ margin: 0, color: '#d4af37', fontSize: '12px', textAlign: 'center' }}>
            Molière panel on the left wall • Walk through the arch to the stage for the Comédie-Française
            <span style={{ color: '#666', fontSize: '10px', display: 'block', marginTop: '4px' }}>tap to dismiss</span>
          </p>
        </div>
      )}

      {/* Hide/Show Toggle */}
      <button 
        onClick={() => setTabsVisible(!tabsVisible)} 
        style={{
          position: 'absolute', top: '16px', right: '16px', padding: '6px 10px',
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px', color: '#888', fontSize: '10px', cursor: 'pointer', zIndex: 50,
        }}
      >
        {tabsVisible ? '◀' : '▶'}
      </button>

      {/* Icon Toolbar */}
      {tabsVisible && (
      <div style={{
        position: 'absolute', bottom: '20px', right: '20px',
        display: 'flex', gap: '6px', alignItems: 'flex-end', zIndex: 80, flexWrap: 'wrap-reverse',
        maxWidth: '400px', justifyContent: 'flex-end',
      }}>
        {/* Settings gear */}
        <button onClick={() => setSettingsOpen(!settingsOpen)} title="Settings" style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: settingsOpen ? 'rgba(255,255,255,0.15)' : 'rgba(20,18,15,0.8)',
          border: '1px solid rgba(255,255,255,0.15)', color: '#888', fontSize: '16px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>⚙</button>

        {/* Chat */}
        {iconSettings.chat && (
          <button onClick={() => setChatOpen(true)} title="Chat" style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(42,157,143,0.8)', border: 'none', color: '#fff', fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>💬</button>
        )}

        {/* Connect */}
        {iconSettings.connect && (
          <button onClick={() => setMiniverseInviteOpen(true)} title="Connect Miniverses" style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(138,43,226,0.8)', border: 'none', color: '#fff', fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🔗</button>
        )}

        {/* Write */}
        {iconSettings.write && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setComingSoonTip('write'); setTimeout(() => setComingSoonTip(false), 2000); }} title="Write on Wall" style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'rgba(100,80,70,0.4)', border: 'none', color: '#888', fontSize: '15px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0.6,
            }}>✏️</button>
            {comingSoonTip === 'write' && (
              <div style={{
                position: 'absolute', bottom: '46px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(15,12,10,0.95)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px', padding: '6px 12px', whiteSpace: 'nowrap',
                color: '#ccc', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}>Coming soon</div>
            )}
          </div>
        )}

        {/* Architect */}
        {iconSettings.architect && (
          <button onClick={() => setArchitectOpen(!architectOpen)} title="Ask the Architect" style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: architectOpen ? 'rgba(124,58,237,0.9)' : 'rgba(139,92,246,0.8)',
            border: 'none', color: '#fff', fontSize: '15px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: architectOpen ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
          }}>🏛️</button>
        )}

        {/* Room music */}
        {config.hasMusic && iconSettings.music && (
          <button onClick={() => setAudioMenuOpen(true)} title="Room Music" style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(106,90,205,0.8)', border: 'none', color: '#fff', fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🎻</button>
        )}

        {/* Invite */}
        {config.hasMusic && iconSettings.invite && (
          <button onClick={() => setInviteModalOpen(true)} title="Invite Guests" style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(212,175,55,0.8)', border: 'none', color: '#1a1a1a', fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✉️</button>
        )}

        {/* Reggae */}
        {config.hasReggaeMusic && iconSettings.reggae && (
          <button onClick={() => setReggaeMenuOpen(true)} title="Reggae Vibes" style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(29,185,84,0.8)', border: 'none', color: '#fff', fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🎶</button>
        )}

        {/* Video - coming soon */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setComingSoonTip('video'); setTimeout(() => setComingSoonTip(false), 2000); }} title="My Video" style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(20,15,30,0.85)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#6366f1', fontSize: '15px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6,
          }}>🎬</button>
          {comingSoonTip === 'video' && (
            <div style={{
              position: 'absolute', bottom: '46px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(15,12,10,0.95)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', padding: '6px 12px', whiteSpace: 'nowrap',
              color: '#ccc', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>Coming soon</div>
          )}
        </div>

        {/* Music */}
        <button
          onClick={() => setCustomAudioOpen(!customAudioOpen)}
          title="My Music"
          style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: customAudioOpen
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : customAudioPlaying
                ? 'linear-gradient(135deg, #f59e0b, #b45309)'
                : 'rgba(30,20,10,0.85)',
            border: customAudioPlaying && !customAudioOpen ? '2px solid #d97706' : '1px solid rgba(217,119,6,0.3)',
            color: '#fbbf24', fontSize: '18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: customAudioPlaying ? '0 0 15px rgba(217,119,6,0.4)' : 'none',
          }}
        >♪</button>

        {/* Other Wings */}
        <button onClick={() => setDoorMenuOpen(!doorMenuOpen)} title="Other Wings" style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: doorMenuOpen ? 'rgba(139,115,85,0.9)' : 'rgba(139,115,85,0.7)',
          border: 'none', color: '#fff', fontSize: '15px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: doorMenuOpen ? '0 0 12px rgba(139,115,85,0.4)' : 'none',
        }}>🚪</button>
      </div>
      )}

      {/* Door Menu Popup */}
      {doorMenuOpen && (
        <div style={{
          position: 'absolute', bottom: '66px', right: '20px', zIndex: 95,
          background: 'rgba(15,12,10,0.95)', borderRadius: '12px', padding: '10px',
          border: '1px solid rgba(139,115,85,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          minWidth: '180px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', padding: '0 6px' }}>
            <p style={{ margin: 0, color: '#888', fontSize: '10px', letterSpacing: '1px' }}>OTHER WINGS</p>
            <button onClick={() => setDoorMenuOpen(false)} style={{
              background: 'none', border: 'none', color: '#666', fontSize: '12px', cursor: 'pointer', padding: '2px 4px',
            }}>✕</button>
          </div>
          {config.doors.map((door, i) => (
            <button key={i} onClick={() => { setDoorMenuOpen(false); navigate(door.to); }} style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '8px 10px', background: 'none', border: 'none',
              color: '#ccc', fontSize: '12px', cursor: 'pointer', borderRadius: '6px',
              textAlign: 'left',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: '14px' }}>{door.icon}</span>
              {door.label}
            </button>
          ))}
        </div>
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <div style={{
          position: 'absolute', bottom: '66px', right: '20px', zIndex: 95,
          background: 'rgba(15,12,10,0.95)', borderRadius: '12px', padding: '14px 16px',
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          width: '200px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ margin: 0, color: '#888', fontSize: '10px', letterSpacing: '1px' }}>SHOW / HIDE</p>
            <button onClick={() => setSettingsOpen(false)} style={{
              background: 'none', border: 'none', color: '#666', fontSize: '12px', cursor: 'pointer',
            }}>✕</button>
          </div>
          {[
            { key: 'chat', label: '💬 Chat' },
            { key: 'connect', label: '🔗 Connect' },
            { key: 'write', label: '✏️ Write' },
            { key: 'architect', label: '🏛️ Architect' },
            { key: 'music', label: '🎻 Room Music' },
            { key: 'invite', label: '✉️ Invite' },
            { key: 'reggae', label: '🎶 Reggae' },
          ].map(item => (
            <label key={item.key} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0',
              color: '#bbb', fontSize: '12px', cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={iconSettings[item.key]}
                onChange={() => setIconSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                style={{ accentColor: '#d97706' }}
              />
              {item.label}
            </label>
          ))}
        </div>
      )}

      {/* Now Playing */}
      {isPlaying && currentTrack && (
        <div style={{
          position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(20,20,25,0.95)', borderRadius: '12px', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid rgba(212,175,55,0.3)',
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d4af37' }} />
          <div style={{ color: '#e8e4df', fontSize: '13px' }}>{currentTrack.name}</div>
          <button onClick={stopPlayback} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: '28px', height: '28px', color: '#fff', cursor: 'pointer',
          }}>⏹</button>
        </div>
      )}

      {/* Custom Audio Player */}
      {customAudioOpen && (
        <div style={{
          position: 'absolute', bottom: '66px', right: '20px',
          width: '300px', background: 'linear-gradient(165deg, #1c1208 0%, #0d0a05 100%)',
          borderRadius: '16px', border: '1px solid rgba(217,119,6,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 90,
          maxHeight: 'calc(100vh - 120px)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid rgba(217,119,6,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎵</span>
              <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '14px', fontWeight: 700 }}>My Music</h3>
            </div>
            <button onClick={() => setCustomAudioOpen(false)} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
              width: '26px', height: '26px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
            }}>✕</button>
          </div>

          <div style={{ padding: '16px 18px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {/* Track name */}
            {customAudioName && (
              <p style={{
                margin: '0 0 12px', color: '#fbbf24', fontSize: '13px', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>♪ {customAudioName}</p>
            )}

            {/* Custom playback controls */}
            {customAudioReady && (
              <div style={{ marginBottom: '12px' }}>
                {/* Play/Pause + Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <button
                    onClick={customAudioPlaying ? pauseCustomAudio : playCustomAudio}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: customAudioPlaying ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(217,119,6,0.25)',
                      border: customAudioPlaying ? 'none' : '2px solid rgba(217,119,6,0.5)',
                      color: '#fff', fontSize: '16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >{customAudioPlaying ? '⏸' : '▶'}</button>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      height: '4px', background: 'rgba(217,119,6,0.2)', borderRadius: '2px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', background: '#d97706', borderRadius: '2px',
                        width: customAudioDuration ? `${(customAudioTime / customAudioDuration) * 100}%` : '0%',
                        transition: 'width 0.25s linear',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: '#92400e', fontSize: '10px' }}>{formatTime(customAudioTime)}</span>
                      <span style={{ color: '#92400e', fontSize: '10px' }}>{formatTime(customAudioDuration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {customAudioName && !customAudioReady && !customAudioName.startsWith('Error') && (
              <p style={{ margin: '0 0 12px', color: '#92400e', fontSize: '11px' }}>⏳ Decoding audio...</p>
            )}
            {customAudioName.startsWith('Error') && (
              <p style={{ margin: '0 0 12px', color: '#f87171', fontSize: '11px' }}>⚠ Could not decode — try an MP3 file</p>
            )}

            {/* Save to Library */}
            {customAudioReady && !currentSavedInLibrary && savedLibrary.length < 3 && (
              <button
                onClick={saveToLibrary}
                disabled={librarySaving}
                style={{
                  width: '100%', padding: '8px', marginBottom: '8px',
                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                  borderRadius: '8px', color: '#4ade80', fontSize: '11px', fontWeight: 600,
                  cursor: librarySaving ? 'default' : 'pointer',
                }}
              >{librarySaving ? '⏳ Saving...' : '💾 Save to Room Library'}</button>
            )}

            {/* Library message */}
            {libraryMsg && (
              <p style={{
                margin: '0 0 8px', fontSize: '10px', textAlign: 'center',
                color: libraryMsg === 'Saved!' ? '#4ade80' : libraryMsg === 'Loading...' ? '#92400e' : '#f87171',
              }}>{libraryMsg}</p>
            )}

            {/* Saved Library */}
            {savedLibrary.length > 0 && (
              <div style={{
                marginBottom: '10px', borderTop: '1px solid rgba(217,119,6,0.15)', paddingTop: '10px',
              }}>
                <p style={{ margin: '0 0 6px', color: '#92400e', fontSize: '9px', letterSpacing: '1px' }}>
                  ROOM LIBRARY ({savedLibrary.length}/3)
                </p>
                {savedLibrary.map((track, i) => (
                  <div key={track.key} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0',
                    borderBottom: i < savedLibrary.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <button
                      onClick={() => loadFromLibrary(track)}
                      style={{
                        flex: 1, background: 'none', border: 'none', color: '#d4a', textAlign: 'left',
                        cursor: 'pointer', padding: '2px 0', fontSize: '11px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        color: customAudioName === track.name ? '#fbbf24' : '#999',
                      }}
                    >♪ {track.name} <span style={{ color: '#555', fontSize: '9px' }}>({formatTime(track.duration)})</span></button>
                    <button onClick={() => removeFromLibrary(i)} style={{
                      background: 'none', border: 'none', color: '#555', fontSize: '10px',
                      cursor: 'pointer', padding: '2px 4px', flexShrink: 0,
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: 'none' }} id="customAudioUpload" />
            <label htmlFor="customAudioUpload" style={{
              display: 'block', textAlign: 'center', padding: '10px',
              background: 'rgba(217,119,6,0.15)', border: '1px dashed rgba(217,119,6,0.3)',
              borderRadius: '10px', color: '#d97706', fontSize: '12px', cursor: 'pointer', fontWeight: 500,
            }}>
              {customAudioReady ? '🎵 Choose Different Track' : '🎵 Upload Music File'}
            </label>
          </div>
        </div>
      )}

      {/* Wall Text Editor */}
      {textEditorOpen && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          paddingLeft: '20px', zIndex: 100,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setTextEditorOpen(false); }}
        >
          <div style={{
            background: 'linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)',
            borderRadius: '16px', padding: '24px', width: '300px',
            border: '1px solid rgba(224,112,80,0.4)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#e07050', fontSize: '18px' }}>{editingIndex !== null ? '✏️ Edit Text' : '✏️ Write on Wall'}</h3>
              <button onClick={() => setTextEditorOpen(false)} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
              }}>✕</button>
            </div>

            {/* Text input */}
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              placeholder="Type your text..."
              style={{
                width: '100%', height: '80px', padding: '12px', marginBottom: '16px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px', color: editingColor, fontSize: '15px',
                fontFamily: editingFont, outline: 'none', resize: 'none',
                boxSizing: 'border-box',
              }}
            />

            {/* Style label */}
            <p style={{ margin: '0 0 10px', color: '#888', fontSize: '11px', letterSpacing: '1px' }}>STYLE</p>

            {/* Font selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select
                value={editingFont}
                onChange={(e) => setEditingFont(e.target.value)}
                style={{
                  flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                  color: '#e0e0e0', fontSize: '13px', outline: 'none',
                  fontFamily: editingFont,
                }}
              >
                <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</option>
                <option value="'Times New Roman'" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</option>
                <option value="'Courier New'" style={{ fontFamily: 'Courier New' }}>Courier New</option>
                <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial</option>
                <option value="'Trebuchet MS'" style={{ fontFamily: 'Trebuchet MS' }}>Trebuchet MS</option>
                <option value="Verdana" style={{ fontFamily: 'Verdana' }}>Verdana</option>
                <option value="Impact" style={{ fontFamily: 'Impact' }}>Impact</option>
              </select>
              <select
                value={editingSize}
                onChange={(e) => setEditingSize(Number(e.target.value))}
                style={{
                  width: '72px', padding: '10px', background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                  color: '#e0e0e0', fontSize: '13px', outline: 'none',
                }}
              >
                {[24, 32, 40, 48, 60, 72, 96].map(s => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>

            {/* Color picker */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['#d4af37', '#ffffff', '#e8e0d0', '#ff6b6b', '#4ecdc4', '#a0d2db', '#f7dc6f', '#bb8fce'].map(c => (
                <button
                  key={c}
                  onClick={() => setEditingColor(c)}
                  style={{
                    width: '30px', height: '30px', borderRadius: '50%', border: editingColor === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                    background: c, cursor: 'pointer', padding: 0,
                    boxShadow: editingColor === c ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Preview */}
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px',
              marginBottom: '16px', minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{
                fontFamily: editingFont, fontSize: `${Math.min(editingSize * 0.4, 32)}px`,
                color: editingColor, textAlign: 'center', wordBreak: 'break-word',
              }}>
                {editingText || 'Preview'}
              </span>
            </div>

            {/* Place / Update button */}
            <button
              onClick={placeWallText}
              disabled={!editingText.trim()}
              style={{
                width: '100%', padding: '14px',
                background: editingText.trim() ? 'linear-gradient(135deg, #e07050, #c05030)' : 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: '10px',
                color: editingText.trim() ? '#fff' : '#555',
                fontSize: '14px', fontWeight: 600, cursor: editingText.trim() ? 'pointer' : 'default',
              }}
            >
              {editingIndex !== null ? 'Update Text' : 'Place on Wall'}
            </button>

            {/* Delete button - only when editing existing */}
            {editingIndex !== null && (
              <button
                onClick={deleteWallText}
                style={{
                  width: '100%', padding: '12px', marginTop: '8px',
                  background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.3)',
                  borderRadius: '10px', color: '#ff6b6b',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                🗑 Delete Text
              </button>
            )}

            <p style={{ margin: '12px 0 0', color: '#555', fontSize: '10px', textAlign: 'center', fontStyle: 'italic' }}>
              {editingIndex !== null ? 'Click on wall text to edit it' : 'Text will appear on the nearest wall'}
            </p>
          </div>
        </div>
      )}

      {/* Architect Panel */}
      {architectOpen && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px', bottom: '80px',
          width: '380px', background: 'linear-gradient(165deg, #1a1028 0%, #0d0a14 100%)',
          borderRadius: '16px', border: '1px solid rgba(139,92,246,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', zIndex: 90,
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🏛️</span>
              <div>
                <h3 style={{ margin: 0, color: '#c4b5fd', fontSize: '15px', fontWeight: 700 }}>The Architect</h3>
                <p style={{ margin: 0, color: '#7c6f9f', fontSize: '10px' }}>Miniverse Design Agent</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={architectModel}
                onChange={(e) => setArchitectModel(e.target.value)}
                style={{
                  padding: '5px 8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '6px', color: '#c4b5fd', fontSize: '10px', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="claude-sonnet-4-20250514">Sonnet 4</option>
                <option value="claude-opus-4-6">Opus 4.6</option>
              </select>
              <button onClick={() => setArchitectOpen(false)} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
              }}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div ref={architectScrollRef} style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {architectMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏛️</div>
                <p style={{ color: '#8b7fb0', fontSize: '14px', margin: '0 0 8px', fontWeight: 600 }}>Welcome to the Architect</p>
                <p style={{ color: '#5a5078', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
                  Tell me what you'd like in your {roomConfigs[currentRoom]?.name || currentRoom} and I'll design and build it. Just describe your vision — no technical knowledge needed.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(currentRoom === 'study' ? [
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
                  ]).map((q, i) => (
                    <button key={i} onClick={() => { setArchitectInput(q); }} style={{
                      padding: '8px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                      borderRadius: '8px', color: '#a78bfa', fontSize: '11px', cursor: 'pointer', textAlign: 'left',
                    }}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {architectMessages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px' }}>🏛️</span>
                    <span style={{ color: '#7c6f9f', fontSize: '10px', fontWeight: 600 }}>Architect</span>
                  </div>
                )}
                <div style={{
                  padding: '10px 14px', borderRadius: '12px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                    : 'rgba(255,255,255,0.06)',
                  border: msg.role === 'assistant' ? '1px solid rgba(139,92,246,0.15)' : 'none',
                  color: msg.role === 'user' ? '#fff' : '#d4ccec',
                  fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {architectLoading && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px' }}>🏛️</span>
                  <span style={{ color: '#7c6f9f', fontSize: '10px', fontWeight: 600 }}>Architect</span>
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                  color: '#8b7fb0', fontSize: '13px',
                }}>
                  <span style={{ display: 'inline-block', animation: 'none' }}>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={architectInput}
                onChange={(e) => setArchitectInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendArchitectMessage(); }}}
                placeholder="What would you like to add or change?"
                style={{
                  flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px',
                  color: '#e0d8f0', fontSize: '13px', outline: 'none',
                }}
              />
              <button
                onClick={sendArchitectMessage}
                disabled={!architectInput.trim() || architectLoading}
                style={{
                  padding: '10px 16px',
                  background: (architectInput.trim() && !architectLoading) ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: '10px',
                  color: (architectInput.trim() && !architectLoading) ? '#fff' : '#555',
                  fontSize: '14px', cursor: (architectInput.trim() && !architectLoading) ? 'pointer' : 'default',
                }}
              >→</button>
            </div>
            {architectMessages.length > 0 && (
              <button
                onClick={() => {
                  const summary = architectMessages.map(m =>
                    `${m.role === 'user' ? 'User' : 'Architect'}: ${m.content}`
                  ).join('\n\n');
                  setEscalationSummary(summary);
                  setEscalationOpen(true);
                }}
                style={{
                  padding: '8px 12px', background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                  color: '#7c6f9f', fontSize: '11px', cursor: 'pointer', textAlign: 'center',
                }}
              >
                👤 Escalate to Human Developer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Human Developer Escalation Modal */}
      {escalationOpen && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setEscalationOpen(false); }}
        >
          <div style={{
            background: 'linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)',
            borderRadius: '16px', padding: '28px', width: '420px', maxHeight: '80vh',
            border: '1px solid rgba(59,130,246,0.4)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#60a5fa', fontSize: '18px' }}>👤 Connect with a Human Developer</h3>
              <button onClick={() => setEscalationOpen(false)} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
              }}>✕</button>
            </div>

            <p style={{ color: '#a0a0a0', fontSize: '13px', lineHeight: 1.6, margin: '0 0 16px' }}>
              A Grapheon developer can join your session to implement changes directly — editing code, debugging, and testing in real time.
            </p>

            {/* Conversation summary */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px',
              marginBottom: '16px', maxHeight: '200px', overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ color: '#666', fontSize: '10px', letterSpacing: '1px', margin: '0 0 8px' }}>CONVERSATION BRIEF</p>
              <pre style={{
                color: '#999', fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap',
                fontFamily: 'inherit', lineHeight: 1.5,
              }}>{escalationSummary || 'No conversation yet.'}</pre>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(escalationSummary);
                }}
                style={{
                  padding: '12px', background: 'rgba(96,165,250,0.1)',
                  border: '1px solid rgba(96,165,250,0.3)', borderRadius: '10px',
                  color: '#60a5fa', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
                }}
              >
                📋 Copy Brief to Clipboard
              </button>

              <button
                style={{
                  padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  border: 'none', borderRadius: '10px',
                  color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                🔗 Request a Developer Session (coming soon)
              </button>

              <p style={{ color: '#555', fontSize: '10px', textAlign: 'center', margin: '4px 0 0', fontStyle: 'italic' }}>
                Developer sessions are staffed by vetted Grapheon engineers. Typical response time: under 15 minutes during business hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {chatOpen && (
        <div style={{
          position: 'absolute', bottom: '20px', left: '20px', width: '320px', height: '400px',
          background: 'rgba(15,15,20,0.95)', borderRadius: '16px', border: '1px solid rgba(42,157,143,0.4)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 50,
        }}>
          <div style={{
            padding: '14px 16px', background: 'linear-gradient(135deg, #2a9d8f, #1a7a6f)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>💬 Miniverse Chat</span>
            <button onClick={() => setChatOpen(false)} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
              width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
            }}>✕</button>
          </div>
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                background: msg.user === 'You' ? 'rgba(42,157,143,0.2)' : 'rgba(255,255,255,0.05)',
                borderRadius: '10px', padding: '10px 12px',
                marginLeft: msg.user === 'You' ? '40px' : '0',
                marginRight: msg.user === 'You' ? '0' : '40px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: msg.user === 'You' ? '#2a9d8f' : '#8a8a9a', fontSize: '11px', fontWeight: 600 }}>{msg.user}</span>
                  <span style={{ color: '#555', fontSize: '10px' }}>{msg.time}</span>
                </div>
                <p style={{ margin: 0, color: '#d0d0d0', fontSize: '13px', lineHeight: 1.4 }}>{msg.text}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()} placeholder="Type a message..."
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', color: '#e0e0e0', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={sendChatMessage} style={{
              padding: '10px 16px', background: 'linear-gradient(135deg, #2a9d8f, #1a7a6f)',
              border: 'none', borderRadius: '20px', color: '#fff', fontSize: '13px', cursor: 'pointer',
            }}>Send</button>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#555', fontSize: '10px', fontStyle: 'italic' }}>Real-time chat with guests • Coming Soon</p>
          </div>
        </div>
      )}

      {/* Audio Menu */}
      {audioMenuOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', maxWidth: '340px', border: '1px solid rgba(212,175,55,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#d4af37' }}>🎻 Mozart</h3>
              <button onClick={() => setAudioMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            {mozartTracks.map((track, i) => (
              <button key={i} onClick={() => playTrack(track)} style={{
                width: '100%', padding: '14px', marginBottom: '10px', background: 'rgba(212,175,55,0.15)',
                border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px', color: '#e8e4df', cursor: 'pointer', textAlign: 'left',
              }}>🎵 {track.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '28px', maxWidth: '400px', border: '1px solid rgba(212,175,55,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>✉️</div>
            <h3 style={{ margin: '0 0 8px', color: '#d4af37', fontSize: '20px' }}>An Evening of Mozart</h3>
            <p style={{ color: '#888', fontStyle: 'italic', margin: '0 0 16px' }}>in my Miniverse™ Orangerie</p>
            <p style={{ color: '#e8e4df', lineHeight: 1.6, margin: '0 0 20px' }}>You're cordially invited to join me for an evening of classical music amid the citrus trees and fountains of the Orangerie.</p>
            <button onClick={() => setInviteModalOpen(false)} style={{
              padding: '14px 32px', background: 'linear-gradient(135deg, #d4af37, #b8962e)',
              border: 'none', borderRadius: '10px', color: '#1a1a1a', fontWeight: 600, cursor: 'pointer',
            }}>Close Preview</button>
          </div>
        </div>
      )}

      {/* Reggae Music Menu */}
      {reggaeMenuOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)', borderRadius: '16px', padding: '24px', maxWidth: '380px', border: '1px solid rgba(29,185,84,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1db954', fontSize: '18px' }}>🎶 Reggae Vibes</h3>
              <button onClick={() => setReggaeMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px', fontStyle: 'italic' }}>Connect your streaming service</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {[{ name: 'Spotify', icon: '🟢', color: '#1db954' }, { name: 'Pandora', icon: '🔵', color: '#005ab4' }].map((svc, i) => (
                <button key={i} style={{
                  flex: 1, padding: '12px', background: `${svc.color}22`, border: `1px solid ${svc.color}44`,
                  borderRadius: '10px', color: svc.color, fontSize: '12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ fontSize: '20px' }}>{svc.icon}</span>{svc.name}
                  <span style={{ fontSize: '9px', color: '#666' }}>Coming Soon</span>
                </button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginBottom: '12px' }}>
              <p style={{ color: '#fed100', fontSize: '11px', letterSpacing: '1px', marginBottom: '12px' }}>PRESETS</p>
            </div>
            {[
              { name: 'Vibes of Kingston', icon: '🏝️', color: '#009b3a' },
              { name: 'Bob Marley', icon: '🎤', color: '#fed100' },
              { name: 'Jimmy Cliff', icon: '🌊', color: '#e63946' },
              { name: 'My Music', icon: '❤️', color: '#ff69b4' },
            ].map((preset, i) => (
              <button key={i} style={{
                width: '100%', padding: '14px 16px', marginBottom: '8px',
                background: `${preset.color}18`, border: `1px solid ${preset.color}40`,
                borderRadius: '10px', color: '#e8e4df', cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>{preset.icon}</span>{preset.name}
                </span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>Coming Soon</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Connect Miniverses Modal */}
      {miniverseInviteOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'linear-gradient(165deg, #1a1a2a 0%, #0d0d1a 100%)', borderRadius: '20px', padding: '28px', maxWidth: '380px', border: '1px solid rgba(138,43,226,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#8a2be2', fontSize: '20px' }}>🌐 Connect Miniverses</h3>
              <button onClick={() => setMiniverseInviteOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px' }}>✕</button>
            </div>
            <p style={{ color: '#a0a0b0', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
              Link your Miniverse™ to others and create an infinite, honeycombed Omniverse.
            </p>
            <div style={{ background: 'rgba(138,43,226,0.1)', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(138,43,226,0.2)', textAlign: 'center' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🐝</span>
              <h4 style={{ margin: '0 0 8px', color: '#c0a0e0', fontSize: '16px' }}>Portal Network</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '12px', lineHeight: 1.5 }}>
                Send invitations • Accept connections<br/>Build your corner of the infinite Omniverse
              </p>
            </div>
            <button onClick={() => setMiniverseInviteOpen(false)} style={{
              width: '100%', padding: '14px', background: 'linear-gradient(135deg, #8a2be2, #5a1a9a)',
              border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>Close</button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: config.isExterior ? '#2d5a30' : '#6a6560', fontSize: '11px' }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>Drag to look around<br/>WASD to move</p>
      </div>
    </div>
  );
}