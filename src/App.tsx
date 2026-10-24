import React, { useState } from 'react';
import { voiceEngine } from './audio/VoiceEngine';
import { useAppStore } from './state/store';
import { DevWaveformVisualizer } from './ui/components/DevWaveformVisualizer';
import { LegalDisclaimers } from './ui/components/LegalDisclaimers';
import { ResilienceManager } from './ui/components/ResilienceManager';
import { StudioPage } from './ui/pages/StudioPage';
import { CalibrationPage } from './ui/pages/CalibrationPage';
import { DisguisePage } from './ui/pages/DisguisePage';

export const App: React.FC = () => {
  const { hasMicPermission, micError, setAudioUnlocked, setMicPermission, setMicError } = useAppStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'disguise' | 'calibration'>('studio');

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
      padding: '2rem 1rem'
    }}>
      <header style={{ textAlign: 'center', maxWidth: '720px', marginBottom: '1.5rem' }}>
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
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Browser-Native Voice Changer Studio & P2P Polygraph Arena. Zero servers hear your voice.
        </p>
      </header>

      <main style={{
        width: '100%',
        maxWidth: '720px',
        backgroundColor: '#0b1329',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        {!hasMicPermission ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
              Click below to unlock Web Audio and grant microphone access.
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
            {/* Audio Engine Status Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #1e293b', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', marginRight: '8px' }}></span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Audio Engine Running</span>
              </div>

              {/* Mode Switcher Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', background: '#090d16', padding: '0.25rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <button
                  onClick={() => setActiveTab('studio')}
                  style={{
                    background: activeTab === 'studio' ? '#0284c7' : 'transparent',
                    color: activeTab === 'studio' ? '#fff' : '#94a3b8',
                    border: 'none',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🎙️ Voice Studio
                </button>
                <button
                  onClick={() => setActiveTab('disguise')}
                  style={{
                    background: activeTab === 'disguise' ? '#0284c7' : 'transparent',
                    color: activeTab === 'disguise' ? '#fff' : '#94a3b8',
                    border: 'none',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🎭 Disguise Carousel
                </button>
                <button
                  onClick={() => setActiveTab('calibration')}
                  style={{
                    background: activeTab === 'calibration' ? '#0284c7' : 'transparent',
                    color: activeTab === 'calibration' ? '#fff' : '#94a3b8',
                    border: 'none',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⚖️ Vocal Calibration
                </button>
              </div>
            </div>

            {/* Input Live Waveform */}
            <DevWaveformVisualizer />

            {/* Active Mode View */}
            {activeTab === 'studio' && <StudioPage />}
            {activeTab === 'disguise' && <DisguisePage />}
            {activeTab === 'calibration' && <CalibrationPage />}
          </div>
        )}
      </main>

      <LegalDisclaimers />
      <ResilienceManager />
    </div>
  );
};
