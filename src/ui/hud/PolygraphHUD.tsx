import React, { useState } from 'react';
import { Gauge } from './Gauge';
import { StripChart } from './StripChart';
import { DeceptionBar } from './DeceptionBar';
import { PitchDial } from './PitchDial';
import { EventBadge } from './EventBadge';
import { StressCompositeResult } from '../../audio/dsp/stress';

export interface PolygraphHUDProps {
  hotSeatPlayerName: string;
  maskPresetName?: string;
  jitter: number;
  pitchHz: number;
  baselinePitchHz: number;
  tremorAmp: number;
  stressResult: StressCompositeResult;
  isFlinch?: boolean;
  snrDb?: number;
  initialMode?: 'hot-seat' | 'spectator';
}

export const PolygraphHUD: React.FC<PolygraphHUDProps> = ({
  hotSeatPlayerName,
  maskPresetName = 'ANONYMOUS MASK',
  jitter,
  pitchHz,
  baselinePitchHz,
  tremorAmp,
  stressResult,
  isFlinch = false,
  snrDb = 28,
  initialMode = 'hot-seat',
}) => {
  const [viewMode, setViewMode] = useState<'hot-seat' | 'spectator'>(initialMode);
  const [fogOfWarUnlocked, setFogOfWarUnlocked] = useState(false);

  const showRawMetrics = viewMode === 'hot-seat' || fogOfWarUnlocked;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        backgroundColor: '#040711',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '1.25rem',
        color: '#f8fafc',
        width: '100%',
        maxWidth: '580px',
        boxSizing: 'border-box',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '0.6rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '0.65rem',
              color: '#38bdf8',
              letterSpacing: '0.1em',
            }}
          >
            AWAAZ // HOT SEAT INTERROGATION CONSOLE
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>{hotSeatPlayerName}</span>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                fontWeight: 400,
                background: '#0f172a',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                border: '1px solid #334155',
              }}
            >
              [{maskPresetName}]
            </span>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode(viewMode === 'hot-seat' ? 'spectator' : 'hot-seat')}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#cbd5e1',
              borderRadius: '6px',
              padding: '0.3rem 0.6rem',
              fontSize: '0.7rem',
              fontFamily: '"Courier New", monospace',
              cursor: 'pointer',
            }}
          >
            MODE: {viewMode.toUpperCase()}
          </button>

          {viewMode === 'spectator' && (
            <button
              onClick={() => setFogOfWarUnlocked(!fogOfWarUnlocked)}
              style={{
                background: fogOfWarUnlocked ? '#0284c7' : '#1e293b',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.7rem',
                fontFamily: '"Courier New", monospace',
                cursor: 'pointer',
              }}
            >
              FOG-OF-WAR: {fogOfWarUnlocked ? 'OFF' : 'ON'}
            </button>
          )}
        </div>
      </div>

      {/* Top Status & Alerts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <EventBadge isFlinch={isFlinch} snrDb={snrDb} />
        <div
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '0.7rem',
            color: '#64748b',
          }}
        >
          TELEMETRY: 60 FPS
        </div>
      </div>

      {/* Primary Deception Composite Gauge */}
      <DeceptionBar
        score={stressResult.compositeScore}
        verdict={stressResult.verdict}
        confidence={stressResult.confidence}
      />

      {/* Raw Forensic Gauges (Subject to Fog-of-War in spectator mode) */}
      {showRawMetrics ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <PitchDial
              currentPitchHz={pitchHz}
              baselinePitchHz={baselinePitchHz}
              width={240}
            />
            <Gauge
              value={jitter}
              min={0}
              max={3.0}
              label="ACOUSTIC JITTER"
              unit="%"
              width={240}
            />
          </div>

          {/* Tremor Oscilloscope Strip-Chart */}
          <StripChart
            currentValue={tremorAmp}
            windowSeconds={10}
            width={540}
            height={90}
          />
        </>
      ) : (
        <div
          style={{
            padding: '1.5rem',
            background: '#090d16',
            border: '1px dashed #334155',
            borderRadius: '10px',
            textAlign: 'center',
            fontFamily: '"Courier New", monospace',
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          🔒 FOG-OF-WAR ACTIVE — RAW FORENSIC GAUGES CONCEALED
        </div>
      )}
    </div>
  );
};
