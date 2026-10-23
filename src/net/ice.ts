/**
 * STUN / TURN ICE Configuration for WebRTC.
 * Defaults to Google/Twilio STUN + Metered Open Relay with ports 80/443 and turns:443.
 */

export interface ICEConfigurationProvider {
  getIceServers: () => RTCIceServer[];
}

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:global.stun.twilio.com:3478'
    ]
  },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turns:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelay',
    credential: 'openrelay'
  }
];

export function getIceConfig(): RTCConfiguration {
  return {
    iceServers: DEFAULT_ICE_SERVERS,
    iceCandidatePoolSize: 2
  };
}
