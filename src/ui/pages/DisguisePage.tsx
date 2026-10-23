import React, { useState, useEffect } from 'react';
import { voiceEngine } from '../../audio/VoiceEngine';
import { MASK_PRESETS, MaskPreset } from '../../audio/morph/masks';
import { PlayerRosterEntry } from '../../game/roster';

export interface DisguisePageProps {
  roster?: PlayerRosterEntry[];
  onLockIn?: (maskId: string) => void;
}

export const DisguisePage: React.FC<DisguisePageProps> = ({
  roster = [],
  onLockIn,
}) => {
  const presetList = Object.values(MASK_PRESETS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(true);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(45);

  const activePreset: MaskPreset = presetList[currentIndex] || presetList[0];

  // Apply active preset immediately as user browses carousel
  useEffect(() => {
    voiceEngine.setMask(activePreset.id);
    if (isAuditioning) {
      voiceEngine.setLocalMonitoring(true, 0.7);
    }
    return () => {
      voiceEngine.setLocalMonitoring(false);
    };
  }, [activePreset.id, isAuditioning]);

  // 45s countdown timer for mask lock-in
  useEffect(() => {
    if (timeoutSeconds <= 0) {
      if (!isLocked) {
        handleConfirmLock();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeoutSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeoutSeconds, isLocked]);

  const handleNext = () => {
    if (isLocked) return;
    setCurrentIndex((prev) => (prev + 1) % presetList.length);
  };

  const handlePrev = () => {
    if (isLocked) return;
    setCurrentIndex((prev) => (prev - 1 + presetList.length) % presetList.length);
  };

  const handleConfirmLock = () => {
    setIsLocked(true);
    voiceEngine.setLocalMonitoring(false);
    if (onLockIn) {
      onLockIn(activePreset.id);
    }
  };

  // Avatar mask graphic icon helper
  const getMaskIcon = (id: string) => {
    switch (id) {
      case 'female_morph':
        return '👩‍🎤';
      case 'male_morph':
        return '🕵️‍♂️';
      case 'robot_cyborg':
        return '🤖';
      case 'radio_operator':
        return '📻';
      case 'posh_royal':
        return '👑';
      case 'wise_narrator':
        return '🧙‍♂️';
      case 'chipmunk':
        return '🐿️';
      case 'demon':
        return '👹';
      default:
        return '🎭';
    }
  };

  return (
    <div
      style={{
        maxWidth: '680px',
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
      {/* Header with Countdown */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
            Choose Your Voice Disguise
          </h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Audition and lock in your voice mask before entering the interrogation arena
          </p>
        </div>

        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            fontWeight: 700,
            color: timeoutSeconds <= 10 ? '#ef4444' : '#38bdf8',
            background: '#0f172a',
            border: `1px solid ${timeoutSeconds <= 10 ? '#ef4444' : '#334155'}`,
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
          }}
        >
          ⏱ {timeoutSeconds}s
        </div>
      </div>

      {/* Mask Card Carousel */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          onClick={handlePrev}
          disabled={isLocked}
          style={{
            background: '#1e293b',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked ? 0.5 : 1,
          }}
        >
          ‹
        </button>

        {/* Center Active Mask Display Card */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#0f172a',
            border: `2px solid ${isLocked ? '#22c55e' : '#38bdf8'}`,
            borderRadius: '14px',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            boxShadow: isLocked
              ? '0 0 25px rgba(34, 197, 94, 0.3)'
              : '0 0 25px rgba(56, 189, 248, 0.2)',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ fontSize: '4.5rem', marginBottom: '0.5rem' }}>
            {getMaskIcon(activePreset.id)}
          </div>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.35rem', color: '#f8fafc' }}>
            {activePreset.name}
          </h3>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#38bdf8',
              backgroundColor: '#082f49',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              border: '1px solid #0284c7',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {activePreset.category} • {activePreset.pitchShift > 0 ? `+${activePreset.pitchShift}` : activePreset.pitchShift} ST
          </span>

          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.85rem', marginBottom: 0 }}>
            {isAuditioning
              ? '🎧 Live headphone audition enabled. Speak into your mic to hear this mask!'
              : 'Audition sidetone muted.'}
          </p>
        </div>

        <button
          onClick={handleNext}
          disabled={isLocked}
          style={{
            background: '#1e293b',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked ? 0.5 : 1,
          }}
        >
          ›
        </button>
      </div>

      {/* Carousel Thumbnails */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {presetList.map((preset, idx) => (
          <button
            key={preset.id}
            onClick={() => !isLocked && setCurrentIndex(idx)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              backgroundColor: idx === currentIndex ? '#0284c7' : '#1e293b',
              border: `1px solid ${idx === currentIndex ? '#38bdf8' : '#334155'}`,
              color: '#fff',
              fontSize: '0.75rem',
              cursor: isLocked ? 'not-allowed' : 'pointer',
            }}
          >
            {getMaskIcon(preset.id)} {preset.name}
          </button>
        ))}
      </div>

      {/* Lock-In Action & Audition Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #1e293b',
          paddingTop: '1.25rem',
        }}
      >
        <button
          onClick={() => setIsAuditioning(!isAuditioning)}
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            color: '#cbd5e1',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          {isAuditioning ? '🔊 Mute Audition Loop' : '🎧 Enable Audition Loop'}
        </button>

        <button
          onClick={handleConfirmLock}
          disabled={isLocked}
          style={{
            background: isLocked ? '#166534' : '#0284c7',
            border: 'none',
            color: '#fff',
            padding: '0.65rem 1.6rem',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: isLocked ? 'default' : 'pointer',
            boxShadow: isLocked ? 'none' : '0 4px 15px rgba(2, 132, 199, 0.4)',
          }}
        >
          {isLocked ? '✓ Disguise Confirmed' : 'Lock In Disguise'}
        </button>
      </div>

      {/* Roster Lock-in Status Tracker */}
      {roster.length > 0 && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #334155', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
            ROOM PARTICIPANTS ({roster.filter((p) => p.isLocked).length}/{roster.length} LOCKED IN)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {roster.map((player) => (
              <span
                key={player.slot}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: player.isLocked ? '#064e3b' : '#1e293b',
                  color: player.isLocked ? '#34d399' : '#94a3b8',
                  border: `1px solid ${player.isLocked ? '#059669' : '#334155'}`,
                }}
              >
                {player.name} {player.isLocked ? '✓' : '...'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
