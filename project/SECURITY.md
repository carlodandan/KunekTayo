# KunekTayo — Security, Privacy & Reliability Specification

## 1. Overview & Threat Model

KunekTayo is designed under a **Zero-Knowledge, Ephemeral, 1-on-1 Communication Architecture**.
Its primary product principle is:
> **Create a room. Send the link. Connect with one person. Talk privately. Leave with zero trace.**

The threat model assumes:
- Untrusted networks (public Wi-Fi, cellular, intermediate NATs).
- Passive network eavesdroppers.
- Unauthorized third parties attempting to guess room IDs or access private conversations.
- Denial of Service / Signaling flooding attacks.

---

## 2. Cryptographic Primitives & Room Authorization

### 2.1 Entropy & Token Generation
- **Room ID**: Generated using standard Web Crypto API `crypto.getRandomValues()`. 64-bit entropy (16 hex chars) ensures unique room identifiers.
- **Invite Token**: Generated using 128-bit cryptographically secure pseudorandom numbers (32 hex characters).
- **Participant ID**: Ephemeral 96-bit identifiers (`p_<hex>`) generated locally per session.

### 2.2 SHA-256 Hash Transmission
- The plaintext invite token **never touches the server directly**.
- The client hashes the token using `crypto.subtle.digest("SHA-256", token)`.
- Only the 64-character SHA-256 hex digest is transmitted during room creation, status checks, and WebSocket upgrades.
- Even if server logs or traffic were inspected, the original plaintext token cannot be derived.

### 2.3 Constant-Time Comparison
- In both the Cloudflare Durable Object and client validation routines, hash comparisons are performed using `timingSafeEqual`:
  ```ts
  function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
      mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
  }
  ```
- This completely neutralizes side-channel timing attacks that attempt to deduce valid hashes character by character.

---

## 3. Strict 2-Participant Boundary Enforcement

1. **Hard Participant Cap**:
   - The Cloudflare Durable Object is the single authoritative source of truth.
   - A maximum of **2 participants** (1 Host, 1 Guest) is strictly enforced.
   - Any third participant attempting to join receives HTTP 409 / WebSocket rejection (`ROOM_FULL`).
2. **Rejoin Authorization**:
   - Disconnected participants can only rejoin if their `participantId` matches the original Host or Guest record and the `inviteTokenHash` matches.
3. **Solo Inactivity Auto-Destruction**:
   - When a room is created with 1 participant, a strict 30-minute Cloudflare DO alarm is scheduled.
   - If a peer does not join within 30 minutes, the alarm triggers: all storage is purged (`storage.deleteAll()`), active WebSockets are disconnected with code `4008 (Room Expired)`, and the room ceases to exist.

---

## 4. Media & Data Transport Security

### 4.1 End-to-End Encryption (DTLS-SRTP)
- All WebRTC audio, video, and screen sharing streams are encrypted end-to-end using DTLS (Datagram Transport Layer Security) and SRTP (Secure Real-Time Transport Protocol).
- Direct peer-to-peer connection: media packets travel directly between devices without transiting any media server.
- WebRTC DataChannels (used for Ephemeral Chat and P2P File Sharing) run over SCTP encapsulated in DTLS.

### 4.2 Zero Server Storage Guarantee
- **No Chat Logs**: Chat messages travel exclusively through the direct P2P `RTCDataChannel`. They are never sent to or stored on any server database.
- **No File Persistence**: File transfers are chunked (32 KB chunks) and transferred directly P2P. Files are held exclusively in RAM (`Blob` object URLs) and are completely destroyed when the session terminates.
- **No Media Recording**: Audio/video streams are rendered in memory to `<video>` elements with no disk buffer.

---

## 5. Server Rate Limiting & Abuse Protection

Implemented in `server/src/index.ts` and `server/src/RoomDurableObject.ts`:
1. **IP Sliding Window Rate Limiting**:
   - Room Creation: Max 15 requests per minute per IP. Returns HTTP 429 `RATE_LIMITED` with `Retry-After: 60`.
   - Room Joining: Max 30 requests per minute per IP.
2. **Payload Size Limits**:
   - HTTP requests exceeding 64 KB are rejected with HTTP 413 `PAYLOAD_TOO_LARGE`.
3. **Signaling Message Flood Protection**:
   - Per-WebSocket message rate is capped at 30 messages/second.
   - Messages larger than 64 KB on WebSocket are dropped.
   - Allowed WebSocket signaling messages are strictly whitelisted:
     - `offer`, `answer`, `candidate`, `peer_ready`, `datachannel_fallback`, `ping`.

---

## 6. Network Resilience & Auto-Reconnection

1. **Signaling WebSocket Reconnection**:
   - If an unexpected socket disconnect occurs, `signalingService` initiates automatic reconnect with exponential backoff (`1s`, `2s`, `4s`, `8s`, `16s`, max 5 attempts).
2. **WebRTC ICE Connection Recovery**:
   - `oniceconnectionstatechange` continuously tracks connection health.
   - If the state transitions to `disconnected`, a 5-second grace timer starts. If unrecovered, ICE restart is negotiated automatically.
   - If the state transitions to `failed`, immediate ICE restart is triggered.
   - Maximum 3 ICE restart attempts to prevent runaway reconnection loops during permanent loss of connectivity.
3. **Multi-Tab / Local Fallback**:
   - In environments without remote signaling, `BroadcastChannel` provides zero-configuration local mesh synchronization for testing and development.
