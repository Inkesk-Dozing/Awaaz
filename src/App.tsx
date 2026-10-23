import React, { useState } from 'react';
import { voiceEngine } from './audio/VoiceEngine';
import { useAppStore } from './state/store';
import { DevWaveformVisualizer } from './ui/components/DevWaveformVisualizer';

export const App: React.FC = () => {
  const { hasMicPermission, micError, setAudioUnlocked, setMicPermission, setMicError } = useAppStore();
  const [isInitializing, setIsInitializing] = useState(false);

  const handleStartAudio = async () => {
    setIsInitializing(true);
    try {
      await voiceEngine.unlockAudioContext();
      setAudioUnlocked(true);
      await voiceEngine.acquireMicrophone();
      setMicPermission(true);
    } catch (err) {
      setMicError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#020617',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <header style={{ textAlign: 'center', maxWidth: '640px', marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          background: 'linear-gradient(to right, #38bdf8, #818cf8, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          Awaaz
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
          Browser-native Voice Changer Studio & Peer-to-Peer Lie Detector.
          Zero servers hear your voice.
        </p>
      </header>

      <main style={{
        width: '100%',
        maxWidth: '640px',
        backgroundColor: '#0b1329',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        {!hasMicPermission ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
              To initialize the real-time audio pipeline, click below to unlock the Web Audio Context and grant microphone access.
            </p>
            <button
              onClick={handleStartAudio}
              disabled={isInitializing}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: isInitializing ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              {isInitializing ? 'Connecting Audio...' : 'Start Audio Pipeline'}
            </button>
            {micError && (
              <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#450a0a', border: '1px solid #991b1b', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem' }}>
                {micError}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #1e293b' }}>
              <div>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', marginRight: '8px' }}></span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>Audio Engine Running</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>
                Raw Input (No AEC/AGC)
              </span>
            </div>

            <DevWaveformVisualizer />
          </div>
        )}
      </main>

      <footer style={{ marginTop: '2.5rem', textAlign: 'center', color: '#475569', fontSize: '0.8rem' }}>
        Awaaz Architecture Verification · Phase 0 Milestone
      </footer>
    </div>
  );
};
