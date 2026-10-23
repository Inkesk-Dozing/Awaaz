import React, { useEffect, useState } from 'react';

export interface ResilienceManagerProps {
  onMicrophoneRevoked?: () => void;
  onVisibilityHidden?: () => void;
  onVisibilityVisible?: () => void;
}

export const ResilienceManager: React.FC<ResilienceManagerProps> = ({
  onMicrophoneRevoked,
  onVisibilityHidden,
  onVisibilityVisible,
}) => {
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const [micRevoked, setMicRevoked] = useState(false);

  useEffect(() => {
    // 1. Mobile Safari/iOS background suspension detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBackgrounded(true);
        if (onVisibilityHidden) onVisibilityHidden();
      } else {
        setIsBackgrounded(false);
        if (onVisibilityVisible) onVisibilityVisible();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 2. Microphone Permissions Observer (if supported)
    let permissionStatus: PermissionStatus | null = null;
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((status) => {
          permissionStatus = status;
          status.onchange = () => {
            if (status.state === 'denied') {
              setMicRevoked(true);
              if (onMicrophoneRevoked) onMicrophoneRevoked();
            } else if (status.state === 'granted') {
              setMicRevoked(false);
            }
          };
        })
        .catch(() => {
          // Some browsers restrict query for microphone
        });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [onMicrophoneRevoked, onVisibilityHidden, onVisibilityVisible]);

  return (
    <>
      {/* iOS Background Warning Modal */}
      {isBackgrounded && (
        <div
          role="alertdialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(2, 6, 23, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              backgroundColor: '#090d16',
              border: '2px solid #ef4444',
              borderRadius: '14px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
              color: '#f8fafc',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>⏸</div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#f87171',
                margin: '0 0 0.5rem',
              }}
            >
              TAB BACKGROUNDED // AUDIO SUSPENDED
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
              iOS Safari and mobile browsers freeze Web Audio and WebRTC media when tabs are
              hidden. Return to this tab immediately to resume interrogation telemetry.
            </p>
          </div>
        </div>
      )}

      {/* Microphone Revocation Error Modal */}
      {micRevoked && (
        <div
          role="alertdialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(2, 6, 23, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              backgroundColor: '#0f172a',
              border: '1px solid #dc2626',
              borderRadius: '12px',
              padding: '1.75rem',
              color: '#f8fafc',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎙❌</div>
            <h2 style={{ fontSize: '1.25rem', color: '#f87171', margin: '0 0 0.5rem' }}>
              Microphone Permission Denied
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Microphone access was denied or revoked. Please tap the URL bar permissions icon,
              enable your microphone, and refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                background: '#dc2626',
                border: 'none',
                color: '#fff',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh Session
            </button>
          </div>
        </div>
      )}
    </>
  );
};
