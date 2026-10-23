import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../state/store';
import { voiceEngine } from '../../audio/VoiceEngine';
import { yinPitch } from '../../audio/dsp/yin';
import { extractPulses } from '../../audio/dsp/pulses';
import { jitterLocal } from '../../audio/dsp/jitter';
import { shimmerLocal } from '../../audio/dsp/shimmer';
import { calculateHNR } from '../../audio/dsp/hnr';
import { computeBaseline, MetricSnapshot, VocalBaseline } from '../../audio/dsp/baseline';

export const CALIBRATION_SCRIPT =
  "When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon.";

export interface CalibrationPageProps {
  onCalibrationComplete?: (baseline: VocalBaseline) => void;
  targetSeconds?: number;
}

export const CalibrationPage: React.FC<CalibrationPageProps> = ({
  onCalibrationComplete,
  targetSeconds = 15,
}) => {
  const { vocalBaseline, setVocalBaseline } = useAppStore();
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [elapsedVoicedSec, setElapsedVoicedSec] = useState<number>(0);
  const [isVoiced, setIsVoiced] = useState<boolean>(false);
  const [snrDb, setSnrDb] = useState<number>(30);
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);

  const animFrameRef = useRef<number | null>(null);
  const snapshotsRef = useRef<MetricSnapshot[]>([]);
  const voicedFramesCountRef = useRef<number>(0);

  const progressPct = Math.min(100, Math.round((elapsedVoicedSec / targetSeconds) * 100));

  useEffect(() => {
    snapshotsRef.current = snapshots;
  }, [snapshots]);

  const startCalibration = () => {
    setIsCalibrating(true);
    setElapsedVoicedSec(0);
    setSnapshots([]);
    snapshotsRef.current = [];
    voicedFramesCountRef.current = 0;
  };

  useEffect(() => {
    if (!isCalibrating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const analyser = voiceEngine.getAnalyser();
    const ctx = voiceEngine.getAudioContext();
    if (!analyser || !ctx) return;

    const buffer = new Float32Array(analyser.fftSize);

    let lastTick = performance.now();

    const loop = () => {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;

      analyser.getFloatTimeDomainData(buffer);

      // 1. RMS Energy Calculation
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) {
        sumSq += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sumSq / buffer.length);
      const estSnr = 20 * Math.log10(Math.max(1e-4, rms)) + 60; // Approximate SNR scale
      setSnrDb(Math.max(0, estSnr));

      // 2. YIN Pitch Tracking
      const pitchResult = yinPitch(buffer, ctx.sampleRate, 0.15);
      const currentlyVoiced = pitchResult.pitch > 0 && pitchResult.confidence > 0.5 && rms > 0.015;
      setIsVoiced(currentlyVoiced);

      if (currentlyVoiced) {
        voicedFramesCountRef.current += 1;
        setElapsedVoicedSec((prev) => {
          const updated = prev + dt;
          if (updated >= targetSeconds) {
            finishCalibration();
          }
          return updated;
        });

        // 3. Glottal Pulses & Perturbation metrics
        const estimatedPeriod = pitchResult.period > 0 ? pitchResult.period : ctx.sampleRate / pitchResult.pitch;
        const pulseResult = extractPulses(buffer, estimatedPeriod);
        const jLocal = jitterLocal(pulseResult.periods);
        const sLocal = shimmerLocal(pulseResult.amplitudes);
        const hnrVal = calculateHNR(pitchResult.confidence);

        const snap: MetricSnapshot = {
          pitch: pitchResult.pitch,
          jitter: jLocal,
          shimmer: sLocal,
          hnr: hnrVal,
        };

        snapshotsRef.current.push(snap);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCalibrating, targetSeconds]);

  const finishCalibration = () => {
    setIsCalibrating(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const calculated = computeBaseline(snapshotsRef.current);
    setVocalBaseline(calculated);
    setSnapshots([...snapshotsRef.current]);

    if (onCalibrationComplete) {
      onCalibrationComplete(calculated);
    }
  };

  return (
    <div
      style={{
        maxWidth: '640px',
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
      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
          Vocal Calibration Protocol
        </h2>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
          15-second guided phonation reading to establish your personal acoustic baseline
        </p>
      </div>

      {/* Script Reading Prompt Card */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '1.25rem',
          lineHeight: 1.6,
          fontSize: '0.95rem',
          color: '#e2e8f0',
          marginBottom: '1.5rem',
          fontStyle: 'italic',
        }}
      >
        "{CALIBRATION_SCRIPT}"
      </div>

      {/* Progress & Voicing Telemetry */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
          <span>CALIBRATION PROGRESS</span>
          <span>
            {elapsedVoicedSec.toFixed(1)}s / {targetSeconds}s ({progressPct}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '14px',
            background: '#020617',
            borderRadius: '6px',
            border: '1px solid #1e293b',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        {/* Live Voicing Detection & SNR Alerts */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isVoiced ? '#22c55e' : '#64748b',
                boxShadow: isVoiced ? '0 0 8px #22c55e' : 'none',
              }}
            />
            <span style={{ color: isVoiced ? '#4ade80' : '#94a3b8' }}>
              {isVoiced ? 'VOICING DETECTED (RECORDING)' : 'PAUSED (SPEAK TO ADVANCE)'}
            </span>
          </div>

          <span style={{ color: snrDb < 15 ? '#f87171' : '#38bdf8' }}>
            SNR: {snrDb.toFixed(1)} dB {snrDb < 15 && '(HIGH NOISE)'}
          </span>
        </div>
      </div>

      {/* Controls & Baseline Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={startCalibration}
          disabled={isCalibrating}
          style={{
            background: isCalibrating ? '#1e293b' : '#0284c7',
            border: 'none',
            color: '#fff',
            padding: '0.65rem 1.4rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: isCalibrating ? 'not-allowed' : 'pointer',
          }}
        >
          {isCalibrating ? 'Calibrating in Progress...' : vocalBaseline ? 'Recalibrate Baseline' : 'Begin 15s Calibration'}
        </button>

        {vocalBaseline && (
          <div style={{ fontSize: '0.75rem', color: '#4ade80', fontFamily: 'monospace' }}>
            ✓ BASELINE: F0={vocalBaseline.meanPitch.toFixed(0)}Hz (±{vocalBaseline.stdPitch.toFixed(1)}) | Jitter={vocalBaseline.meanJitter.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
};
