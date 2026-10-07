# KunekTayo — Project Roadmap & Phase Tracker

Tracking progress across the 9 implementation phases defined in `APP.md`.

---

## Phase Status Summary

| Phase | Title | Status | Primary Deliverables |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Foundation** | **COMPLETED (Pending Review)** | Tauri 2, React 19, TypeScript, Vite 8, Tailwind v4, Phosphor Icons, App Shell, Env Config, Windows + Android setup |
| **Phase 2** | **Rooms** | Ready Next | Authoritative Durable Object room state, crypto token generator, 2-person limit, 30m solo room expiration |
| **Phase 3** | **Invite Links & Signaling** | Planned | Web invite routing, deep links (Windows & Android), WebSocket signaling protocol via Cloudflare |
| **Phase 4** | **WebRTC** | Planned | RTCPeerConnection mesh, audio/video media tracks, mute/camera toggle, STUN/TURN traversal |
| **Phase 5** | **Ephemeral Chat** | Planned | WebRTC RTCDataChannel, per-message TTL countdown, auto-purge, typing indicator |
| **Phase 6** | **Call & Room UX** | Planned | 1-to-1 call stage, device selectors, connection quality meter, responsive Android/Windows UI |
| **Phase 7** | **Optional Sharing** | Planned | Screen sharing, temporary drag-and-drop file transfers via DataChannel |
| **Phase 8** | **Security & Reliability** | Planned | Room token entropy audit, rate limiting, reconnect edge cases, abuse protection |
| **Phase 9** | **Production** | Planned | Windows NSIS installer & portable exe, Android APK/AAB build, Cloudflare deployment |

---

## Detailed Phase Breakdown

### Phase 1: Foundation (Current)
- [x] Tauri 2.12 project configuration with desktop & mobile capability schemes
- [x] React 19 + TypeScript 6.0 setup with `@/*` path aliases
- [x] Vite 8.3 bundler configuration with `@tailwindcss/vite`
- [x] Tailwind CSS v4 design system with dark-mode aesthetic
- [x] Phosphor Icons (`@phosphor-icons/react`) integrated according to `ui-ux-pro-max` guidelines
- [x] Touch-friendly interactive buttons and inputs (>=48dp touch targets)
- [x] Responsive layout with safe area support for mobile (`pt-safe`, `pb-safe`)
- [x] Typed environment configuration (`src/config/env.ts`)
- [x] Windows target verified (`cargo check`, clean Vite build)
- [x] Android target scaffolded and mapped (`pnpm tauri android init` prerequisites documented)
- [x] Project architecture documentation created in `project/`

### Phase 2: Rooms (Next)
- [ ] Cryptographically secure room and token generator (16+ bytes)
- [ ] Cloudflare Worker & Durable Object project scaffold (`server/` or `worker/`)
- [ ] Authoritative room state machine (idle, waiting, active, expired)
- [ ] Enforce strict 2-participant room ceiling
- [ ] 30-minute solo room expiration timer with server alarm
- [ ] Disconnection and rejoin handling
- [ ] Client room state store and lifecycle hooks

### Phase 3: Invite Links & Signaling
- [ ] Web invite URL structure (`https://kunektayo.app/join/:roomId#token`)
- [ ] Deep link protocol registration (`kunektayo://join/...`) for Windows and Android
- [ ] Full duplex WebSocket signaling protocol (offer, answer, ICE candidates)
- [ ] Token validation and room access authorization

### Phase 4: WebRTC
- [ ] `RTCPeerConnection` coordinator
- [ ] Local camera and microphone stream capture
- [ ] Audio/video track negotiation
- [ ] Device mute/unmute and camera pause/resume
- [ ] STUN/TURN fallback configuration and ICE connection monitoring

### Phase 5: Ephemeral Chat
- [ ] `RTCDataChannel` setup for in-band text messaging
- [ ] Independent message TTL timer (default 60s)
- [ ] Client-side message auto-expiration with visual fade/burn indicator
- [ ] Zero database persistence guarantee

### Phase 6: Call & Room UX
- [ ] Fullscreen 1-on-1 video grid with picture-in-picture local preview
- [ ] Media device selectors (microphone, speaker, webcam)
- [ ] Live audio waveform / volume meters
- [ ] Connection quality and latency indicator
- [ ] Room countdown timer indicator for solo waiting states

### Phase 7: Optional Sharing
- [ ] Screen sharing track negotiation (`getDisplayMedia`)
- [ ] Direct file transfer over RTCDataChannel with chunking

### Phase 8: Security & Reliability
- [ ] Room token security validation and entropy check
- [ ] WebSocket rate limiting on Cloudflare Worker
- [ ] Network interruption reconnection handler with ICE restart
- [ ] Memory leak checks for long-running calls

### Phase 9: Production
- [ ] Windows NSIS bundle installer and portable executable
- [ ] Android signed APK / AAB packaging
- [ ] Cloudflare Worker production deployment script
- [ ] TURN credential server integration (Cloudflare Calls or Coturn)
