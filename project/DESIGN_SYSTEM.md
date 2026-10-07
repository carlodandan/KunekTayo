# KunekTayo — UI/UX Design System Specification

This design system establishes the visual guidelines, typography, color tokens, and accessibility standards for **KunekTayo** across Windows and Android platforms, conforming to the `ui-ux-pro-max` guidelines.

---

## 1. Design Direction & Visual Identity

* **Theme**: Modern Dark Mode First
* **Aesthetic**: Minimalist, high contrast, clean glassmorphic depth (`backdrop-blur-md`), zero unnecessary decorative clutter.
* **Core Philosophy**: A focused communication utility where the conversation and participant presence take absolute precedence.

---

## 2. Color Palette & Semantic Tokens

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--color-surface-bg` | `#090D16` | Application background (deepest navy/black) |
| `--color-surface-card` | `#111827` | Primary surface cards and modal containers |
| `--color-surface-elevated` | `#1E293B` | Interactive elements, elevated badges, active controls |
| `--color-surface-border` | `#334155` | Borders, subtle dividers, cards outline |
| `--color-text-primary` | `#F8FAFC` | Primary headings, prominent labels (>= 4.5:1 contrast) |
| `--color-text-secondary` | `#94A3B8` | Body text, descriptive copy, subtitles |
| `--color-text-muted` | `#64748B` | Disabled indicators, secondary metadata |
| `--color-brand-primary` | `#3B82F6` | Primary action buttons, active tabs, links |
| `--color-brand-accent` | `#06B6D4` | Encryption / security highlights, live active indicators |
| `--color-status-success` | `#10B981` | P2P active, media connected, copy confirmation |
| `--color-status-warning` | `#F59E0B` | Reconnecting, 30m solo room expiration countdown |
| `--color-status-danger` | `#EF4444` | End call, leave room, mute/camera disabled |

---

## 3. Typography Scale

* **Font Family**: System native modern sans (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`)
* **Display / Hero**: `text-4xl` to `text-5xl` (36px - 48px), `font-extrabold`, `tracking-tight`
* **Section Titles**: `text-xl` to `text-2xl` (20px - 24px), `font-bold`
* **Body**: `text-sm` to `text-base` (14px - 16px), `font-normal`, `leading-relaxed`
* **Captions & Labels**: `text-xs` (12px), `font-medium`, `uppercase tracking-wider`
* **Code / Tokens**: `font-mono`, `text-xs`, tabular numbers for timers

---

## 4. Iconography Standards (`ui-ux-pro-max`)

* **Icon Library**: **Phosphor Icons (`@phosphor-icons/react`)** exclusively.
* **Strict Rule**: **No emojis as structural UI icons.** All buttons, navigational items, and status indicators use vector SVG icons.
* **Weights**:
  - `regular` or `bold` for interactive button icons
  - `duotone` for prominent category marks and hero accents
  - `fill` for active toggle states (muted mic, disabled camera, active secure badges)

---

## 5. Touch Target & Accessibility Guidelines

* **Target Sizing**:
  - Desktop minimum clickable height: `44px`
  - Mobile / Android minimum tap target: `48px` (`min-h-[48px]`)
* **Interactive States**:
  - Active tap feedback: `active:scale-[0.98]` within 100ms
  - Focus indicators: `focus-visible:ring-2 focus-visible:ring-blue-500`
  - Zero layout shifts on hover or click
* **Mobile Safe Areas**:
  - Top header accounts for status bar: `pt-safe` (`env(safe-area-inset-top)`)
  - Bottom navigation accounts for home gesture bar: `pb-safe` (`env(safe-area-inset-bottom)`)
