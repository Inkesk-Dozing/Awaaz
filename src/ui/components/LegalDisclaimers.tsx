import React, { useState } from 'react';

export const LegalDisclaimers: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer
      style={{
        marginTop: '2rem',
        maxWidth: '640px',
        width: '100%',
        backgroundColor: '#090d16',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '0.85rem 1rem',
        fontSize: '0.75rem',
        color: '#64748b',
        lineHeight: 1.5,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ fontWeight: 600, color: '#94a3b8' }}>
          ⚖ Legal Disclaimers, Entertainment Notice & Privacy Policy
        </span>
        <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>
          {isExpanded ? '▲ Hide' : '▼ View Details'}
        </span>
      </div>

      <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
        <strong>For entertainment only.</strong> Awaaz measures acoustic vocal arousal and
        micro-perturbations, not objective truth or deception. It is not a scientific or forensic
        lie detector.
      </p>

      {isExpanded && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            <strong style={{ color: '#cbd5e1' }}>Vocal Health & Medical Disclaimer:</strong>{' '}
            Acoustic metrics and stress indicators are designed exclusively for party gameplay.
            Awaaz is not a medical, clinical, or diagnostic device.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#cbd5e1' }}>Zero-Knowledge Privacy Architecture:</strong>{' '}
            Zero audio recordings are ever stored or transmitted to external servers. Disguised
            voice audio travels strictly peer-to-peer between players over WebRTC. Telemetry
            extraction remains private and runs 100% locally on your device hardware.
          </p>
        </div>
      )}
    </footer>
  );
};
