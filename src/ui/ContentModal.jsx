import React from 'react';
import { WALL_PANELS } from '../utils/constants.js';

export default function ContentModal({ panelId, onClose }) {
  const panel = WALL_PANELS[panelId];
  if (!panel) return null;

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)',
        borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%',
        border: '1px solid rgba(212,175,55,0.4)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{panel.icon}</div>
            <h3 style={{ margin: 0, color: '#d4af37', fontSize: '20px', lineHeight: 1.3 }}>{panel.title}</h3>
            <p style={{ margin: '6px 0 0', color: '#8a8578', fontSize: '13px', fontStyle: 'italic' }}>{panel.subtitle}</p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px',
            flexShrink: 0, marginLeft: '12px',
          }}>&#x2715;</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {panel.links.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', padding: '18px 20px',
              background: `linear-gradient(135deg, ${panel.color} 0%, ${panel.color}dd 100%)`,
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
        <p style={{ margin: '20px 0 0', color: '#555', fontSize: '11px', textAlign: 'center', fontStyle: 'italic' }}>
          Click outside or &#x2715; to close
        </p>
      </div>
    </div>
  );
}
