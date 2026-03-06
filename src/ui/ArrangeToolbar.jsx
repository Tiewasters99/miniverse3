import React from 'react';

function formatName(furnitureId) {
  if (!furnitureId) return 'Object';
  // "study-armchair" → "Armchair", "jamaica-beach-chair-1" → "Beach Chair 1"
  const parts = furnitureId.split('-');
  // Drop the room prefix (first part)
  const nameParts = parts.slice(1);
  return nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export default function ArrangeToolbar({
  selectedFurniture,
  onRotateLeft,
  onRotateRight,
  onHeightChange,
  onResetObject,
  onResetAll,
}) {
  if (!selectedFurniture) return null;

  const name = formatName(selectedFurniture.userData?.furnitureId);
  const currentHeight = selectedFurniture.position?.y ?? 0;

  const btnStyle = {
    padding: '6px 14px',
    background: 'rgba(30,25,20,0.9)',
    border: '1px solid rgba(212,175,55,0.4)',
    borderRadius: '6px',
    color: '#d4af37',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
  };

  return (
    <div style={{
      position: 'absolute',
      top: '50px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    }}>
      {/* Object name */}
      <div style={{
        background: 'rgba(20,18,12,0.92)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: '10px',
        padding: '8px 20px',
        color: '#e8dcc0',
        fontSize: '13px',
        fontFamily: 'Georgia, serif',
        textAlign: 'center',
      }}>
        <span style={{ color: '#d4af37', fontWeight: 'bold' }}>{name}</span>
      </div>

      {/* Controls row */}
      <div style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        background: 'rgba(20,18,12,0.92)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: '10px',
        padding: '8px 12px',
      }}>
        <button onClick={onRotateLeft} style={btnStyle} title="Rotate Left 15\u00b0">
          \u21b6
        </button>
        <button onClick={onRotateRight} style={btnStyle} title="Rotate Right 15\u00b0">
          \u21b7
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '6px',
          color: '#a09880',
          fontSize: '11px',
          fontFamily: 'Georgia, serif',
        }}>
          <span>Height</span>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={currentHeight}
            onChange={(e) => onHeightChange(parseFloat(e.target.value))}
            style={{ width: '80px', accentColor: '#d4af37' }}
          />
          <span style={{ minWidth: '28px', textAlign: 'right' }}>{currentHeight.toFixed(1)}</span>
        </div>

        <button onClick={onResetObject} style={{ ...btnStyle, marginLeft: '6px', color: '#a08870' }} title="Reset This Object">
          \u21a9
        </button>
        <button onClick={onResetAll} style={{ ...btnStyle, color: '#a05540' }} title="Reset All Furniture">
          Reset All
        </button>
      </div>
    </div>
  );
}
