# KunekTayo — Technical Specifications

This document defines the technical data contracts, signaling schemas, and runtime specifications for KunekTayo.

---

## 1. Room Protocol Specifications

### Room Constraints
* **Capacity Limit**: Exactly 2 participants (`host`, `guest`).
* **Solo Room TTL**: `1,800,000 ms` (30 minutes) from room initialization or when participant count drops to 1.
* **Token Entropy**: Minimum 128-bit cryptographically secure random value (`crypto.getRandomValues`).
* **Room Identifier Format**: Hexadecimal lowercase string (e.g. `a1b2c3d4e5f60718`).

### Room State Representation
```typescript
interface DurableRoomState {
  roomId: string;
  inviteTokenHash: string;
  status: "waiting" | "active" | "expired" | "closed";
  participants: Array<{
    id: string;
    role: "host" | "guest";
    joinedAt: number;
    lastPingAt: number;
  }>;
  soloExpiresAt: number | null;
  createdAt: number;
}
```

---

## 2. Signaling Protocol (WebSocket)

WebSocket connections are established to `wss://<signaling-host>/rooms/:roomId/ws?token=:inviteToken`.

### Client-to-Server Messages
```typescript
type ClientSignalingMessage =
  | { type: "join"; participantId: string; role: "host" | "guest" }
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "candidate"; candidate: RTCIceCandidateInit }
  | { type: "leave" }
  | { type: "ping" };
```

### Server-to-Client Messages
```typescript
type ServerSignalingMessage =
  | { type: "room_state"; state: "waiting" | "active"; participantCount: number; soloExpiresAt: number | null }
  | { type: "peer_joined"; participantId: string }
  | { type: "peer_left"; participantId: string; soloExpiresAt: number }
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "candidate"; candidate: RTCIceCandidateInit }
  | { type: "error"; code: "ROOM_FULL" | "ROOM_EXPIRED" | "INVALID_TOKEN"; message: string };
```

---

## 3. Ephemeral Chat DataChannel Specification

* **Channel Label**: `"ephemeral-chat"`
* **Ordered**: `true`
* **Max Packet Lifetime**: `3000 ms` (prefer fast drop over lingering retry)

### Message Packet Schema
```typescript
interface DataChannelMessage {
  id: string;             // UUIDv4
  senderId: string;       // Participant ID
  text: string;           // UTF-8 encoded text (max 2000 chars)
  timestamp: number;      // Unix epoch (milliseconds)
  ttlSeconds: number;     // Configured TTL (e.g. 60s)
}
```

### Client Expiration Invariants
* Each message maintains an individual client timer: `expirationTime = timestamp + (ttlSeconds * 1000)`.
* When the timer fires, the message is unmounted from React state and garbage-collected.
* The message is never saved to `localStorage`, `IndexedDB`, or any server disk.

---

## 4. Deep Linking Specification

### Windows Protocol Scheme
* URI Scheme: `kunektayo://join?room=<ROOM_ID>&token=<TOKEN>`
* Registered via Tauri `tauri-plugin-deep-link` or Windows Registry command association.

### Android App Links
* Scheme: `https://kunektayo.app/join/:roomId#token`
* Intent filter for `android.intent.action.VIEW` handling `https://kunektayo.app`.
