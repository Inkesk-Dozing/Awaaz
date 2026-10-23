import React from 'react';

export interface DeceptionBarProps {
  score: number; // 0 - 100
  verdict: 'TRUTH' | 'UNSTABLE' | 'DECEPTION';
  confidence: number; // 0.0 - 1.0
  compact?: boolean;
}

export const DeceptionBar: React.FC<DeceptionBarProps> = ({
  score,
  verdict,
  confidence,
  compact = false,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  const getVerdictTheme = () => {
    switch (verdict) {
      case 'DECEPTION':
        return {
          textColor: '#f87171',
          bgGradient: 'linear-gradient(90deg, #dc2626, #ef4444)',
          borderGlow: 'rgba(239, 68, 68, 0.4)',
          badgeText: 'DECEPTION DETECTED [CRITICAL]',
        };
      case 'UNSTABLE':
        return {
          textColor: '#facc15',
          bgGradient: 'linear-gradient(90deg, #ca8a04, #eab308)',
          borderGlow: 'rgba(234, 179, 8, 0.4)',
          badgeText: 'PHYSIOLOGICAL STRESS [UNSTABLE]',
        };
      case 'TRUTH':
      default:
        return {
          textColor: '#4ade80',
          bgGradient: 'linear-gradient(90deg, #16a34a, #22c55e)',
          borderGlow: 'rgba(34, 197, 94, 0.4)',
          badgeText: 'BASELINE VERIFIED [TRUTH]',
        };
    }
  };

  const theme = getVerdictTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        background: '#090d16',
        borderRadius: '10px',
        border: `1px solid #1e293b`,
        padding: compact ? '0.5rem 0.75rem' : '0.85rem 1rem',
        boxShadow: `0 0 15px ${theme.borderGlow}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: '"Courier New", monospace',
          fontSize: '0.75rem',
        }}
      >
        <span style={{ color: '#94a3b8', fontWeight: 600 }}>
          DECEPTION COMPOSITE
        </span>
        <span style={{ color: theme.textColor, fontWeight: 700 }}>
          {theme.badgeText}
        </span>
      </div>

      {/* Progress Bar Track */}
      <div
        style={{
          width: '100%',
          height: compact ? '14px' : '22px',
          backgroundColor: '#0f172a',
          borderRadius: '4px',
          border: '1px solid #334155',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <div
          style={{
            width: `${clampedScore}%`,
            height: '100%',
            background: theme.bgGradient,
            transition: 'width 0.2s ease-out, background 0.3s ease',
          }}
        />

        {/* Confidence Interval Shadow Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: `${(1 - confidence) * 100}%`,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.5) 4px, rgba(0,0,0,0.5) 8px)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Readout Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: '"Courier New", monospace',
          fontSize: '0.7rem',
          color: '#64748b',
        }}
      >
        <span>
          INDEX: <strong style={{ color: '#f8fafc' }}>{clampedScore} / 100</strong>
        </span>
        <span>
          CONFIDENCE: <strong style={{ color: '#cbd5e1' }}>{Math.round(confidence * 100)}%</strong>
        </span>
      </div>
    </div>
  );
};
