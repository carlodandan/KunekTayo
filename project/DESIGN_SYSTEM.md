# KunekTayo — UI/UX Design System Specification

This design system establishes the visual guidelines, typography, strict color tokens, and accessibility standards for **KunekTayo** across Windows Desktop, Android Mobile, and Web platforms.

---

## 1. Design Direction & Visual Identity

* **Theme**: Modern Dark Mode First (OLED Optimized).
* **Aesthetic**: Minimalist, high contrast, clean depth (`backdrop-blur-md`), zero decorative clutter.
* **Core Philosophy**: A focused communication utility where conversation and participant presence take absolute precedence.
* **Platform Experience**:
  * **Native Apps (Windows & Android)**: The application launches directly into the zero-clutter workspace (Create Room, Join Room, or Active Call). The marketing landing page is completely hidden to provide a focused native tool feel.
  * **Web Client**: Hosts both the comprehensive product overview and the interactive web workspace, with a clean segmented toggle.
* **Production Boundary**: Developer diagnostics (`FoundationInfoCard`) are completely stripped from production builds on both App and Web.

---

## 2. Strict 7-Color Palette & Semantic Tokens

The design system strictly revolves around an authorized **7-color palette**. No arbitrary colors, legacy Discord blurple (`#5865f2`/`#4752c4`), or generic greens may be introduced.

| Token | Hex Value | Semantic Usage & Strict Rules |
| :--- | :--- | :--- |
| **Brand Primary** | `#283E7C` | Primary buttons, active tabs, outgoing chat bubbles, interactive focus rings |
| **Accent Lavender-Blue** | `#9098C8` | Section highlights, subheadings, verified badges, active icons, non-signal checkmarks |
| **Pure Black** | `#000000` | Deep video backdrops, modal scrim overlays, OLED contrast layers |
| **Dark Surface** | `#1E1F22` | Application shell background, container cards, inputs, in-call panels |
| **Danger Red** | `#DA373C` | **Leave Call / Hang Up button**, critical errors, poor connection signal (< 400ms) |
| **Signal Green** | `#1F332B` | **Exclusively gated to connection quality, ping, and TLS status.** Forbidden elsewhere. |
| **Warning Yellow** | `#F0B232` | Ephemeral message TTL burning timer, fair connection ping (200–400ms), solo room clock |

### 2.1 Behavioral Color Rules

1. **Strict Green Gating**:
   * Green (`#1F332B`) is **only permitted** for live connection quality indicators (RTT < 200ms) and TLS security locks.
   * **Never use green** for checkmarks, active participant counters, online dots, or general success states. All such indicators must use `#9098C8` or `#283E7C`.
2. **Call Termination Rule**:
   * The **Leave Call / End Room** button must always use `#DA373C` with hover attenuation `#DA373C/85`.
3. **Ping & Signal Quality Scale**:
   * Excellent / Good (< 200ms): `bg-[#1F332B] text-white border-[#1F332B]`
   * Fair (200ms – 400ms): `bg-[#F0B232]/15 text-[#F0B232] border-[#F0B232]/30`
   * Poor (> 400ms): `bg-[#DA373C]/15 text-[#DA373C] border-[#DA373C]/30`
4. **Chat & Message Bubbles**:
   * Local User: `bg-[#283E7C] text-white`
   * Remote Peer: `bg-[#383a40] text-[#f2f3f5] border-[#3f4147]`
   * TTL Burning Flame: `#F0B232` with numeric countdown.

---

## 3. Typography Scale

* **Font Family**: System native modern sans (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`, `sans-serif`).
* **Display / Hero**: `text-3xl` to `text-5xl` (30px – 48px), `font-extrabold`, `tracking-tight`.
* **Section Titles**: `text-xl` to `text-2xl` (20px – 24px), `font-bold`.
* **Body**: `text-xs` to `text-sm` (12px – 14px), `font-normal`, `leading-relaxed`.
* **Captions & Metadata**: `text-[10px]` to `text-xs` (10px – 12px), `font-semibold`, `uppercase tracking-wider`.
* **Code / Latency / Timers**: `font-mono`, `text-[11px]`, tabular numeric alignment.

---

## 4. Iconography Standards (`Phosphor Icons`)

* **Icon Library**: `@phosphor-icons/react` exclusively.
* **Strict Rule**: No emojis as structural UI icons. All actions and status indicators use vector SVG icons.
* **Weights**:
  * `bold`: Interactive control buttons (mic, camera, screen share, leave call).
  * `fill`: Active toggle states (burning TTL flames, checkmarks, mic active).
  * `regular`: Subtle secondary navigation and contextual metadata.

---

## 5. Touch Target & Accessibility Guidelines

* **Target Sizing**:
  * Desktop minimum clickable height: `44px`.
  * Mobile / Android minimum tap target: `48px` (`min-h-[48px]`).
* **Interactive States**:
  * Active tap feedback: `active:scale-[0.98]` within 100ms.
  * Focus indicators: `focus-visible:ring-2 focus-visible:ring-[#283E7C]`.
  * Zero layout shifts on hover or click.
* **Mobile Safe Areas**:
  * Top header accounts for status bar: `pt-safe` (`env(safe-area-inset-top)`).
  * Bottom navigation accounts for home gesture bar: `pb-safe` (`env(safe-area-inset-bottom)`).
  * Left and right margins account for display cutouts: `pl-safe`, `pr-safe`.

---

## 6. Room Layout & Viewport Consistency

To avoid cognitive dissonance, the live room view and the marketing previews share 1:1 visual parity:
* **Stage Layout**: 2-column equal split on desktop; stacked column with floating picture-in-picture (PiP) on mobile.
* **In-Call Control Bar**: Floating pill containing centered circular actions (`44px`–`48px`) with high contrast hover states.
* **Ephemeral Chat**: Fixed right-hand panel on desktop; slide-over drawer on mobile with inline burning TTL timer selectors.
