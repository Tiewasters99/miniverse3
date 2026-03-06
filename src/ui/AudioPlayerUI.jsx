import React from 'react';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

export default function AudioPlayerUI({
  customAudioOpen, onClose,
  customAudioName, customAudioReady, customAudioPlaying,
  customAudioDuration, customAudioTime,
  playCustomAudio, pauseCustomAudio,
  handleAudioUpload,
  savedLibrary, loadFromLibrary, removeFromLibrary,
  saveToLibrary, librarySaving, libraryMsg,
  currentSavedInLibrary,
}) {
  if (!customAudioOpen) return null;

  return (
    <div style={{
      position: 'absolute', bottom: '66px', right: '20px',
      width: '300px', background: 'linear-gradient(165deg, #1c1208 0%, #0d0a05 100%)',
      borderRadius: '16px', border: '1px solid rgba(217,119,6,0.3)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 90,
      maxHeight: 'calc(100vh - 120px)',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid rgba(217,119,6,0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{'\ud83c\udfb5'}</span>
          <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '14px', fontWeight: 700 }}>My Music</h3>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          width: '26px', height: '26px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
        }}>&#x2715;</button>
      </div>

      <div style={{ padding: '16px 18px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        {customAudioName && (
          <p style={{
            margin: '0 0 12px', color: '#fbbf24', fontSize: '13px', fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{'\u266a'} {customAudioName}</p>
        )}

        {customAudioReady && (
          <div style={{ marginBottom: '12px' }}>
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
              >{customAudioPlaying ? '\u23f8' : '\u25b6'}</button>
              <div style={{ flex: 1 }}>
                <div style={{ height: '4px', background: 'rgba(217,119,6,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
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

        {customAudioName && !customAudioReady && !customAudioName.startsWith('Error') && (
          <p style={{ margin: '0 0 12px', color: '#92400e', fontSize: '11px' }}>{'\u23f3'} Decoding audio...</p>
        )}
        {customAudioName && customAudioName.startsWith('Error') && (
          <p style={{ margin: '0 0 12px', color: '#f87171', fontSize: '11px' }}>{'\u26a0'} Could not decode {'\u2014'} try an MP3 file</p>
        )}

        {customAudioReady && !currentSavedInLibrary && savedLibrary.length < 3 && (
          <button onClick={saveToLibrary} disabled={librarySaving} style={{
            width: '100%', padding: '8px', marginBottom: '8px',
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: '8px', color: '#4ade80', fontSize: '11px', fontWeight: 600,
            cursor: librarySaving ? 'default' : 'pointer',
          }}>{librarySaving ? '\u23f3 Saving...' : '\ud83d\udcbe Save to Room Library'}</button>
        )}

        {libraryMsg && (
          <p style={{
            margin: '0 0 8px', fontSize: '10px', textAlign: 'center',
            color: libraryMsg === 'Saved!' ? '#4ade80' : libraryMsg === 'Loading...' ? '#92400e' : '#f87171',
          }}>{libraryMsg}</p>
        )}

        {savedLibrary.length > 0 && (
          <div style={{ marginBottom: '10px', borderTop: '1px solid rgba(217,119,6,0.15)', paddingTop: '10px' }}>
            <p style={{ margin: '0 0 6px', color: '#92400e', fontSize: '9px', letterSpacing: '1px' }}>
              ROOM LIBRARY ({savedLibrary.length}/3)
            </p>
            {savedLibrary.map((track, i) => (
              <div key={track.key} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0',
                borderBottom: i < savedLibrary.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <button onClick={() => loadFromLibrary(track)} style={{
                  flex: 1, background: 'none', border: 'none', textAlign: 'left',
                  cursor: 'pointer', padding: '2px 0', fontSize: '11px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  color: customAudioName === track.name ? '#fbbf24' : '#999',
                }}>{'\u266a'} {track.name} <span style={{ color: '#555', fontSize: '9px' }}>({formatTime(track.duration)})</span></button>
                <button onClick={() => removeFromLibrary(i)} style={{
                  background: 'none', border: 'none', color: '#555', fontSize: '10px',
                  cursor: 'pointer', padding: '2px 4px', flexShrink: 0,
                }}>&#x2715;</button>
              </div>
            ))}
          </div>
        )}

        <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: 'none' }} id="customAudioUpload" />
        <label htmlFor="customAudioUpload" style={{
          display: 'block', textAlign: 'center', padding: '10px',
          background: 'rgba(217,119,6,0.15)', border: '1px dashed rgba(217,119,6,0.3)',
          borderRadius: '10px', color: '#d97706', fontSize: '12px', cursor: 'pointer', fontWeight: 500,
        }}>
          {customAudioReady ? '\ud83c\udfb5 Choose Different Track' : '\ud83c\udfb5 Upload Music File'}
        </label>
      </div>
    </div>
  );
}
