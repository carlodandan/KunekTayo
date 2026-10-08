# KunekTayo — Production Deployment & Build Runbook

## 1. Architecture Overview

KunekTayo consists of two coordinated tiers:
1. **Frontend / Native Shell (Tauri 2 & Cloudflare Pages)**:
   - Native targets: Windows (`.exe` NSIS installer, `.msi`) and Android (`.apk`, `.aab`).
   - Web target: Hosted on **Cloudflare Pages** serving both the **Landing Page** and the **Instant Web Client** from a unified bundle (`dist/`).
2. **Signaling & Room State Backend (Cloudflare Workers & Durable Objects)**:
   - Private serverless Worker with Durable Objects for authoritative 1-on-1 room state and WebSockets.
   - **Internal Service Binding**: The Worker is connected privately to Cloudflare Pages via the `SIGNALING` Service Binding. The public `workers.dev` route is disabled, exposing zero backend URLs to the public.

---

## 2. Cloudflare Pages & Service Binding Deployment (Zero Server Exposure)

To protect backend endpoints from scrapers and third-party abuse, KunekTayo uses a **Cloudflare Pages Function** (`functions/api/[[route]].ts`) that forwards requests internally to the worker over Cloudflare's private network mesh.

### 2.1 Deploy the Signaling Worker

```bash
cd server

# Authenticate with Cloudflare
npx wrangler login

# Deploy Worker and Durable Object bindings
pnpm run deploy
```

Upon initial deployment, Wrangler registers the worker named `kunektayo-signaling`.

### 2.2 Configure the Private Service Binding

1. Go to the **Cloudflare Dashboard** &rarr; **Compute (Workers & Pages)** &rarr; **Pages** &rarr; Select your `kunektayo` project.
2. Navigate to **Settings** &rarr; **Functions** &rarr; Scroll down to **Service bindings**.
3. Click **Add binding**:
   - **Variable name**: `SIGNALING` *(must match exactly)*
   - **Service**: Select `kunektayo-signaling`
   - **Environment**: `production`
4. Click **Save**.

### 2.3 Disable Public `workers.dev` Route (Make Worker Private)

1. In the Cloudflare Dashboard, go to **Workers & Pages** &rarr; `kunektayo-signaling`.
2. Navigate to **Settings** &rarr; **Domains & Routes**.
3. Under **workers.dev**, toggle it **OFF** (or delete the public route).

Now, the Worker has **zero public web address**. It cannot be accessed via curl or foreign sites, only via your own Cloudflare Pages domain (`https://kunektayo.app/api/...` or `https://kunektayo.pages.dev/api/...`).

### 2.4 Deploy Cloudflare Pages

#### Method A: Automatic Git Integration (Recommended)
1. In Cloudflare Pages, connect your GitHub repository (`KunekTayo`).
2. Build Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
3. Click **Save and Deploy**.

#### Method B: Direct Wrangler CLI Deployment
```bash
# Build frontend bundle
pnpm build

# Deploy directly via Wrangler
npx wrangler pages deploy dist --project-name kunektayo
```

---

## 3. Environment Variable Configuration

Because the web client automatically resolves to the current window origin when deployed, **`VITE_SIGNALING_URL` is completely optional for Cloudflare Pages**. The frontend will automatically route requests to `/api/rooms` and `/api/rooms/:id/ws` on the same domain.

For native desktop (Windows) and mobile (Android) builds, set your production domain:
```env
VITE_SIGNALING_URL=https://kunektayo.app
```

---

## 4. Production TURN Configuration

While STUN handles ~85% of standard NAT traversal, symmetric NATs (common in cellular networks and corporate enterprise firewalls) require a TURN relay server.

### Option A: Cloudflare Calls TURN (Recommended)
1. In Cloudflare Dashboard, navigate to **Calls** -> **TURN Service**.
2. Generate an API Key / TURN credentials.
3. Supply them in `.env.production` or GitHub Actions Secrets:
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

## 5. Windows Desktop Build

### Prerequisites
- Visual Studio 2022 with C++ Desktop Development workload.
- Rust toolchain (`rustup default stable-x86_64-pc-windows-msvc`).
- Node.js 22 + PNPM 11.

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

## 6. Android Mobile Build

### Prerequisites
- Android Studio / Android SDK CLI tools (API Level 34+).
- Java JDK 17 (Temurin or OpenJDK).
- Rust Android targets:
```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
cargo install cargo-ndk
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

## 7. Operational Health & Error Recovery

- **Health Check Endpoint**:
  `GET https://kunektayo.app/api/health`
  Returns `{"status": "healthy", "service": "KunekTayo Signaling & Room State"}`.
- **Client Error Boundary**:
  Unhandled JavaScript exceptions are caught by `ErrorBoundary.tsx`, offering users one-click reload or return to home without UI death.
- **Solo Room Cleanup**:
  Cloudflare Durable Object alarms reliably delete orphaned rooms after 30 minutes of inactivity, guaranteeing zero server storage accumulation.
