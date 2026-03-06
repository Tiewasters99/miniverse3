import React from 'react';
import { MOZART_TRACKS } from '../utils/constants.js';

// Mozart Audio Menu
export function AudioMenu({ onClose, playTrack }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '24px', maxWidth: '340px', border: '1px solid rgba(212,175,55,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#d4af37' }}>{'\ud83c\udfbb'} Mozart</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer' }}>{'\u00d7'}</button>
        </div>
        {MOZART_TRACKS.map((track, i) => (
          <button key={i} onClick={() => playTrack(track)} style={{
            width: '100%', padding: '14px', marginBottom: '10px', background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px', color: '#e8e4df', cursor: 'pointer', textAlign: 'left',
          }}>{'\ud83c\udfb5'} {track.name}</button>
        ))}
      </div>
    </div>
  );
}

// Invite Modal
export function InviteModal({ onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '28px', maxWidth: '400px', border: '1px solid rgba(212,175,55,0.3)', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>{'\u2709\ufe0f'}</div>
        <h3 style={{ margin: '0 0 8px', color: '#d4af37', fontSize: '20px' }}>An Evening of Mozart</h3>
        <p style={{ color: '#888', fontStyle: 'italic', margin: '0 0 16px' }}>in my Miniverse{'\u2122'} Orangerie</p>
        <p style={{ color: '#e8e4df', lineHeight: 1.6, margin: '0 0 20px' }}>You're cordially invited to join me for an evening of classical music amid the citrus trees and fountains of the Orangerie.</p>
        <button onClick={onClose} style={{
          padding: '14px 32px', background: 'linear-gradient(135deg, #d4af37, #b8962e)',
          border: 'none', borderRadius: '10px', color: '#1a1a1a', fontWeight: 600, cursor: 'pointer',
        }}>Close Preview</button>
      </div>
    </div>
  );
}

// Reggae Music Menu
export function ReggaeMenu({ onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)', borderRadius: '16px', padding: '24px', maxWidth: '380px', border: '1px solid rgba(29,185,84,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#1db954', fontSize: '18px' }}>{'\ud83c\udfb6'} Reggae Vibes</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer' }}>{'\u00d7'}</button>
        </div>
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px', fontStyle: 'italic' }}>Connect your streaming service</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {[{ name: 'Spotify', icon: '\ud83d\udfe2', color: '#1db954' }, { name: 'Pandora', icon: '\ud83d\udfe5', color: '#005ab4' }].map((svc, i) => (
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
          { name: 'Vibes of Kingston', icon: '\ud83c\udfd6\ufe0f', color: '#009b3a' },
          { name: 'Bob Marley', icon: '\ud83c\udfa4', color: '#fed100' },
          { name: 'Jimmy Cliff', icon: '\ud83c\udf0a', color: '#e63946' },
          { name: 'My Music', icon: '\u2764\ufe0f', color: '#ff69b4' },
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
  );
}

// Connect Miniverses Modal
export function ConnectModal({ onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'linear-gradient(165deg, #1a1a2a 0%, #0d0d1a 100%)', borderRadius: '20px', padding: '28px', maxWidth: '380px', border: '1px solid rgba(138,43,226,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#8a2be2', fontSize: '20px' }}>{'\ud83c\udf10'} Connect Miniverses</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px' }}>&#x2715;</button>
        </div>
        <p style={{ color: '#a0a0b0', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
          Link your Miniverse{'\u2122'} to others and create an infinite, honeycombed Omniverse.
        </p>
        <div style={{ background: 'rgba(138,43,226,0.1)', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(138,43,226,0.2)', textAlign: 'center' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>{'\ud83d\udc1d'}</span>
          <h4 style={{ margin: '0 0 8px', color: '#c0a0e0', fontSize: '16px' }}>Portal Network</h4>
          <p style={{ margin: 0, color: '#666', fontSize: '12px', lineHeight: 1.5 }}>
            Send invitations {'\u2022'} Accept connections<br/>Build your corner of the infinite Omniverse
          </p>
        </div>
        <button onClick={onClose} style={{
          width: '100%', padding: '14px', background: 'linear-gradient(135deg, #8a2be2, #5a1a9a)',
          border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>Close</button>
      </div>
    </div>
  );
}

// Escalation Modal
export function EscalationModal({ onClose, escalationSummary }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)',
        borderRadius: '16px', padding: '28px', width: '420px', maxHeight: '80vh',
        border: '1px solid rgba(59,130,246,0.4)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#60a5fa', fontSize: '18px' }}>{'\ud83d\udc64'} Connect with a Human Developer</h3>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
          }}>&#x2715;</button>
        </div>
        <p style={{ color: '#a0a0a0', fontSize: '13px', lineHeight: 1.6, margin: '0 0 16px' }}>
          A Grapheon developer can join your session to implement changes directly.
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px',
          marginBottom: '16px', maxHeight: '200px', overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ color: '#666', fontSize: '10px', letterSpacing: '1px', margin: '0 0 8px' }}>CONVERSATION BRIEF</p>
          <pre style={{ color: '#999', fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.5 }}>
            {escalationSummary || 'No conversation yet.'}
          </pre>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => navigator.clipboard?.writeText(escalationSummary)} style={{
            padding: '12px', background: 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.3)', borderRadius: '10px',
            color: '#60a5fa', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
          }}>{'\ud83d\udccb'} Copy Brief to Clipboard</button>
          <button style={{
            padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            border: 'none', borderRadius: '10px',
            color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>{'\ud83d\udd17'} Request a Developer Session (coming soon)</button>
          <p style={{ color: '#555', fontSize: '10px', textAlign: 'center', margin: '4px 0 0', fontStyle: 'italic' }}>
            Developer sessions are staffed by vetted Grapheon engineers.
          </p>
        </div>
      </div>
    </div>
  );
}

// Now Playing bar
export function NowPlaying({ currentTrack, stopPlayback }) {
  return (
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
      }}>{'\u23f9'}</button>
    </div>
  );
}
