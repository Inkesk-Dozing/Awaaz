import React from 'react';
import { SignalQualityMetrics } from '../../audio/dsp/vad';

export interface QualityBadgeProps {
  metrics: SignalQualityMetrics;
  isRelayActive?: boolean;
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({ metrics, isRelayActive = false }) => {
  const { isReliable, isClipping, qualityIndex, snrDb, statusMessage } = metrics;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.4rem 0.75rem',
        backgroundColor: '#090d16',
        borderRadius: '8px',
        border: `1px solid ${!isReliable || isClipping ? '#ef4444' : '#1e293b'}`,
        fontSize: '0.75rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Quality Indicator Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isClipping
              ? '#ef4444'
              : !isReliable
              ? '#f59e0b'
              : '#10b981',
            boxShadow: `0 0 8px ${
              isClipping ? 'rgba(239, 68, 68, 0.8)' : !isReliable ? 'rgba(245, 158, 11, 0.8)' : 'rgba(16, 185, 129, 0.6)'
            }`,
          }}
        />
        <span style={{ fontWeight: 700, color: '#f8fafc' }}>
          {statusMessage}
        </span>
      </div>

      {/* SNR & Q score */}
      <span style={{ color: '#64748b', fontFamily: 'monospace' }}>
        SNR: {snrDb}dB | Q: {(qualityIndex * 100).toFixed(0)}%
      </span>

      {/* Relay Indicator Badge (HU10) */}
      {isRelayActive && (
        <span
          title="WebRTC TURN relay active: higher network latency expected."
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #f59e0b',
            color: '#fbbf24',
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.05em',
          }}
        >
          RELAY ACTIVE
        </span>
      )}
    </div>
  );
};
