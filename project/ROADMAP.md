# KunekTayo — Project Roadmap & Phase Tracker

Tracking progress across the 9 implementation phases defined in `APP.md`.

---

## Phase Status Summary

| Phase | Title | Status | Primary Deliverables |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Foundation** | **COMPLETED** | Tauri 2, React 19, TypeScript, Vite 8, Tailwind v4, Phosphor Icons, App Shell, Env Config, Windows + Android setup |
| **Phase 2** | **Rooms** | **COMPLETED** | Authoritative Durable Object room state, crypto token generator, 2-person limit, 30m solo room expiration, rejoin handling |
| **Phase 3** | **Invite Links & Signaling** | **COMPLETED** | Web invite routing, deep links (Windows & Android), WebSocket signaling protocol via Cloudflare |
| **Phase 4** | **WebRTC** | **COMPLETED** | RTCPeerConnection mesh, audio/video media tracks, mute/camera toggle, STUN/TURN traversal |
| **Phase 5** | **Ephemeral Chat** | **COMPLETED** | WebRTC RTCDataChannel, per-message TTL countdown, auto-purge, typing indicator |
| **Phase 6** | **Call & Room UX** | **COMPLETED** | 1-to-1 call stage, device selectors, connection quality meter, responsive Android/Windows UI |
| **Phase 7** | **Optional Sharing** | **COMPLETED** | Screen sharing via getDisplayMedia, temporary P2P drag-and-drop file transfers via DataChannel |
| **Phase 8** | **Security & Reliability** | **COMPLETED** | Room token entropy audit, rate limiting, reconnect edge cases, abuse protection |
| **Phase 9** | **Production & Hardening** | **COMPLETED** | Strict 7-color palette enforcement, native platform landing page isolation, Web Audio noise filter, device switching fallback, production diagnostic gating |

---

## Detailed Phase Breakdown

### Phase 1: Foundation (Completed)
- [x] Tauri 2.12 project configuration with desktop & mobile capability schemes
- [x] React 19 + TypeScript 6.0 setup with `@/*` path aliases
- [x] Vite 8.3 bundler configuration with `@tailwindcss/vite`
- [x] Tailwind CSS v4 design system with dark-mode aesthetic
- [x] Phosphor Icons (`@phosphor-icons/react`) integrated according to `ui-ux-pro-max` guidelines
- [x] Touch-friendly interactive buttons and inputs (>=48dp touch targets)
- [x] Responsive layout with safe area support for mobile (`pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`)
- [x] Typed environment configuration (`src/config/env.ts`)
- [x] Windows target verified (`cargo check`, clean Vite build)
- [x] Android target scaffolded and mapped (`pnpm tauri android init` prerequisites documented)
- [x] Project architecture documentation created in `project/`

### Phase 2: Rooms (Completed)
- [x] Cryptographically secure room and token generator (16-char ID, 32-char token, SHA-256 hash in `src/utils/crypto.ts`)
- [x] Cloudflare Worker & Durable Object architecture (`server/src/RoomDurableObject.ts`, `server/src/index.ts`, `server/wrangler.jsonc`)
- [x] Authoritative room state machine (idle, creating, waiting, active, expired, closed)
- [x] Strict 2-participant room ceiling enforcement (`ROOM_FULL` code 409 rejection)
- [x] 30-minute solo room expiration countdown with Cloudflare alarm (`ctx.storage.setAlarm`)
- [x] Automatic alarm cancellation when 2nd participant connects
- [x] Rejoin session persistence in client (`sessionStorage`) with instant reconnect banner
- [x] Client room state provider (`src/context/RoomContext.tsx`) with real-time countdown timer
- [x] Full UI states: `WaitingRoomView`, `ActiveRoomView`, `ExpiredRoomView`, and `RejoinBanner`
- [x] Android UX considerations: >=48dp tap targets, touch-action safe areas, high contrast text

### Phase 3: Invite Links & Signaling (Completed)
- [x] Web invite URL structure (`https://kunektayo.pages.dev/#room=:roomId&token=:inviteToken`)
- [x] Deep link protocol registration (`kunektayo://join/...`) for Windows and Android
- [x] Full duplex WebSocket signaling protocol (offer, answer, ICE candidates)
- [x] Secure room and token validation on WebSocket upgrade
- [x] Direct InviteJoinModal for immediate joining on URL detection

### Phase 4: WebRTC & Audio Pipeline (Completed)
- [x] `RTCPeerConnection` coordinator (`src/services/webrtcService.ts`)
- [x] Local camera and microphone stream capture (`getUserMedia`)
- [x] Web Audio API background noise suppression DSP pipeline (`audioProcessingService.ts`)
  - 85 Hz high-pass filter for HVAC/rumble suppression
  - 3 kHz peaking EQ for vocal presence and clarity
  - Dynamics compressor for vocal leveling
- [x] Atomic device switching (`replaceAudioTrack`, `replaceVideoTrack`) with failure fallback
- [x] Audio/video track negotiation and SDP exchange
- [x] Device mute/unmute and camera pause/resume
- [x] STUN/TURN fallback configuration and ICE connection monitoring

### Phase 5: Ephemeral Chat (Completed)
- [x] `RTCDataChannel` setup for in-band text messaging
- [x] Independent message TTL timer (options: 15s, 30s, 60s, 5m)
- [x] Client-side message auto-expiration with visual burning indicator
- [x] Typing indicator with debounce
- [x] Delivery states (`sending` and `delivered`)
- [x] Zero database persistence guarantee

### Phase 6: Call & Room UX (Completed)
- [x] Fullscreen 1-on-1 video grid with picture-in-picture local preview
- [x] Media device selectors (`DeviceSelectorModal.tsx` for microphone and camera switching)
- [x] Device change listener with `navigator.mediaDevices.ondevicechange`
- [x] Connection quality and latency indicator (`ConnectionQualityBadge.tsx` with RTT stats)
- [x] Room countdown timer indicator for solo waiting states (`WaitingRoomView.tsx`)
- [x] Rejoin handling and banner prompt (`RejoinBanner.tsx`)

### Phase 7: Optional Sharing (Completed)
- [x] Screen sharing track negotiation (`getDisplayMedia` with automatic camera fallback on end)
- [x] Direct ephemeral file and image transfer over `RTCDataChannel` with 32 KB chunking
- [x] Drag-and-drop file transfer overlay across call stage
- [x] Shared files modal (`FileShareModal.tsx`) with image lightbox preview and download
- [x] Ephemeral in-memory Blob management with auto-revocation and zero server persistence

### Phase 8: Security & Reliability (Completed)
- [x] Room token security validation and entropy check (128-bit/256-bit crypto randomness)
- [x] Constant-time comparison (`timingSafeEqual`) to prevent side-channel timing attacks
- [x] IP sliding window rate limiting (15 creates/min, 30 joins/min) on Cloudflare Worker
- [x] Payload size cap (64 KB) on HTTP requests and WebSocket signaling frames
- [x] WebSocket message rate limiting (max 30 msgs/s) to prevent flood attacks
- [x] Exponential backoff automatic reconnection on unexpected signaling drop
- [x] Automatic ICE restart negotiation on disconnect or ICE state failure (max 3 retries)

### Phase 9: Hardening, Polish & Design Systems (Completed)
- [x] **Strict 7-Color Palette Enforcement**: `#283E7C`, `#9098C8`, `#000000`, `#1E1F22`, `#DA373C`, `#1F332B`, `#F0B232`.
- [x] **Signal Quality Gating**: Gated green `#1F332B` strictly to connection quality / ping signals and TLS.
- [x] **Platform Gating**: Bypassed marketing LandingPage on native Tauri Windows (.exe / .msi) and Android (.apk) apps, reserving it exclusively for web browser visitors.
- [x] **UI Parity**: Aligned `LandingPreview` mockup with the exact room UI and controls of `ActiveRoomView`.
- [x] **Production Diagnostics Gating**: Gated `FoundationInfoCard` behind development mode (`env.isDev`), removing diagnostic cards in production.
- [x] **Terminology Scrub**: Removed internal backend terms ("Cloudflare", "Durable Objects") from all user-facing copy.
- [x] **Test Suite Expansion**: Added unit tests for platform gating, device switching, and audio processing (38 tests passing).
