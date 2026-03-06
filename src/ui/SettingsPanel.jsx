import React from 'react';

const SETTINGS_ITEMS = [
  { key: 'chat', label: '\ud83d\udcac Chat' },
  { key: 'connect', label: '\ud83d\udd17 Connect' },
  { key: 'write', label: '\u270f\ufe0f Write' },
  { key: 'architect', label: '\ud83c\udfdb\ufe0f Architect' },
  { key: 'music', label: '\ud83c\udfbb Room Music' },
  { key: 'invite', label: '\u2709\ufe0f Invite' },
  { key: 'reggae', label: '\ud83c\udfb6 Reggae' },
];

export default function SettingsPanel({ iconSettings, setIconSettings, onClose }) {
  return (
    <div style={{
      position: 'absolute', bottom: '66px', right: '20px', zIndex: 95,
      background: 'rgba(15,12,10,0.95)', borderRadius: '12px', padding: '14px 16px',
      border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      width: '200px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <p style={{ margin: 0, color: '#888', fontSize: '10px', letterSpacing: '1px' }}>SHOW / HIDE</p>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#666', fontSize: '12px', cursor: 'pointer',
        }}>&#x2715;</button>
      </div>
      {SETTINGS_ITEMS.map(item => (
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
  );
}
