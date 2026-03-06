import React, { useState } from 'react';

export default function NavigationMenu({ doors, onNavigate, onClose, onCreateRoom }) {
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleCreate = () => {
    const name = newRoomName.trim();
    if (!name) return;
    onCreateRoom(name);
    setNewRoomName('');
    setCreatingRoom(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') { setCreatingRoom(false); setNewRoomName(''); }
  };

  return (
    <div style={{
      position: 'absolute', bottom: '66px', right: '20px', zIndex: 95,
      background: 'rgba(15,12,10,0.95)', borderRadius: '12px', padding: '10px',
      border: '1px solid rgba(139,115,85,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      minWidth: '180px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', padding: '0 6px' }}>
        <p style={{ margin: 0, color: '#888', fontSize: '10px', letterSpacing: '1px' }}>OTHER WINGS</p>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#666', fontSize: '12px', cursor: 'pointer', padding: '2px 4px',
        }}>&#x2715;</button>
      </div>
      {doors.map((door, i) => (
        <button key={i} onClick={() => { onClose(); onNavigate(door.to); }} style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          padding: '8px 10px', background: 'none', border: 'none',
          color: '#ccc', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', textAlign: 'left',
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          <span style={{ fontSize: '14px' }}>{door.icon}</span>
          {door.label}
        </button>
      ))}

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(139,115,85,0.2)', margin: '6px 0' }} />

      {!creatingRoom ? (
        <button onClick={() => setCreatingRoom(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          padding: '8px 10px', background: 'none', border: 'none',
          color: '#8b7355', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', textAlign: 'left',
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          <span style={{ fontSize: '14px' }}>+</span>
          New Room
        </button>
      ) : (
        <div style={{ padding: '6px 6px 4px' }}>
          <input
            autoFocus
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Room name..."
            maxLength={40}
            style={{
              width: '100%', padding: '6px 8px', fontSize: '12px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(139,115,85,0.4)',
              borderRadius: '4px', color: '#ccc', outline: 'none',
              fontFamily: 'Georgia, serif', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <button onClick={handleCreate} style={{
              flex: 1, padding: '5px 0', fontSize: '11px', cursor: 'pointer',
              background: 'rgba(139,115,85,0.3)', border: '1px solid rgba(139,115,85,0.5)',
              borderRadius: '4px', color: '#ccc',
            }}>Create</button>
            <button onClick={() => { setCreatingRoom(false); setNewRoomName(''); }} style={{
              flex: 1, padding: '5px 0', fontSize: '11px', cursor: 'pointer',
              background: 'none', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px', color: '#888',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
