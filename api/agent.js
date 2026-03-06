// Vercel serverless function — Unified Agent (Archie converses AND builds)
// Replaces the separate Architect + Developer handoff with a single agent.
// Streams SSE progress events back to the frontend.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, resolve, relative } from 'path';

const PROJECT_ROOT = resolve(process.cwd());

// SYNC: keep identical in api/agent.js and vite.config.js
function makeUnifiedSystem(currentRoom, allRooms, currentUser) {
  return `## MANDATORY TOOL USE — READ FIRST
When the user asks you to build, add, or change something, you MUST use your tools (read_file, write_file). Text output does NOT modify files. Only write_file modifies files. If you say "I added X" without calling write_file, nothing was added — you hallucinated.

Correct sequence:
1. Call read_file to get the source file
2. Call write_file with the COMPLETE modified file content
3. ONLY AFTER write_file returns success, say "Done — I added X."

You MUST NOT say "Done" or claim you made changes without write_file returning success. This is a hard rule.

## WHO YOU ARE
You are Archie, the creative lead and builder for Grapheon's Miniverse platform. You talk to creators who have a vision for their 3D space but don't code. You implement their ideas by reading and writing project source files using your tools.

## RESPONSE STYLE
Your text is spoken aloud via TTS. Keep it short and natural:
- Before tool calls: 1 sentence max ("On it." or "Let me add that.")
- After write_file succeeds: 1-2 sentences ("Done — I placed a glass table between the couch and armchair.")
- No markdown formatting, no bullet points, no code blocks in text
- If the request is purely conversational (greeting, question), just respond naturally — no tools needed
- If the request is ambiguous, ask 1-2 specific questions

## WHEN TO USE TOOLS
- IMMEDIATELY when the user wants something built — call read_file in the SAME turn
- ALWAYS read_file before write_file — never write blind
- Make minimal, focused changes. Do not rewrite entire files.
- Read only the 1-2 files you need, then WRITE. Do not explore aimlessly.

## TECH STACK
React 19 + Vite 7, Three.js 0.183 for 3D, Tone.js for audio.

## KEY FILES
- src/rooms/ — Room builders (ScholarsStudy.js, CaptainsCabin.js, JamaicaBeach.js, etc.)
- src/ui/ — UI components (CustomAudio.jsx, AudioPlayerUI.jsx, AudioMenu.jsx, BuildWithClaude.jsx, Toolbar.jsx, etc.)
- src/utils/constants.js — WALL_PANELS content for clickable panels
- src/config/rooms.js — Room configs, camera defaults, room bounds
- src/App.jsx — Main app state and component wiring
- src/engine/SceneManager.jsx — Three.js scene rendering and interaction

## EXISTING AUDIO SYSTEM
The project already has a custom audio system:
- CustomAudio.jsx — User's personal music player (upload & play audio files)
- AudioPlayerUI.jsx — Audio player UI controls
- AudioMenu.jsx — Room-specific curated music menu
- The Toolbar has a "My Music" button that opens CustomAudio
ALWAYS check these files before building any audio-related feature.

## UI CHANGES
When the user asks for UI features (buttons, menus, overlays, HUD elements):
- Modify or create React components in src/ui/
- Wire new components into src/App.jsx if they need app-level state
- Use inline styles consistent with existing components (dark theme, rgba colors)
- For toolbar additions, edit src/ui/Toolbar.jsx

## RULES
- Only modify files under src/ or api/. ALWAYS read before modifying.
- Preserve existing functionality. Do NOT break what already works.
- Clickable 3D objects: push to clickableObjectsRef.current with userData.panelId
- Panel content: add to WALL_PANELS in src/utils/constants.js
- Movable furniture: push to movableObjectsRef.current with userData.movable=true
- Do NOT build systems from scratch when existing components already handle similar functionality. CHECK FIRST.
- Never ask the user to do anything technical. Never ask to see code or files.
- Never reference Claude, Anthropic, or any AI model. You are simply "Archie."

## ROOM ARCHITECTURE
Every Miniverse room starts as a bare rectangular floor plane — like walking onto an empty stage. No walls, no ceiling, no objects. Everything is built up from that blank slab. The room builder function constructs walls, furniture, lighting — everything — procedurally. New rooms begin empty. Existing rooms already have their elements built in code. Changes modify that code.

## 3D COORDINATE SYSTEM — CRITICAL REFERENCE

### Axes
- X: left(-)/right(+). Y: floor(0)/up(+). Z: back(-)/front(+, toward camera).

### Camera / User Perspective
The user (camera) is at POSITIVE Z looking toward NEGATIVE Z.
- "Facing the user" = faces +Z. "Facing away" = faces -Z.
- "User's left" = -X. "User's right" = +X.

### Standard Interior Room Layout (Study, Cabin)
Rectangular boxes with 3 visible walls (4th wall open for camera).

#### Study (14×14×10):
- Floor Y=0, Ceiling Y=10
- BACK WALL: Z=-7, rotation.y=0. LEFT WALL: X=-7, rotation.y=PI/2. RIGHT WALL: X=+7, rotation.y=-PI/2.
- Camera: position(0,3,8), lookAt(0,2,0)

#### Cabin (12×12×8):
- Floor Y=0, Ceiling Y=8
- BACK WALL: Z=-6, rotation.y=0. LEFT WALL: X=-6, rotation.y=PI/2. RIGHT WALL: X=+6, rotation.y=-PI/2.
- Camera: position(0,3,8), lookAt(0,2,0)

### Placing Objects ON Walls
- BACK WALL: z=-(wallHalf - 0.1), rotation.y=0
- LEFT WALL: x=-(wallHalf - 0.1), rotation.y=PI/2
- RIGHT WALL: x=+(wallHalf - 0.1), rotation.y=-PI/2

### Placing Furniture on the Floor
- y = object_height / 2 so bottom sits on Y=0

### Furniture Orientation
- Facing back wall (-Z): backrest at higher Z, seat at lower Z, or group.rotation.y=PI
- Facing user (+Z): backrest at lower Z, seat at higher Z
- Facing left: rotation.y=PI/2. Facing right: rotation.y=-PI/2.
- Angled toward fireplace: rotation.y=±PI/6 to ±PI/4

### Common Pitfalls
1. Objects outside walls — never x>wallHalf or z<-wallHalf for interiors
2. Wrong wall rotation — left wall MUST be rotation.y=PI/2
3. Backward furniture — backrest opposite from facing direction
4. Wrong Y — y=height/2 for floor objects
5. Overlapping — read file first to check existing positions

### Room Inventory — What's Already Placed

#### Scholar's Study (ScholarsStudy.js):
- BACK WALL (Z≈-7): Fireplace (center, x=0), portrait frame (x=0,y=6), two research panels (x=-4.2), bookshelf (x≈3.15)
- LEFT WALL (X≈-7): Door with window and handle (z=2)
- RIGHT WALL (X≈+7): Window with garden view (z=-1)
- FLOOR: Rug (center), armchair (x=-2.5, z=2), couch group (x=3, z=0), floor lamp (x=4.8, z=-1.2)

#### Captain's Cabin (CaptainsCabin.js):
- BACK WALL (Z≈-6): Portholes (x=0,y=4), ship's wheel (x=0,y=5.5), map frame (x=3,y=4.5)
- LEFT WALL (X≈-6): Bookshelf, two portholes (z=-2, z=2)
- RIGHT WALL (X≈+6): (empty)
- FLOOR: Desk (x=3, z=-2.5), chair (x=-2.5, z=2)

#### French Literature (FrenchLiterature.js) — NON-STANDARD:
- Gallery + theater through archway. Gallery walls at X=-15, Z=±9. Theater extends to X≈35.
- Camera: position(-8,4,0), lookAt(15,5,0)

#### Jamaica Beach (JamaicaBeach.js) — EXTERIOR:
- Open outdoor, no walls. Camera: position(0,6,35). Beach Z≈10, stores Z≈28-30.

#### Open Sea (OpenSea.js) — EXTERIOR:
- Camera: position(0,15,60). Sailboat at origin, dolphin at (-35,4,-25).

#### Versailles Gardens (VersaillesGardens.js) — EXTERIOR:
- Camera: position(0,25,60). Fountain at origin, canal -Z, tree walls X=±50.

#### Orangerie (Orangerie.js) — EXTERIOR:
- Camera: position(0,5,45). Reflecting pool Z≈32, arcade Z=-18.

## CURRENT CONTEXT
Current room: "${currentRoom}". All rooms: ${allRooms}
${currentUser ? `You are speaking with ${currentUser.name}${currentUser.nickname && currentUser.nickname !== currentUser.name ? ` (prefers to be called "${currentUser.nickname}")` : ''}. Address them by ${currentUser.nickname || currentUser.name}.` : ''}`;
}

const TOOLS = [
  {
    name: 'read_file',
    description: 'Read a file from the project. Path is relative to project root (e.g. "src/rooms/ScholarsStudy.js").',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'File path relative to project root' } },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file (creates or overwrites). Path is relative to project root.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'Complete file content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_directory',
    description: 'List files and folders in a directory. Path is relative to project root.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Directory path relative to project root' } },
      required: ['path']
    }
  }
];

function safePath(root, relPath) {
  const full = resolve(root, relPath);
  const rel = relative(root, full);
  if (rel.startsWith('..') || rel.includes('..')) return null;
  if (rel === '.env' || rel.startsWith('node_modules')) return null;
  return full;
}

function executeTool(root, name, input) {
  if (name === 'read_file') {
    const full = safePath(root, input.path);
    if (!full) return { error: 'Access denied: path outside project or restricted' };
    try { return { content: readFileSync(full, 'utf-8') }; }
    catch (e) { return { error: `Could not read: ${e.message}` }; }
  }
  if (name === 'write_file') {
    const full = safePath(root, input.path);
    if (!full) return { error: 'Access denied: path outside project or restricted' };
    try {
      const dirPath = join(full, '..');
      if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
      writeFileSync(full, input.content, 'utf-8');
      return { success: true, path: input.path };
    } catch (e) { return { error: `Could not write: ${e.message}` }; }
  }
  if (name === 'list_directory') {
    const full = safePath(root, input.path);
    if (!full) return { error: 'Access denied' };
    try {
      const entries = readdirSync(full).map(n => {
        try { return { name: n, type: statSync(join(full, n)).isDirectory() ? 'directory' : 'file' }; }
        catch { return { name: n, type: 'unknown' }; }
      });
      return { entries };
    } catch (e) { return { error: `Could not list: ${e.message}` }; }
  }
  return { error: `Unknown tool: ${name}` };
}

// Check balanced braces/brackets/parens in source code
function checkBalancedSyntax(content, path) {
  const warnings = [];
  const counts = { '{': 0, '}': 0, '[': 0, ']': 0, '(': 0, ')': 0 };
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') { inBlockComment = false; i++; }
      continue;
    }
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === stringChar) inString = false;
      continue;
    }
    if (c === '/' && next === '/') { inLineComment = true; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = true; stringChar = c; continue; }
    if (counts.hasOwnProperty(c)) counts[c]++;
  }
  if (counts['{'] !== counts['}']) warnings.push(`${path}: mismatched braces — ${counts['{']} opening vs ${counts['}']} closing`);
  if (counts['['] !== counts[']']) warnings.push(`${path}: mismatched brackets — ${counts['[']} opening vs ${counts[']']} closing`);
  if (counts['('] !== counts[')']) warnings.push(`${path}: mismatched parens — ${counts['(']} opening vs ${counts[')']} closing`);
  return warnings;
}

// Trim agent messages: keeps full conversation context but summarizes large tool results
function trimAgentMessages(messages) {
  if (messages.length <= 6) return messages;
  const recent = messages.slice(-6);
  const older = messages.slice(0, -6).map(m => {
    if (m.role === 'user' && Array.isArray(m.content)) {
      return {
        role: 'user',
        content: m.content.map(tr => {
          if (tr.type !== 'tool_result') return tr;
          const parsed = (() => { try { return JSON.parse(tr.content); } catch { return null; } })();
          if (!parsed) return tr;
          if (parsed.content && parsed.content.length > 200) {
            return { ...tr, content: JSON.stringify({ summary: `[File content read, ${parsed.content.length} chars]` }) };
          }
          return tr;
        }),
      };
    }
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      return {
        role: 'assistant',
        content: m.content.map(block => {
          if (block.type === 'tool_use' && block.name === 'write_file' && block.input?.content?.length > 200) {
            return { ...block, input: { ...block.input, content: `[File written, ${block.input.content.length} chars]` } };
          }
          return block;
        }),
      };
    }
    return m;
  });
  const trimmedOlder = older.length > 12 ? older.slice(-12) : older;
  return [...trimmedOlder, ...recent];
}

async function runAgent(apiKey, root, systemPrompt, conversationMessages, model, send) {
  const messages = conversationMessages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  const filesModified = [];
  const fileCache = {};
  const dirCache = {};
  let hasWritten = false;
  let readOnlyIterations = 0;

  for (let i = 0; i < 15; i++) {
    // Early-stop: if 5+ iterations without writing, bail out
    if (i >= 5 && !hasWritten) {
      send({ type: 'status', message: 'Reading files but not making changes — stopping.' });
      send({ type: 'done', reply: 'I read through the code but couldn\'t determine the right changes. Could you be more specific about what you\'d like me to build or change?', filesModified });
      return;
    }

    // Rate limit: pause between iterations
    if (i > 0) await new Promise(r => setTimeout(r, 3000));

    // Trim message history to control token count
    const trimmedMessages = trimAgentMessages(messages);

    // Inject escalating write-pressure when the model has read files but not written
    const cachedFiles = Object.keys(fileCache);
    if (cachedFiles.length > 0 && !hasWritten) {
      let nudge;
      if (readOnlyIterations >= 3) {
        nudge = `[SYSTEM: FINAL WARNING — ${readOnlyIterations} iterations without writing. You have the content of: ${cachedFiles.join(', ')}. If you do not call write_file THIS turn, the operation will be aborted. Do NOT output text describing changes. Do NOT read more files. Call write_file with the complete modified file content as your ONLY action.]`;
      } else if (readOnlyIterations >= 2) {
        nudge = `[SYSTEM: You have read ${cachedFiles.join(', ')} but have NOT called write_file yet. NOTHING has been changed. Your text does not modify files. You must call write_file now with the full modified file. Do not describe what you will do — do it.]`;
      } else if (readOnlyIterations >= 1) {
        nudge = `[SYSTEM: You already have the content of: ${cachedFiles.join(', ')}. Do not re-read them. Call write_file with your changes now.]`;
      } else {
        nudge = `[SYSTEM: Files in memory: ${cachedFiles.join(', ')}. Call write_file when ready — do not just describe changes in text.]`;
      }
      const lastMsg = trimmedMessages[trimmedMessages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        trimmedMessages.push({ role: 'user', content: nudge });
      } else if (lastMsg && lastMsg.role === 'user' && typeof lastMsg.content === 'string') {
        trimmedMessages[trimmedMessages.length - 1] = { ...lastMsg, content: lastMsg.content + '\n\n' + nudge };
      }
    }

    let data;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-20250514',
          max_tokens: 16384,
          system: systemPrompt,
          tools: TOOLS,
          messages: trimmedMessages,
        }),
      });
      data = await response.json();
      if (data.error && data.error.message && data.error.message.includes('rate limit')) {
        const waitSec = 15 + attempt * 15;
        send({ type: 'status', message: `Rate limit hit — waiting ${waitSec}s before retrying...` });
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }
      break;
    }
    if (data.error) {
      send({ type: 'error', message: data.error.message || JSON.stringify(data.error) });
      return;
    }

    // Stream text content from the response
    const textBlocks = data.content.filter(b => b.type === 'text');
    for (const block of textBlocks) {
      if (block.text) {
        send({ type: 'text', content: block.text });
      }
    }

    messages.push({ role: 'assistant', content: data.content });

    // If no tool use — the agent responded with text only
    if (data.stop_reason !== 'tool_use') {
      // If we have cached files but haven't written anything yet, the model
      // talked about changes without actually making them. Push it to try again.
      if (cachedFiles.length > 0 && !hasWritten && readOnlyIterations < 4) {
        readOnlyIterations++;
        send({ type: 'status', message: 'Archie described changes but hasn\'t written them yet — nudging...' });
        messages.push({ role: 'user', content: `NOTHING WAS CHANGED. You responded with text but did not call write_file. Your text does not modify files — only write_file does. The file ${cachedFiles[cachedFiles.length - 1]} is still unmodified. You must call write_file with the complete modified file content right now. Do not describe what you would do. Do not explain. Just call write_file.` });
        continue;
      }

      const fullText = textBlocks.map(b => b.text).join('\n');
      for (const filePath of filesModified) {
        if (/\.jsx?$/.test(filePath) && fileCache[filePath]) {
          const warnings = checkBalancedSyntax(fileCache[filePath], filePath);
          for (const w of warnings) {
            send({ type: 'status', message: `Warning: ${w}` });
          }
        }
      }
      // If the model claimed to be done but never wrote anything, flag it
      if (cachedFiles.length > 0 && !hasWritten) {
        send({ type: 'done', reply: 'I wasn\'t able to write the changes to disk. Could you try asking again with more detail about what you\'d like?', filesModified });
      } else {
        send({ type: 'done', reply: fullText, filesModified });
      }
      return;
    }

    // Process tool calls
    const toolResults = [];
    let wroteThisIteration = false;
    for (const block of data.content) {
      if (block.type === 'tool_use') {
        let result;

        if (block.name === 'read_file') {
          if (fileCache[block.input.path]) {
            send({ type: 'tool', action: 'read', path: block.input.path, message: `Reading ${block.input.path} (cached)` });
            result = { content: fileCache[block.input.path] };
          } else {
            send({ type: 'tool', action: 'read', path: block.input.path, message: `Reading ${block.input.path}` });
            result = executeTool(root, block.name, block.input);
            if (result.content) fileCache[block.input.path] = result.content;
          }
        } else if (block.name === 'list_directory') {
          if (dirCache[block.input.path]) {
            send({ type: 'tool', action: 'list', path: block.input.path, message: `Listing ${block.input.path} (cached)` });
            result = { entries: dirCache[block.input.path] };
          } else {
            send({ type: 'tool', action: 'list', path: block.input.path, message: `Listing ${block.input.path}` });
            result = executeTool(root, block.name, block.input);
            if (result.entries) dirCache[block.input.path] = result.entries;
          }
        } else if (block.name === 'write_file') {
          send({ type: 'tool', action: 'write', path: block.input.path, message: `Writing ${block.input.path}` });
          result = executeTool(root, block.name, block.input);
          if (result.success) {
            hasWritten = true;
            wroteThisIteration = true;
            filesModified.push(block.input.path);
            fileCache[block.input.path] = block.input.content;
            send({ type: 'file_written', path: block.input.path, message: `Saved ${block.input.path}` });
          }
        } else {
          result = executeTool(root, block.name, block.input);
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }
    messages.push({ role: 'user', content: toolResults });

    // Track consecutive read-only iterations
    if (wroteThisIteration) {
      readOnlyIterations = 0;
    } else {
      readOnlyIterations++;
    }
  }

  // Iteration limit reached
  for (const filePath of filesModified) {
    if (/\.jsx?$/.test(filePath) && fileCache[filePath]) {
      const warnings = checkBalancedSyntax(fileCache[filePath], filePath);
      for (const w of warnings) {
        send({ type: 'status', message: `Warning: ${w}` });
      }
    }
  }
  send({ type: 'done', reply: 'Reached the iteration limit. Some changes may have been applied.', filesModified });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  // Set SSE headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.status(200);

  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const { messages, model, currentRoom, allRooms, currentUser } = req.body;
    const systemPrompt = makeUnifiedSystem(currentRoom || 'study', allRooms || '', currentUser || null);
    await runAgent(apiKey, PROJECT_ROOT, systemPrompt, messages, model, send);
  } catch (err) {
    send({ type: 'error', message: err.message });
  }
  res.end();
}
