import React from 'react';

export default function HUD({ config }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 24px',
      background: config.isExterior ? 'linear-gradient(to bottom, rgba(135,206,235,0.5), transparent)' : 'linear-gradient(to bottom, rgba(10,10,15,0.95), transparent)',
      pointerEvents: 'none',
    }}>
      <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 300, color: config.isExterior ? '#1a1a1a' : '#e8e4df', letterSpacing: '2px' }}>
        {config.name}
      </h1>
      <p style={{ margin: '4px 0 0', fontSize: '11px', color: config.isExterior ? '#333' : '#8a8578', letterSpacing: '2px' }}>
        {config.subtitle}
      </p>
    </div>
  );
}
