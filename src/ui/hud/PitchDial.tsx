import React from 'react';

export interface PitchDialProps {
  currentPitchHz: number;
  baselinePitchHz: number;
  width?: number;
  height?: number;
}

export const PitchDial: React.FC<PitchDialProps> = ({
  currentPitchHz,
  baselinePitchHz,
  width = 220,
}) => {
  const deltaHz = currentPitchHz > 0 && baselinePitchHz > 0 ? currentPitchHz - baselinePitchHz : 0;
  // Semitone difference: 12 * log2(f / f0)
  const deltaSemitones =
    currentPitchHz > 20 && baselinePitchHz > 20
      ? 12 * Math.log2(currentPitchHz / baselinePitchHz)
      : 0;

  // Clamped between -50Hz and +50Hz for display
  const maxRange = 50;
  const clampedDelta = Math.max(-maxRange, Math.min(maxRange, deltaHz));
  const normalizedPos = (clampedDelta + maxRange) / (maxRange * 2); // 0 to 1, 0.5 is center

  const isStressHigh = Math.abs(deltaSemitones) > 2.0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#090d16',
        borderRadius: '10px',
        border: '1px solid #1e293b',
        padding: '0.75rem',
        width: `${width}px`,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '0.7rem',
          color: '#94a3b8',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
        }}
      >
        PITCH DRIFT (ΔHz)
      </div>

      <div
        style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          fontFamily: '"Courier New", monospace',
          color: isStressHigh ? '#f87171' : '#38bdf8',
          marginBottom: '0.5rem',
        }}
      >
        {deltaHz > 0 ? `+${deltaHz.toFixed(1)}` : deltaHz.toFixed(1)} Hz
      </div>

      {/* Center-Zero Bounded Slider Gauge */}
      <div
        style={{
          width: '100%',
          height: '14px',
          background: '#0f172a',
          borderRadius: '4px',
          position: 'relative',
          border: '1px solid #334155',
          overflow: 'hidden',
          marginBottom: '0.4rem',
        }}
      >
        {/* Center mark */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            background: '#64748b',
            transform: 'translateX(-50%)',
          }}
        />

        {/* Delta bar extending from center */}
        {deltaHz >= 0 ? (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '2px',
              bottom: '2px',
              width: `${(normalizedPos - 0.5) * 100}%`,
              background: isStressHigh ? '#ef4444' : '#38bdf8',
              transition: 'width 0.15s ease-out',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              right: '50%',
              top: '2px',
              bottom: '2px',
              width: `${(0.5 - normalizedPos) * 100}%`,
              background: isStressHigh ? '#ef4444' : '#38bdf8',
              transition: 'width 0.15s ease-out',
            }}
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          fontFamily: '"Courier New", monospace',
          fontSize: '0.65rem',
          color: '#64748b',
        }}
      >
        <span>-50 Hz</span>
        <span>
          ΔST: <strong style={{ color: '#cbd5e1' }}>{deltaSemitones.toFixed(2)}</strong>
        </span>
        <span>+50 Hz</span>
      </div>
    </div>
  );
};
