// Minimal WebRTC helper for in-app, data-only voice calls (dispatcher -> citizen).
//
// This intentionally does NOT use the phone's cellular voice network at all —
// audio travels as a WebRTC media stream over whatever internet connection
// the device has (WiFi or mobile data), the same way a Messenger/Viber call
// works. It does not touch tel: or the native dialer.
//
// STUN servers just help two devices discover how to reach each other across
// NAT/routers; they don't carry any audio themselves. Google's public STUN
// servers are fine for development and same-network demos, but STUN alone
// can't always punch through once both phones are on separate real-world
// networks (e.g. one on campus WiFi, one on mobile data behind carrier-grade
// NAT) — that's what a TURN server (a relay) is for.
//
// Below, the Open Relay Project's free, no-signup TURN server
// (https://www.metered.ca/tools/openrelay/) is wired in via its published
// static demo credentials, so calls can be tested across separate networks
// right away. It's a shared public server with a bandwidth cap and no uptime
// guarantee — great for testing, but swap in your own TURN credentials
// (a free Metered account, Twilio, etc.) before relying on this for real
// deployments.
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:openrelay.metered.ca:80" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export function createPeerConnection({ onIceCandidate, onTrack, onConnectionStateChange }) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = (event) => {
    if (event.candidate) onIceCandidate?.(event.candidate);
  };
  pc.ontrack = (event) => {
    onTrack?.(event.streams[0]);
  };
  pc.onconnectionstatechange = () => {
    onConnectionStateChange?.(pc.connectionState);
  };

  return pc;
}

export async function getMicStream() {
  return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
}
