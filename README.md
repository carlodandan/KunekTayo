# KunekTayo

<p align="center">
  <strong>Lightweight, ephemeral 1-on-1 private voice, video, and vanishing chat for Windows and Android.</strong>
</p>

<p align="center">
  <em>"Create a room. Send the link. Connect with one person. Talk privately."</em>
</p>

---

## ⚡ Overview

KunekTayo is a privacy-first, zero-footprint communication tool designed for direct 1-to-1 conversations. It creates disposable rooms protected by cryptographic tokens, establishes direct peer-to-peer WebRTC connections, and leaves zero data on servers.

- **Strict 2-Person Limit**: Rooms enforce an authoritative 2-participant cap via Cloudflare Durable Objects.
- **End-to-End Encrypted P2P**: Direct audio/video mesh using DTLS-SRTP encryption.
- **Zero Server Retention**: No user accounts, zero databases, and zero message/media persistence.
- **30-Minute Solo TTL**: Unpaired rooms auto-destruct after 30 minutes. Active calls remain open indefinitely.
- **Burning Ephemeral Chat**: In-memory WebRTC DataChannel messaging with selectable auto-purge timers (15s–5m).
- **Direct P2P File Sharing**: In-memory chunked transfer over DataChannel. Files vanish from RAM on exit.
- **Responsive Mobile & Desktop UI**: Adaptive Picture-in-Picture (PiP) calling on mobile, dual-stage layout on desktop, and OLED dark mode.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Desktop / Mobile Shell** | [Tauri 2](https://v2.tauri.app/) (Rust stable, Windows MSVC, Android NDK) |
| **Frontend UI** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Web Hosting & Edge Routing** | [Cloudflare Pages](https://pages.cloudflare.com/) + Functions (Service Binding to Worker) |
| **Icons & Design** | [Phosphor Icons](https://phosphoricons.com/), Touch-optimized ($\ge 48\text{dp}$) |
| **Signaling & Authority** | [Cloudflare Workers](https://workers.cloudflare.com/) + [Durable Objects](https://developers.cloudflare.com/durable-objects/) (Private) |
| **Real-Time P2P** | WebRTC (`RTCPeerConnection`, `RTCDataChannel`, Google STUN/TURN) |
| **Testing** | [Vitest](https://vitest.dev/) (`vitest run`) |

---

## 🚀 Building Guide

### 1. Prerequisites

- **Node.js**: `v22` (or $\ge 20$)
- **PNPM**: `v11` (or $\ge 9$) — `npm install -g pnpm`
- **Rust**: Stable toolchain — `rustup default stable`
- **Windows Build Tools**: Visual Studio 2022 with C++ Desktop Development workload
- **Android Tools** (optional for local Android builds):
  - Java 17 JDK (Temurin)
  - Android SDK (API 34) & NDK `27.0.11902837`
  - Cargo NDK: `cargo install cargo-ndk`
  - Rust Android targets: `rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`

---

### 2. Local Development

```bash
# Clone the repository
git clone https://github.com/carlodandan/KunekTayo.git
cd KunekTayo

# Install frontend dependencies
pnpm install

# Run Web SPA development server (http://localhost:1420)
pnpm dev

# Run Native Desktop development app (Windows)
pnpm tauri dev

# Run unit tests
pnpm test
```

---

### 3. Production Builds

#### Windows (`.exe` NSIS & `.msi` Installers)

```bash
# Generate platform icons
pnpm tauri icon logos/kunektayo@Windows.png

# Compile production bundle
pnpm tauri build
```
Artifacts are generated in:
- `src-tauri/target/release/bundle/nsis/*.exe`
- `src-tauri/target/release/bundle/msi/*.msi`

#### Android (`.apk`)

```bash
# Initialize Android project structure (first time only)
pnpm tauri android init

# Generate Android mipmap icons
pnpm tauri icon logos/kunektayo@Android.png

# Build release APK
pnpm tauri android build --apk
```
Artifacts are generated in:
- `src-tauri/gen/android/app/build/outputs/apk/release/*.apk`

#### Web Client & Landing Page (Cloudflare Pages)

```bash
# Build production bundle
pnpm build

# Option A: Automatic Git Deployment (Recommended)
# Connect repo to Cloudflare Pages: Build command "pnpm build", output "dist"

# Option B: Direct CLI Deployment
npx wrangler pages deploy dist --project-name kunektayo
```

#### Private Signaling Worker & Service Binding

```bash
cd server
pnpm install

# Deploy Worker and Durable Object
pnpm run deploy
```
*To isolate the backend and conceal server URLs*:
1. In **Cloudflare Pages &rarr; Settings &rarr; Functions &rarr; Service bindings**, bind `SIGNALING` to `kunektayo-signaling`.
2. In **Cloudflare Workers &rarr; `kunektayo-signaling` &rarr; Settings &rarr; Domains & Routes**, toggle **OFF** `workers.dev`. All traffic will route privately through `https://kunektayo.app/api/...`.

---

## 🤖 GitHub Actions Workflow

A production CI/CD workflow is located at [`.github/workflows/build.yml`](.github/workflows/build.yml). It can be triggered manually via `workflow_dispatch` or on Git release tags (`v*`).

### Jobs:
1. **`build-windows`** (runs on `windows-2025`):
   - Sets up Node 22, PNPM 11, and Rust stable.
   - Generates Windows icons (`pnpm tauri icon logos/kunektayo@Windows.png`).
   - Builds `.msi` and `.exe` and creates a draft/published GitHub Release via `tauri-apps/tauri-action`.
2. **`build-android`** (runs on `ubuntu-latest`):
   - Sets up Java 17, Android SDK, and NDK `27.0.11902837`.
   - Adds 4 Android Rust targets and `cargo-ndk`.
   - Initializes Android workspace and builds APK (`pnpm tauri android build --apk`).
   - Decodes JKS keystore from GitHub Secrets, aligns with `zipalign`, and signs with `apksigner`.
   - Attaches signed `KunekTayo-v*.apk` to the GitHub Release.

### Required GitHub Secrets:
| Secret | Purpose |
| :--- | :--- |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri auto-updater private key for Windows binaries |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Passphrase for the Tauri private key |
| `ANDROID_KEY_BASE64` | Base64-encoded Android release keystore (`.jks`) |
| `ANDROID_KEY_ALIAS` | Key alias in the release keystore |
| `ANDROID_KEY_PASSWORD` | Password for the Android private key |
| `ANDROID_STORE_PASSWORD` | Password for the release keystore |
| `GH_TOKEN` / `GITHUB_TOKEN` | Token with release write permissions |

---

## 📚 Documentation & Specifications

Detailed architecture documentation is located in the [`project/`](project/) directory:
- [ARCHITECTURE.md](project/ARCHITECTURE.md) — System topology, WebRTC state transitions, and signaling protocol.
- [SPEC.md](project/SPEC.md) — Functional specifications and room lifecycle rules.
- [SECURITY.md](project/SECURITY.md) — Cryptographic token audit, threat model, and rate limiting.
- [DEPLOYMENT.md](project/DEPLOYMENT.md) — Production deployment runbook for Cloudflare, Windows, and Android.
- [ROADMAP.md](project/ROADMAP.md) — Progress tracking across all 9 engineering phases.
- [DESIGN_SYSTEM.md](project/DESIGN_SYSTEM.md) — Design tokens, OLED palette, and touch target rules.

---

## 📄 License

MIT © [Carlo Dandan](https://github.com/carlodandan)
