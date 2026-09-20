---
name: Classified Cyber Warfare Command
colors:
  surface: '#101419'
  surface-dim: '#101419'
  surface-bright: '#36393f'
  surface-container-lowest: '#0b0e13'
  surface-container-low: '#181c21'
  surface-container: '#1d2025'
  surface-container-high: '#272a30'
  surface-container-highest: '#32353b'
  on-surface: '#e0e2ea'
  on-surface-variant: '#b9ccb5'
  inverse-surface: '#e0e2ea'
  inverse-on-surface: '#2d3036'
  outline: '#849581'
  outline-variant: '#3b4b3a'
  surface-tint: '#00e55b'
  primary: '#edffe8'
  on-primary: '#003911'
  primary-container: '#00ff66'
  on-primary-container: '#007128'
  inverse-primary: '#006e27'
  secondary: '#bdf4ff'
  on-secondary: '#00363d'
  secondary-container: '#00e3fd'
  on-secondary-container: '#00616d'
  tertiary: '#fff9f5'
  on-tertiary: '#452b00'
  tertiary-container: '#ffd7a4'
  on-tertiary-container: '#865700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff83'
  primary-fixed-dim: '#00e55b'
  on-primary-fixed: '#002107'
  on-primary-fixed-variant: '#00531b'
  secondary-fixed: '#9cf0ff'
  secondary-fixed-dim: '#00daf3'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#ffb952'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#101419'
  on-background: '#e0e2ea'
  surface-variant: '#32353b'
  surface-base: '#070A0F'
  surface-panel: '#0B0F17'
  surface-subtle: '#121824'
  surface-highlight: '#1B2436'
  border-dim: '#1B2A3D'
  border-bright: '#2E4766'
  crimson-alert: '#FF0055'
  crimson-subtle: '#2B0B17'
  warning-amber: '#FFAA00'
  warning-subtle: '#2A1D05'
  cyan-telemetry: '#00E5FF'
  cyan-subtle: '#05222E'
  phosphor-green: '#00FF66'
  phosphor-glow: rgba(0, 255, 102, 0.15)
  text-primary: '#F0F6FC'
  text-secondary: '#8B9BB4'
  text-muted: '#4B5B73'
typography:
  headline-xl:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  headline-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.1em
  code-stream:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 15px
    letterSpacing: 0em
spacing:
  gutter: 0.5rem
  margin: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.625rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers an authentic military terminal interface engineered for high-density, mission-critical cyber defense operations, intelligence analysis, and telemetry monitoring. It captures the psychological weight and technical precision of an air-gapped TS-SCI cyber warfare operations center.

The design movement is **Brutalism meets Tactical Sci-Fi Skeuomorphism**: zero border radii, razor-sharp 1px dividers, monospaced tabular layouts, ultra-high information density, CRT raster scanning artifacts, and phosphor luminescence. The visual language conveys uncompromising authority, continuous operational readiness, and cold computational focus.

Target personas include SOC watch-floor analysts, military cyber command operators, red-team adversary emulation engineers, and intelligence directors who need zero visual distraction, immediate status comprehension, and nanosecond UI latency.

## Colors

The palette simulates legacy monochrome and dual-beam cathode ray tube displays integrated into hardened tactical field units. The dark background hierarchy builds upwards from an abyss black base (`#070A0F`) to structural panel surfaces (`#0B0F17`) and active command tiles (`#121824`).

### Functional Roles
- **Phosphor Green (`#00FF66`)**: Operational health, active defense shields, validated handshakes, root shell prompt markers, and standard mission telemetry.
- **Tactical Cyan (`#00E5FF`)**: SIEM aggregates, RF waveform streams, payload compiler outputs, telemetry timestamps, and Allied node links.
- **Warning Amber (`#FFAA00`)**: MITRE ATT&CK intermediate phases, network probes, sensor anomalies, and pending quarantine buffers.
- **Critical Alert Crimson (`#FF0055`)**: Active C2 beacon breaches, lateral movement warnings, data exfiltration alerts, and DEFCON 1 state overrides.
- **Structural Slate (`#0B0F17`, `#1B2A3D`)**: Non-distracting mechanical foundations that frame data streams with 1px precision.

## Typography

The design system standardizes exclusively on **JetBrains Mono** across all hierarchy tiers. Monospaced rendering ensures structural alignment across tabular telemetry, memory offsets, IP packet streams, hex dumps, and live process matrices.

### Rules of Usage
- **Classification Headers & Badges**: All uppercase, tracked wide (`letter-spacing: 0.1em`), styled in `label-sm` or `label-md`.
- **Numbers & Metrics**: Must render with tabular numerals (`font-feature-settings: 'tnum' 1, 'zero' 1`) to eliminate character jitter during high-velocity updates.
- **Section Headers**: Structured as pseudo-command paths (e.g., `// SYS.RADAR.WAR_ROOM_v5`, `[DEFCON_STATUS]`).
- **Telemetry Subtext**: Rendered in `body-sm` with muted low-saturation color (`#8B9BB4`).

## Layout & Spacing

The layout model is a modular, zero-waste CSS Grid architecture reminiscent of terminal multiplexers (`tmux` / `i3`). Margins and gutters are compressed to maximize functional screen real estate, achieving high information density without visual chaos.

### Grid Rhythm & Adapters
- **Desktop (>= 1440px)**: 24-column micro-grid with `gutter: 0.5rem` and outer `margin: 0.75rem`. Panels snap into multi-pane workspace configurations (Trio, Vertical Split, Quad Command).
- **Console / Laptop (1024px - 1439px)**: 12-column grid. Tactical sidebars dock into collapsible drawers, maintaining 100% viewport height.
- **Mobile / Field Device (< 1024px)**: Single-column accordion feed. HUD summary ribbon remains persistently pinned to the top viewport edge.
- **Internal Padding**: Dense components use `space-xs` (4px) to `space-md` (10px). Large macro panels cap padding at `space-lg` (16px) to avoid unneeded negative space.

## Elevation & Depth

Depth is constructed entirely through flat architectural tiering, 1px high-contrast structural borders, and luminous phosphor CRT glows. Traditional diffuse drop shadows are strictly prohibited.

### Tonal Tiers
1. **Backdrop Layer (`#070A0F`)**: Canvas foundation host for the radar canvas and retro matrix stream.
2. **Terminal Panel (`#0B0F17`)**: Standard container level bordered by `1px solid #1B2A3D`.
3. **Elevated Node / Active Card (`#121824`)**: Active focus states, bordered by `1px solid #2E4766`.
4. **Overlay HUD (`rgba(11, 15, 23, 0.92)`)**: Modals and deep telemetry inspectors, featuring a crisp `1px solid #00FF66` border and a scanline texture overlay.

### Phosphor Glow Effects
Interactive and critical elements harness luminous outer glow borders using CSS `box-shadow`:
- **Active Terminal Focus**: `0 0 8px rgba(0, 255, 102, 0.35)`
- **Critical Alert Beacon**: `0 0 10px rgba(255, 0, 85, 0.45)`
- **Target Lock / Surveillance Focus**: `0 0 8px rgba(0, 229, 255, 0.35)`

## Shapes

The design system enforces a strict **Zero-Radius (`roundedness: 0`)** standard across every component, card, button, tab, modal, and input. Curves are eliminated to reinforce military hardware rigor, modular grid alignment, and raw industrial utility.

### Notched & Tactical Treatments
- Containers feature tactical 45-degree chamfered corner notches (`clip-path: polygon(...)`) on selected primary headers.
- Interactive status indicators (e.g., node health, active beacons) use unrounded diamond glyphs (`◆`), squares (`■`), or precise circular pins with zero border blur.

## Components

### Tactical Action Buttons
- **Shape & Geometry**: Rectangular, 0px border radius, uppercase monospace typography.
- **Primary**: Solid phosphor green background (`#00FF66`), pitch black text (`#070A0F`), font weight `700`. Hover state triggers an inverted phosphor edge with `box-shadow: 0 0 12px rgba(0, 255, 102, 0.5)`.
- **Secondary / Ghost**: Transparent background, `1px solid #2E4766`, text `#F0F6FC`. Hover promotes border to `#00E5FF` and text to `#00E5FF`.
- **Destructive**: Dark crimson base (`#2B0B17`), `1px solid #FF0055`, text `#FF0055`. Active trigger prompts terminal confirmation flag `[Y/N]`.
- **Size**: Micro button padding `2px 8px`, standard button `6px 14px`.

### Telemetry HUD Chips & Badges
- **Status Tags**: Zero-radius capsules with bracket wrappers (e.g., `[ DEFCON 2 ]`, `[ MITRE T1059 ]`).
- **Severity Codes**:
  - `CRITICAL`: Background `#FF0055`, text `#FFFFFF`.
  - `ELEVATED`: Background `#FFAA00`, text `#070A0F`.
  - `STABLE`: Background `#00FF66`, text `#070A0F`.
  - `INFO`: Background `#00E5FF`, text `#070A0F`.

### Form Inputs & Terminal Command Prompts
- **Text Inputs**: Flat slate background (`#070A0F`), `1px solid #1B2A3D`, text `#00FF66`, font `JetBrains Mono`. Focus state snaps border to `#00FF66` with a solid block caret (`▋`) animation.
- **Prefix Affordance**: Monospaced terminal prefixes (e.g., `root@c2-node:~#` or `>_`) styled in `#00E5FF`.
- **Select Menus**: Custom sharp-edged native styling with monospaced options and custom chevron indicator `▼`.

### Data Stream Tables (SIEM / Process Monitors)
- **Header**: Sticky `#0B0F17` background with uppercase `label-sm` text in `#4B5B73`. Bottom separator `1px solid #2E4766`.
- **Rows**: Alternating row striping (`#070A0F` and `#0B0F17`). Row hover state produces an inline high-contrast left border highlight (`2px solid #00FF66`).
- **Cells**: Padding `4px 8px`, fixed tabular alignment, instant truncation with ellipsis for raw payloads.

### Command Tiles & Multiplexer Cards
- **Structure**: Continuous header bar with integrated status dots (`■ ■ ■`), monospace window title (`#8B9BB4`), active window badge, and close/minimize actions.
- **Card Body**: `#0B0F17` background with optional scanline overlay and an ambient tactical corner notch.

### CRT Overlay & RF Waveform Visualizers
- Real-time monitors incorporate a CSS scanline gradient mask (`linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)`) with 2px vertical spacing to replicate an authentic raster monitor without degrading legibility.