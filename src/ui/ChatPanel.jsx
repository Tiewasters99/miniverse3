import React from 'react';

export default function ChatPanel({ chatMessages, chatInput, setChatInput, sendChatMessage, onClose }) {
  return (
    <div style={{
      position: 'absolute', bottom: '20px', left: '20px', width: '320px', height: '400px',
      background: 'rgba(15,15,20,0.95)', borderRadius: '16px', border: '1px solid rgba(42,157,143,0.4)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 50,
    }}>
      <div style={{
        padding: '14px 16px', background: 'linear-gradient(135deg, #2a9d8f, #1a7a6f)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{'\ud83d\udcac'} Miniverse Chat</span>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
          width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
        }}>&#x2715;</button>
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
        <p style={{ margin: 0, color: '#555', fontSize: '10px', fontStyle: 'italic' }}>Real-time chat with guests {'\u2022'} Coming Soon</p>
      </div>
    </div>
  );
}
