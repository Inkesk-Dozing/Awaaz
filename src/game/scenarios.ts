/**
 * Production Scenario Decks for Awaaz Flagship Mode.
 * Vault Breach, The Leak, and Stolen Prototype.
 */

export interface ScenarioQuestion {
  id: string;
  text: string;
  timeLimitSec: number;
}

export interface ScenarioDeck {
  id: string;
  title: string;
  tagline: string;
  lore: string;
  truthFacts: string[];
  questions: ScenarioQuestion[];
}

export const SCENARIO_DECKS: Record<string, ScenarioDeck> = {
  vault_breach: {
    id: 'vault_breach',
    title: 'Vault Breach',
    tagline: 'High-security subterranean archive accessed at 03:00 AM.',
    lore: 'The vault opened at 03:00 AM using an executive keycard. Confidential encrypted drives were wiped clean.',
    truthFacts: [
      'The electronic log recorded Keycard #4 entering at 03:01.',
      'A hooded silhouette disabled Camera 3 using high-frequency EMP.',
      'The primary server was accessed from Terminal B.'
    ],
    questions: [
      { id: 'vb_q1', text: 'Where were you between 02:30 and 03:30 AM?', timeLimitSec: 25 },
      { id: 'vb_q2', text: 'Did you have physical possession of Keycard #4 tonight?', timeLimitSec: 20 },
      { id: 'vb_q3', text: 'Why did your security badge ping the basement corridor at 02:58?', timeLimitSec: 30 },
      { id: 'vb_q4', text: 'Did you touch Terminal B or enter the server bay?', timeLimitSec: 25 },
      { id: 'vb_q5', text: 'Look at the needles: are you the saboteur who breached the vault?', timeLimitSec: 20 }
    ]
  },
  the_leak: {
    id: 'the_leak',
    title: 'The Leak',
    tagline: 'Classified blueprints surfaced on public pastebins.',
    lore: 'At 17:45 yesterday, unreleased quantum audio algorithms were dumped onto public darknet nodes.',
    truthFacts: [
      'The leak was initiated from an IP routed through the corporate guest Wi-Fi.',
      'The files were compressed into an encrypted zip named payload.bin.',
      'The breach occurred exactly 10 minutes before the security audit.'
    ],
    questions: [
      { id: 'tl_q1', text: 'Were you connected to the guest Wi-Fi network yesterday evening?', timeLimitSec: 25 },
      { id: 'tl_q2', text: 'Did you download any files from the repository before the audit?', timeLimitSec: 25 },
      { id: 'tl_q3', text: 'Have you ever accessed or shared payload.bin?', timeLimitSec: 20 },
      { id: 'tl_q4', text: 'Who did you talk to right before the alert sounded?', timeLimitSec: 30 },
      { id: 'tl_q5', text: 'Did you leak the blueprints to the public web?', timeLimitSec: 20 }
    ]
  },
  stolen_prototype: {
    id: 'stolen_prototype',
    title: 'Stolen Prototype',
    tagline: 'Physical neural synthesizer prototype vanished from Lab 4.',
    lore: 'The experimental audio synthesizer vanished during lunch hour. Only lab members had clearance.',
    truthFacts: [
      'The prototype was in its charging cradle until 12:15 PM.',
      'The service elevator was used without an authorized technician ticket.',
      'A blue gym bag was spotted being carried out the rear exit.'
    ],
    questions: [
      { id: 'sp_q1', text: 'What were you doing during the 12:00 to 13:00 lunch hour?', timeLimitSec: 25 },
      { id: 'sp_q2', text: 'Did you take the service elevator down to the loading bay?', timeLimitSec: 25 },
      { id: 'sp_q3', text: 'Whose gym bag was placed in your locker this afternoon?', timeLimitSec: 25 },
      { id: 'sp_q4', text: 'Were you inside Lab 4 when the cradle was unlocked?', timeLimitSec: 25 },
      { id: 'sp_q5', text: 'Do you know where the prototype is right now?', timeLimitSec: 20 }
    ]
  }
};
