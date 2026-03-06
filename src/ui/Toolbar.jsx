import React from 'react';

export default function Toolbar({
  config, iconSettings, tabsVisible,
  setSettingsOpen, settingsOpen,
  setChatOpen, setMiniverseInviteOpen,
  setArchitectOpen, architectOpen,
  setAudioMenuOpen,
  setInviteModalOpen,
  setReggaeMenuOpen,
  setCustomAudioOpen, customAudioOpen, customAudioPlaying,
  setDoorMenuOpen, doorMenuOpen,
  comingSoonTip, setComingSoonTip,
  arrangeMode, onToggleArrange,
}) {
  if (!tabsVisible) return null;

  return (
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
      }}>{'\u2699'}</button>

      {/* Chat */}
      {iconSettings.chat && (
        <button onClick={() => setChatOpen(true)} title="Chat" style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(42,157,143,0.8)', border: 'none', color: '#fff', fontSize: '15px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{'\ud83d\udcac'}</button>
      )}

      {/* Connect */}
      {iconSettings.connect && (
        <button onClick={() => setMiniverseInviteOpen(true)} title="Connect Miniverses" style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(138,43,226,0.8)', border: 'none', color: '#fff', fontSize: '15px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{'\ud83d\udd17'}</button>
      )}

      {/* Write */}
      {iconSettings.write && (
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setComingSoonTip('write'); setTimeout(() => setComingSoonTip(false), 2000); }} title="Write on Wall" style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(100,80,70,0.4)', border: 'none', color: '#888', fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6,
          }}>{'\u270f\ufe0f'}</button>
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
        }}>{'\ud83c\udfdb\ufe0f'}</button>
      )}

      {/* Room music */}
      {config.hasMusic && iconSettings.music && (
        <button onClick={() => setAudioMenuOpen(true)} title="Room Music" style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(106,90,205,0.8)', border: 'none', color: '#fff', fontSize: '15px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{'\ud83c\udfbb'}</button>
      )}

      {/* Invite */}
      {config.hasMusic && iconSettings.invite && (
        <button onClick={() => setInviteModalOpen(true)} title="Invite Guests" style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(212,175,55,0.8)', border: 'none', color: '#1a1a1a', fontSize: '15px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{'\u2709\ufe0f'}</button>
      )}

      {/* Reggae */}
      {config.hasReggaeMusic && iconSettings.reggae && (
        <button onClick={() => setReggaeMenuOpen(true)} title="Reggae Vibes" style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(29,185,84,0.8)', border: 'none', color: '#fff', fontSize: '15px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{'\ud83c\udfb6'}</button>
      )}

      {/* Arrange */}
      <button onClick={onToggleArrange} title="Arrange Furniture" style={{
        width: '38px', height: '38px', borderRadius: '50%',
        background: arrangeMode
          ? 'linear-gradient(135deg, #d4af37, #b8962e)'
          : 'rgba(30,25,15,0.85)',
        border: arrangeMode ? '2px solid #d4af37' : '1px solid rgba(212,175,55,0.3)',
        color: arrangeMode ? '#1a1a1a' : '#d4af37',
        fontSize: '16px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: arrangeMode ? '0 0 15px rgba(212,175,55,0.4)' : 'none',
      }}>{'\u2725'}</button>

      {/* Video - coming soon */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setComingSoonTip('video'); setTimeout(() => setComingSoonTip(false), 2000); }} title="My Video" style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(20,15,30,0.85)', border: '1px solid rgba(99,102,241,0.3)',
          color: '#6366f1', fontSize: '15px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6,
        }}>{'\ud83c\udfac'}</button>
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
      <button onClick={() => setCustomAudioOpen(!customAudioOpen)} title="My Music" style={{
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
      }}>{'\u266a'}</button>

      {/* Other Wings */}
      <button onClick={() => setDoorMenuOpen(!doorMenuOpen)} title="Other Wings" style={{
        width: '38px', height: '38px', borderRadius: '50%',
        background: doorMenuOpen ? 'rgba(139,115,85,0.9)' : 'rgba(139,115,85,0.7)',
        border: 'none', color: '#fff', fontSize: '15px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: doorMenuOpen ? '0 0 12px rgba(139,115,85,0.4)' : 'none',
      }}>{'\ud83d\udeaa'}</button>
    </div>
  );
}
