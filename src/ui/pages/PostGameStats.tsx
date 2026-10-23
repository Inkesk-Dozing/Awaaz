import React from 'react';
import { PostGameAnalytics } from '../../game/voting';

export interface PostGameStatsProps {
  analytics: PostGameAnalytics;
  playerScores: Record<number, number>; // slot -> total points
  playerNames?: Record<number, string>;
  onRematch?: () => void;
  onExit?: () => void;
}

export const PostGameStats: React.FC<PostGameStatsProps> = ({
  analytics,
  playerScores,
  playerNames = {},
  onRematch,
  onExit,
}) => {
  return (
    <div
      style={{
        maxWidth: '680px',
        width: '100%',
        backgroundColor: '#090d16',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '2rem',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxSizing: 'border-box',
        marginTop: '1.5rem',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: '#38bdf8',
            letterSpacing: '0.1em',
          }}
        >
          MISSION DEBRIEF // GAME OVER
        </span>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.4rem 0 0.2rem' }}>
          {analytics.matchWinner === 'CREW' ? '🏆 CREW VICTORY' : '🔥 SABOTEUR VICTORY'}
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
          {analytics.matchWinner === 'CREW'
            ? 'The crew saw through the vocal stress and unmasked the infiltrator.'
            : 'The Saboteur kept their vocal composure and successfully deceived the room.'}
        </p>
      </div>

      {/* Primary Analytics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Detector Accuracy */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            DETECTOR ACCURACY
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: analytics.detectorAccuracyPct >= 70 ? '#4ade80' : '#facc15',
              fontFamily: 'monospace',
            }}
          >
            {analytics.detectorAccuracyPct}%
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
            Match verdict alignment
          </div>
        </div>

        {/* Fooled Detector Count */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            FOOLED THE MACHINE
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#38bdf8',
              fontFamily: 'monospace',
            }}
          >
            {analytics.fooledDetectorCount}x
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
            Saboteur bluffs rated TRUTH
          </div>
        </div>

        {/* Crew Consensus Accuracy */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            CREW INTUITION
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: analytics.crewAccuracyPct >= 60 ? '#4ade80' : '#f87171',
              fontFamily: 'monospace',
            }}
          >
            {analytics.crewAccuracyPct}%
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
            Correct ballots cast
          </div>
        </div>
      </div>

      {/* Player Composure & Leaderboard */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#cbd5e1',
            marginBottom: '0.75rem',
          }}
        >
          PLAYER COMPOSURE & FINAL SCORES
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Object.entries(playerScores).map(([slotStr, score]) => {
            const slot = Number(slotStr);
            const name = playerNames[slot] || `Player ${slot + 1}`;
            const composure = analytics.composureScores[slot] ?? 85;

            return (
              <div
                key={slot}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>{name}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                    Composure Index: <span style={{ color: '#38bdf8' }}>{composure} / 100</span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: '#f8fafc',
                  }}
                >
                  {score} PTS
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          borderTop: '1px solid #1e293b',
          paddingTop: '1.25rem',
        }}
      >
        {onExit && (
          <button
            onClick={onExit}
            style={{
              background: '#1e293b',
              border: 'none',
              color: '#94a3b8',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Exit to Menu
          </button>
        )}

        {onRematch && (
          <button
            onClick={onRematch}
            style={{
              background: '#0284c7',
              border: 'none',
              color: '#fff',
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
            }}
          >
            🔄 Play Rematch
          </button>
        )}
      </div>
    </div>
  );
};
