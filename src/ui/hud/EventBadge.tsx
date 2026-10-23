import React, { useEffect, useState } from 'react';

export interface EventBadgeProps {
  isFlinch?: boolean;
  snrDb?: number;
  snrThresholdDb?: number;
}

export const EventBadge: React.FC<EventBadgeProps> = ({
  isFlinch = false,
  snrDb = 25,
  snrThresholdDb = 10,
}) => {
  const [flinchActive, setFlinchActive] = useState(false);

  useEffect(() => {
    if (isFlinch) {
      setFlinchActive(true);
      const timer = setTimeout(() => {
        setFlinchActive(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isFlinch]);

  const isSignalLow = snrDb < snrThresholdDb;

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        fontFamily: '"Courier New", monospace',
      }}
    >
      {/* FLINCH Alarm Badge */}
      <div
        style={{
          padding: '0.25rem 0.6rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          transition: 'all 0.05s ease-in',
          backgroundColor: flinchActive ? '#ef4444' : '#1e293b',
          color: flinchActive ? '#ffffff' : '#475569',
          boxShadow: flinchActive ? '0 0 12px #ef4444' : 'none',
          border: `1px solid ${flinchActive ? '#f87171' : '#334155'}`,
        }}
      >
        ⚡ FLINCH!
      </div>

      {/* Signal Quality Warning Overlay */}
      {isSignalLow ? (
        <div
          style={{
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            backgroundColor: '#7f1d1d',
            color: '#fca5a5',
            border: '1px solid #ef4444',
            animation: 'pulse 1.5s infinite',
          }}
        >
          ⚠ SIGNAL UNRELIABLE ({snrDb.toFixed(1)} dB)
        </div>
      ) : (
        <div
          style={{
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#38bdf8',
            backgroundColor: '#082f49',
            border: '1px solid #0284c7',
          }}
        >
          SIGNAL OK ({snrDb.toFixed(1)} dB)
        </div>
      )}
    </div>
  );
};
