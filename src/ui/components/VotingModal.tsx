import React, { useState, useEffect } from 'react';
import { BallotChoice } from '../../game/voting';

export interface VotingModalProps {
  hotSeatPlayerName: string;
  hotSeatMaskName: string;
  isHotSeatPlayer: boolean;
  onCastVote: (choice: BallotChoice) => void;
  countdownSeconds?: number;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  hotSeatPlayerName,
  hotSeatMaskName,
  isHotSeatPlayer,
  onCastVote,
  countdownSeconds = 15,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<BallotChoice | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(countdownSeconds);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      if (!hasSubmitted && !isHotSeatPlayer) {
        // Default vote on timeout: Acquit
        handleSelectChoice('ACQUIT');
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, hasSubmitted, isHotSeatPlayer]);

  const handleSelectChoice = (choice: BallotChoice) => {
    setSelectedChoice(choice);
    setHasSubmitted(true);
    onCastVote(choice);
  };

  return (
    <div
      role="dialog"
      style={{
        maxWidth: '560px',
        width: '100%',
        backgroundColor: '#090d16',
        border: '2px solid #38bdf8',
        borderRadius: '16px',
        padding: '1.75rem',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxSizing: 'border-box',
        boxShadow: '0 0 30px rgba(56, 189, 248, 0.25)',
        marginTop: '1.5rem',
      }}
    >
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
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              color: '#38bdf8',
              letterSpacing: '0.05em',
            }}
          >
            ANONYMOUS ROOM BALLOT // 15-SECOND WINDOW
          </div>
          <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 800 }}>
            Vote on Hot-Seat Suspect
          </h2>
        </div>

        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: secondsRemaining <= 5 ? '#ef4444' : '#38bdf8',
            background: '#0f172a',
            border: `1px solid ${secondsRemaining <= 5 ? '#ef4444' : '#334155'}`,
            padding: '0.3rem 0.75rem',
            borderRadius: '6px',
          }}
        >
          ⏱ {secondsRemaining}s
        </div>
      </div>

      <div
        style={{
          background: '#0f172a',
          borderRadius: '10px',
          border: '1px solid #1e293b',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Accused Player:</span>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem' }}>
          {hotSeatPlayerName}{' '}
          <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 400 }}>
            [{hotSeatMaskName}]
          </span>
        </div>
      </div>

      {isHotSeatPlayer ? (
        <div
          style={{
            padding: '1.5rem',
            background: '#020617',
            borderRadius: '10px',
            border: '1px dashed #334155',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '0.9rem',
          }}
        >
          🔒 You are in the Hot Seat! Non-suspect interrogators are now casting their secret ballots.
        </div>
      ) : (
        <div>
          <p
            style={{
              fontSize: '0.85rem',
              color: '#cbd5e1',
              marginBottom: '1rem',
              textAlign: 'center',
            }}
          >
            Did {hotSeatPlayerName}'s voice stress betray them, or are they telling the truth?
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Acquit Choice */}
            <button
              onClick={() => handleSelectChoice('ACQUIT')}
              disabled={hasSubmitted}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1.2rem 1rem',
                borderRadius: '12px',
                backgroundColor:
                  selectedChoice === 'ACQUIT'
                    ? '#166534'
                    : '#0f172a',
                border: `2px solid ${
                  selectedChoice === 'ACQUIT' ? '#22c55e' : '#334155'
                }`,
                color: '#fff',
                cursor: hasSubmitted ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🛡️</span>
              <strong style={{ fontSize: '1rem', color: '#4ade80' }}>ACQUIT (TRUST)</strong>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Vote that suspect is Crew
              </span>
            </button>

            {/* Eject Choice */}
            <button
              onClick={() => handleSelectChoice('EJECT')}
              disabled={hasSubmitted}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1.2rem 1rem',
                borderRadius: '12px',
                backgroundColor:
                  selectedChoice === 'EJECT'
                    ? '#991b1b'
                    : '#0f172a',
                border: `2px solid ${
                  selectedChoice === 'EJECT' ? '#ef4444' : '#334155'
                }`,
                color: '#fff',
                cursor: hasSubmitted ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🚨</span>
              <strong style={{ fontSize: '1rem', color: '#f87171' }}>EJECT (ACCUSE)</strong>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Vote that suspect is Saboteur
              </span>
            </button>
          </div>

          {hasSubmitted && (
            <div
              style={{
                marginTop: '1.25rem',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: '#22d3ee',
                fontFamily: 'monospace',
              }}
            >
              ✓ BALLOT SEALED ANONYMOUSLY. Awaiting room reveal...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
