import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../state/store';
import { voiceEngine } from '../../audio/VoiceEngine';
import { audioRecorder } from '../../audio/recorder';
import { MASK_PRESETS, MaskPreset } from '../../audio/morph/masks';
import {
  OUTPUT_PROFILES,
  OutputProfileId,
} from '../../audio/mastering/targets';
import { setupStudioHotkeys, DEFAULT_HOTKEYS } from '../studio/hotkeys';

export const StudioPage: React.FC = () => {
  const { outputProfile } = useAppStore();
  const [activePresetId, setActivePresetId] = useState<string>('natural');
  const [manualPitch, setManualPitch] = useState<number>(0);
  const [vtlScale, setVtlScale] = useState<number>(1.0); // 0.8x to 1.25x
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [showHeadphoneWarning, setShowHeadphoneWarning] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [masterProfile, setMasterProfile] = useState<OutputProfileId>(voiceEngine.getOutputProfileId());

  // Setup hotkey listener
  useEffect(() => {
    const cleanup = setupStudioHotkeys((presetId) => {
      handleSelectPreset(presetId);
    });
    return cleanup;
  }, []);

  const handleSelectPreset = (presetId: string) => {
    setActivePresetId(presetId);
    const preset = MASK_PRESETS[presetId];
    if (preset) {
      setManualPitch(preset.pitchShift);
      setVtlScale(1.0);
      voiceEngine.setMask(presetId);
    }
  };

  const handlePitchChange = (pitch: number) => {
    setManualPitch(pitch);
    const basePreset = MASK_PRESETS[activePresetId] || MASK_PRESETS.natural;
    const modified: MaskPreset = {
      ...basePreset,
      pitchShift: pitch,
    };
    voiceEngine.setCustomMask(modified);
  };

  const handleVtlChange = (scale: number) => {
    setVtlScale(scale);
    const basePreset = MASK_PRESETS[activePresetId] || MASK_PRESETS.natural;
    const modified: MaskPreset = {
      ...basePreset,
      pitchShift: manualPitch,
      f1: { ...basePreset.f1, freq: basePreset.f1.freq * scale },
      f2: { ...basePreset.f2, freq: basePreset.f2.freq * scale },
      f3: { ...basePreset.f3, freq: basePreset.f3.freq * scale },
    };
    voiceEngine.setCustomMask(modified);
  };

  const handleMasterProfileChange = (id: OutputProfileId) => {
    setMasterProfile(id);
    voiceEngine.setOutputProfile(id);
    // Re-apply saved calibration gains on top of the new compressor character.
    if (outputProfile) {
      voiceEngine.applyOutputCalibration(outputProfile);
    }
  };

  const handleToggleMonitoring = () => {
    if (!isMonitoring) {
      setShowHeadphoneWarning(true);
    } else {
      voiceEngine.setLocalMonitoring(false);
      setIsMonitoring(false);
    }
  };

  const confirmMonitoring = () => {
    setShowHeadphoneWarning(false);
    voiceEngine.setLocalMonitoring(true, 0.8);
    setIsMonitoring(true);
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      try {
        const { url } = await audioRecorder.stopRecording();
        setRecordedAudioUrl(url);
      } catch (err) {
        console.error('Failed to stop recording:', err);
      } finally {
        setIsRecording(false);
      }
    } else {
      const morphedStream = voiceEngine.getMorphedStream();
      if (!morphedStream) {
        alert('Please enable microphone in main studio before recording.');
        return;
      }
      audioRecorder.startRecording(morphedStream);
      setIsRecording(true);
      setRecordedAudioUrl(null);
    }
  };

  const handleSharePreset = () => {
    const params = new URLSearchParams({
      preset: activePresetId,
      pitch: manualPitch.toString(),
      vtl: vtlScale.toString(),
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    });
  };


  return (
    <div
      style={{
        maxWidth: '720px',
        width: '100%',
        backgroundColor: '#090d16',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '1.75rem',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxSizing: 'border-box',
        marginTop: '1.5rem',
      }}
    >
      {/* Studio Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
            Voice Changer Studio
          </h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Real-time pitch shifting, formant VTL scaling, hotkey triggers & export
          </p>
        </div>

        <button
          onClick={handleSharePreset}
          style={{
            background: shareSuccess ? '#16a34a' : '#1e293b',
            border: '1px solid #334155',
            color: '#fff',
            borderRadius: '8px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {shareSuccess ? '✓ Copied URL!' : '🔗 Share Preset'}
        </button>
      </div>

      {/* Preset Category Audition Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem' }}>
          PRESET AUDITION TILES (HOTKEYS 1–9)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.65rem',
          }}
        >
          {Object.values(MASK_PRESETS).map((preset) => {
            const hotkey = DEFAULT_HOTKEYS.find((h) => h.presetId === preset.id);
            const isSelected = activePresetId === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? '#0284c7' : '#0f172a',
                  border: `1px solid ${isSelected ? '#38bdf8' : '#1e293b'}`,
                  color: isSelected ? '#ffffff' : '#e2e8f0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.7rem', color: isSelected ? '#bae6fd' : '#64748b' }}>
                    {preset.category.toUpperCase()}
                  </span>
                  {hotkey && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        background: isSelected ? '#0369a1' : '#1e293b',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                      }}
                    >
                      [{hotkey.key}]
                    </span>
                  )}
                </div>
                <strong style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {preset.name}
                </strong>
                <span style={{ fontSize: '0.7rem', color: isSelected ? '#e0f2fe' : '#94a3b8', marginTop: '0.2rem' }}>
                  {preset.pitchShift > 0 ? `+${preset.pitchShift} ST` : `${preset.pitchShift} ST`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Overrides: Pitch & VTL Scaling */}
      <div
        style={{
          background: '#0f172a',
          borderRadius: '10px',
          border: '1px solid #1e293b',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.85rem' }}>
          MANUAL DSP OVERRIDES
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>Pitch Shift (Semitones)</span>
              <strong style={{ color: '#38bdf8' }}>{manualPitch > 0 ? `+${manualPitch.toFixed(1)}` : manualPitch.toFixed(1)} ST</strong>
            </div>
            <input
              type="range"
              min="-6"
              max="6"
              step="0.1"
              value={manualPitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '0.4rem', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>Formant VTL Scale</span>
              <strong style={{ color: '#38bdf8' }}>{vtlScale.toFixed(2)}x</strong>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.25"
              step="0.01"
              value={vtlScale}
              onChange={(e) => handleVtlChange(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '0.4rem', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Mastering / output profile (broadcast-style) */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>
              OUTPUT MASTERING PROFILE
            </div>
            {outputProfile && (
              <div style={{ fontSize: '0.68rem', color: '#4ade80', fontFamily: 'monospace' }}>
                cal: pre {outputProfile.preGainDb >= 0 ? '+' : ''}{outputProfile.preGainDb} dB · makeup{' '}
                {outputProfile.makeupGainDb >= 0 ? '+' : ''}{outputProfile.makeupGainDb} dB
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(Object.keys(OUTPUT_PROFILES) as OutputProfileId[]).map((id) => {
              const p = OUTPUT_PROFILES[id];
              const selected = masterProfile === id;
              return (
                <button
                  key={id}
                  onClick={() => handleMasterProfileChange(id)}
                  style={{
                    background: selected ? '#0284c7' : '#0f172a',
                    border: `1px solid ${selected ? '#38bdf8' : '#1e293b'}`,
                    color: selected ? '#fff' : '#e2e8f0',
                    borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title={`${p.targetOutputRmsDb} dBFS RMS · peak ≤ ${p.peakCeilingDb} dBFS · ratio ${p.compressorRatio}:1`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>
            Compressor + soft-clip limiter on the morph path. Run{' '}
            <strong style={{ color: '#94a3b8' }}>Calibrate Output Level</strong> on the Calibration
            page for mic-specific gain staging.
          </p>
        </div>
      </div>

      {/* Monitoring & Recording Toolbar */}
      {/* Dedicated Audio Output Monitoring & Recording Console */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #080e1e 100%)',
          borderRadius: '12px',
          border: `1px solid ${isMonitoring ? '#059669' : '#1e293b'}`,
          padding: '1.25rem',
          boxShadow: isMonitoring ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isMonitoring ? '#10b981' : '#64748b',
                  boxShadow: isMonitoring ? '0 0 10px #10b981' : 'none',
                }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                AUDIO OUTPUT STATUS: {isMonitoring ? 'LIVE MONITORING ACTIVE' : 'MUTED (STANDBY)'}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              {isMonitoring
                ? 'Your morphed voice is streaming directly to your headphones in real time.'
                : 'Turn on monitoring below to hear your pitch and formants.'}
            </p>
          </div>

          {/* Large Primary Toggle */}
          <button
            onClick={handleToggleMonitoring}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.4rem',
              borderRadius: '10px',
              backgroundColor: isMonitoring ? '#dc2626' : '#10b981',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isMonitoring ? '0 4px 14px rgba(220, 38, 38, 0.4)' : '0 4px 14px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{isMonitoring ? '🔇 Mute Audio Monitor' : '🎧 Listen to Morphed Output'}</span>
          </button>
        </div>

        {/* Volume & Recording Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#040711',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            border: '1px solid #1e293b',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Active Preset Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <span>Active Mask:</span>
            <span
              style={{
                background: '#0284c7',
                color: '#fff',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              {MASK_PRESETS[activePresetId]?.name || 'Natural'}
            </span>
            <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
              ({manualPitch > 0 ? `+${manualPitch.toFixed(1)}` : manualPitch.toFixed(1)} ST)
            </span>
            <span
              style={{
                background: '#1e293b',
                color: '#94a3b8',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                marginLeft: '0.5rem',
              }}
            >
              DSP: C++ WASM
            </span>
          </div>

          {/* Master Output Makeup & Broadcast Limiter Trim */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>Master Level:</span>
            <input
              type="range"
              min="-6"
              max="12"
              step="0.5"
              defaultValue="3.5"
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                voiceEngine.setMasterMakeupGain(val);
              }}
              style={{ width: '80px', accentColor: '#38bdf8' }}
              title="Master Broadcast Makeup Gain (dB)"
            />
            <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.7rem' }}>
              -1 dBFS Clamped
            </span>
          </div>

          {/* Recording Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleToggleRecord}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                backgroundColor: isRecording ? '#dc2626' : '#1e293b',
                border: `1px solid ${isRecording ? '#ef4444' : '#334155'}`,
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: isRecording ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none',
              }}
            >
              <span>{isRecording ? '⏹' : '⏺'}</span>
              <span>{isRecording ? 'Stop Recording' : 'Record Snippet'}</span>
            </button>

            {recordedAudioUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <audio controls src={recordedAudioUrl} style={{ height: '30px', width: '180px' }} />
                <a
                  href={recordedAudioUrl}
                  download={`awaaz-morphed-${activePresetId}-${Date.now()}.webm`}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  ⬇ Save
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Headphone Confirmation Dialog */}
      {showHeadphoneWarning && (
        <div
          role="alertdialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              backgroundColor: '#0f172a',
              border: '1px solid #eab308',
              borderRadius: '12px',
              padding: '1.5rem',
              color: '#f8fafc',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎧⚠</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#facc15' }}>Headphones Strongly Recommended</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 1rem' }}>
              Enabling local audio monitor loopback through laptop or external speakers can cause
              severe acoustic feedback howl. Please ensure headphones are connected before proceeding.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setShowHeadphoneWarning(false)}
                style={{
                  background: '#1e293b',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmMonitoring}
                style={{
                  background: '#ca8a04',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                I Am Wearing Headphones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
