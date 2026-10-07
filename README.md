# KunekTayo

<p align="center">
  <strong>Lightweight, temporary 1-on-1 private voice, video, and vanishing chat for Windows and Android.</strong>
</p>

<p align="center">
  <em>"Create a room. Send the link. Connect with one person. Talk privately."</em>
</p>

---

## 🌟 Key Features

- **Strict 1-on-1 Boundary**: Maximum of 2 participants per room. No third-party eavesdropping or room hijacking.
- **End-to-End P2P Media**: Direct WebRTC mesh for crystal-clear audio and video encrypted with DTLS-SRTP.
- **Zero Server Storage**: Zero database, zero chat message retention, zero media logs.
- **Authoritative Solo Expiration**: Cloudflare Durable Object alarm auto-destroys rooms after 30 minutes if a partner doesn't join. Active rooms remain alive as long as both participants stay connected.
- **Ephemeral Self-Destructing Chat**: Real-time messaging via WebRTC `RTCDataChannel` with live burning countdowns (15s, 30s, 60s, 5m). Messages vanish from RAM on both devices upon TTL expiry.
- **Direct P2P File & Image Sharing**: Chunked in-memory transfer over WebRTC DataChannel with drag-and-drop support, image previews, and automatic memory cleanup on room exit. Zero cloud storage.
- **Screen Sharing**: 1-click display media presentation with seamless camera track restoration.
- **Cross-Platform Responsive Design**:
  - **Windows**: Native desktop installer (`.msi`, `.exe` NSIS) and deep-linking support (`kunektayo://`).
  - **Android**: Touch-optimized interface ($\ge 48\text{dp}$ touch targets, safe area insets, mobile viewport handling).
  - **Web SPA**: Universal browser fallback.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Desktop Shell** | [Tauri 2](https://v2.tauri.app/) (Rust 1.77+, Windows MSVC, Android NDK) |
| **Frontend Framework** | [React 19](https://react.dev/), [TypeScript 6](https://www.typescriptlang.org/) |
| **Bundler & Styling** | [Vite 8](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons & Design** | [Phosphor Icons](https://phosphoricons.com/) (`@phosphor-icons/react`), Dark-mode first |
| **Signaling & Room State** | [Cloudflare Workers](https://workers.cloudflare.com/) + [Durable Objects](https://developers.cloudflare.com/durable-objects/) |
| **Real-Time Mesh** | Native WebRTC (`RTCPeerConnection`, `RTCDataChannel`, Google STUN / TURN) |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20 or higher
- **PNPM**: v9 or higher (`npm install -g pnpm`)
- **Rust**: Stable toolchain (`rustup default stable`)
- **C++ Build Tools**: Visual Studio 2022 (Windows)

### 2. Frontend & Desktop Setup
```bash
# Clone the repository
git clone https://github.com/carlodandan/KunekTayo.git
cd KunekTayo

# Install frontend dependencies
pnpm install

# Run web development server
pnpm dev

# Run native desktop development app
pnpm tauri dev
```

### 3. Signaling Backend Setup (Cloudflare Worker)
```bash
cd server
pnpm install

# Run local Durable Object signaling emulator
pnpm dev

# Deploy to Cloudflare network
pnpm run deploy
```

---

## 🔒 Security & Privacy Model

- **256-Bit Token Entropy**: Cryptographically secure pseudorandom token generated using the Web Crypto API.
- **SHA-256 Hash Verification**: Plaintext tokens are hashed on the client and never sent in plaintext over the wire.
- **Constant-Time Comparison**: `timingSafeEqual` prevents side-channel timing analysis.
- **Sliding-Window Rate Limiting**: Cloudflare Workers enforce rate limiting (15 room creates/min, 30 joins/min) and payload size caps (64 KB).
- **Flood Protection**: WebSocket message rate limiting (30 msg/s) mitigates signaling spam attacks.
- **Automatic Reconnection**: Exponential backoff reconnects dropped signaling sockets, while ICE restart handles intermittent network degradation.

For full architectural details, see [project/SECURITY.md](project/SECURITY.md).

---

## 📦 Project Documentation

Detailed architecture specifications and guides are available in the [`project/`](project/) folder:
- [ARCHITECTURE.md](project/ARCHITECTURE.md) — System architecture, communication diagrams, and data flow.
- [SPEC.md](project/SPEC.md) — Complete protocol specification for room lifecycle and WebRTC mesh.
- [SECURITY.md](project/SECURITY.md) — Threat model, cryptographic audit, and privacy guarantees.
- [DEPLOYMENT.md](project/DEPLOYMENT.md) — Production deployment runbook for Windows, Android, and Cloudflare.
- [ROADMAP.md](project/ROADMAP.md) — Implementation tracker covering all 9 project phases.
- [DESIGN_SYSTEM.md](project/DESIGN_SYSTEM.md) — Visual tokens, touch targets, and mobile safe areas.

---

## 📄 License

MIT © [Carlo Dandan](https://github.com/carlodandan)
