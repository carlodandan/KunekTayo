# KunekTayo — Production Deployment & Build Runbook

## 1. Architecture Overview

KunekTayo consists of two distinct components:
1. **Frontend / Native Shell (Tauri 2)**:
   - Targets: Windows (`.exe` NSIS installer, `.msi`) and Android (`.apk`, `.aab`).
   - Web preview target: Static SPA build (`dist/`).
2. **Signaling & Room State Backend (Cloudflare Workers)**:
   - Serverless Worker with Durable Objects for authoritative 1-on-1 state management and WebSocket message forwarding.

---

## 2. Cloudflare Worker Deployment

### Prerequisites
- Node.js 20+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with **Workers Paid** plan (required for Durable Objects).

### Deployment Steps
```bash
cd server

# Authenticate with Cloudflare
npx wrangler login

# Deploy to Cloudflare network
pnpm run deploy
```

Upon successful deployment, Wrangler will output your live worker URL:
`https://kunektayo-signaling.<your-subdomain>.workers.dev`

### Environment Variables
Set the following on your frontend build or client environment:
```env
VITE_SIGNALING_URL=https://kunektayo-signaling.<your-subdomain>.workers.dev
```

---

## 3. Production TURN Configuration

While STUN handles ~85% of standard NAT traversal, symmetric NATs (common in cellular networks and corporate enterprise firewalls) require a TURN relay server.

### Option A: Cloudflare Calls TURN (Recommended)
1. In Cloudflare Dashboard, navigate to **Calls** -> **TURN Service**.
2. Generate an API Key / TURN credentials.
3. Supply them in `.env.production`:
```env
VITE_TURN_SERVERS=turns:turn.cloudflare.com:443?transport=tcp,turn:turn.cloudflare.com:3478
VITE_TURN_USERNAME=<YOUR_CLOUDFLARE_TURN_USER>
VITE_TURN_CREDENTIAL=<YOUR_CLOUDFLARE_TURN_TOKEN>
```

### Option B: Self-Hosted Coturn
Run a Coturn container with ephemeral credentials:
```bash
docker run -d --net=host coturn/coturn \
  -n --log-file=stdout \
  --min-port=49160 --max-port=49200 \
  --realm=turn.kunektayo.app \
  --user=kunektayo:secure_turn_password \
  --fingerprint --lt-cred-mech
```

---

## 4. Windows Desktop Build

### Prerequisites
- Visual Studio 2022 with C++ Desktop Development workload.
- Rust toolchain (`rustup default stable-x86_64-pc-windows-msvc`).
- Node.js 22 + PNPM 9.

### Build Commands
```bash
# Verify code and compile frontend
pnpm build

# Build production Windows NSIS installer & MSI package
pnpm tauri build
```

### Output Artifacts
- **NSIS Setup Installer**: `src-tauri/target/release/bundle/nsis/KunekTayo_0.1.0_x64-setup.exe`
- **MSI Installer**: `src-tauri/target/release/bundle/msi/KunekTayo_0.1.0_x64_en-US.msi`

---

## 5. Android Mobile Build

### Prerequisites
- Android Studio / Android SDK CLI tools (API Level 34+).
- Java JDK 17 (Temurin or OpenJDK).
- Rust Android targets:
```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### Build Commands
```bash
# Initialize Android project if not already generated
pnpm tauri android init

# Build release APK
pnpm tauri android build --apk

# Build Google Play App Bundle (AAB)
pnpm tauri android build --aab
```

### Output Artifacts
- **Release APK**: `src-tauri/gen/android/app/build/outputs/apk/release/app-release-unsigned.apk`
- **Play Store Bundle**: `src-tauri/gen/android/app/build/outputs/bundle/release/app-release.aab`

---

## 6. Static Web SPA Deployment (Cloudflare Pages)

KunekTayo can also run as a pure web app in modern browsers (Chrome, Edge, Firefox, Safari):
```bash
pnpm build
```
Deploy the generated `dist/` directory directly to Cloudflare Pages or Vercel:
```bash
npx wrangler pages deploy dist --project-name kunektayo
```

---

## 7. Operational Health & Error Recovery

- **Health Check Endpoint**:
  `GET https://kunektayo-signaling.<subdomain>.workers.dev/health`
  Returns `{"status": "healthy", "service": "KunekTayo Signaling & Room State"}`.
- **Client Error Boundary**:
  Unhandled JavaScript exceptions are caught by `ErrorBoundary.tsx`, offering users one-click reload or return to home without UI death.
- **Solo Room Cleanup**:
  Cloudflare Durable Object alarms reliably delete orphaned rooms after 30 minutes of inactivity, guaranteeing zero server storage accumulation.
