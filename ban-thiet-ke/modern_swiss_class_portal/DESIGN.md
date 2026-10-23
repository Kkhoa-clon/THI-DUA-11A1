---
name: Modern Swiss Class Portal
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#ad0033'
  on-tertiary: '#ffffff'
  tertiary-container: '#d22348'
  on-tertiary-container: '#ffecec'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
  stat-metric:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system blends Swiss-style modernism with subtle glassmorphic depth, engineered specifically for the dynamic mobile workflow of high school class management (Lớp 11A1). It prioritizes clarity, structural order, and energetic yet disciplined academic competition.

- **Personality:** Methodical, encouraging, trustworthy, and modern. It balances academic rigor with youthful vibrancy.
- **Visual Style:** Modern Swiss-Minimalist with frosted glass accents. Characterized by strict typographic hierarchy, generous whitespace, pristine white card containers, hairline dividers, and controlled translucency on floating contextual layers.
- **Emotional Response:** Inspires accountability, community pride, and motivation among students while providing teachers with immediate, friction-free administrative clarity.

## Colors

The palette establishes an orderly, clean academic canvas with decisive functional indicators.

- **Primary Canvas (`#F8FAFC`):** A bright, cool slate background keeping the interface light and distraction-free.
- **Card & Surface (`#FFFFFF`):** Pure white container surfaces bounded by crisp hairline borders (`#E2E8F0`).
- **Primary Blue (`#2563EB` & `#1D4ED8`):** Anchors navigation, leaderboards, and primary calls-to-action. Reflects school authority and focus.
- **Accent Green (`#10B981`):** Applied exclusively to positive metrics, badges, score increments, and commendation logs.
- **Soft Red (`#F43F5E`):** Reserved for penalties, discipline deductions, urgent notices, and missed tasks. Never harsh, but clearly differentiated.
- **Neutral Slate Range:** `#0F172A` (Headings/Emphasized data), `#334155` (Body copy), `#64748B` (Labels and metadata), and `#F1F5F9` (Subtle track indicators/chip backgrounds).

## Typography

Typography balances Swiss geometric precision with high legibility across mobile viewports:

- **Display & Numerical Hierarchy:** `Space Grotesk` drives all student rankings, numerical points, header banners, and rank metrics. All point counters and dates strictly enforce `font-variant-numeric: tabular-nums` to eliminate jitter during real-time score updates.
- **Interface & Reading:** `Manrope` governs descriptive text, student notes, behavior logs, and UI forms. Its geometric clarity guarantees optimal legibility at compact mobile scales.
- **Data Rhythm:** Large stats rely on `stat-metric` paired with high-contrast neutral-to-accent styling (`+50 pts` in `#10B981` / `-10 pts` in `#F43F5E`).

## Layout & Spacing

This layout is mobile-first, engineered for thumb reachability and fast scanning during rapid classroom logging.

- **Layout Structure:** Single-column fluid grid on mobile devices bounded by a minimum screen margin of `1rem` (16px) and an inner component gutter of `1rem`. Content centers within a maximum boundary of `480px` on wider displays or tablets to preserve mobile ergonomic pacing.
- **Rhythm & Safe Areas:** Strict 4px/8px incremental rhythm. Mobile headers and sticky bottom floating bars dynamically adapt to hardware safe areas (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
- **Density:** High density for list items and data rows (`space-sm` to `space-md` inner padding), contrasting with open structural separation (`space-xl`) between section card clusters.

## Elevation & Depth

Visual hierarchy combines Swiss precision borders with subtle glassmorphic elevation layers:

- **Surface Base:** Flat cards sit on `#FFFFFF` with a crisp 1px stroke (`border: 1px solid #E2E8F0`) and an ultra-diffused drop shadow: `0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)`.
- **Active Card & Ranking Highlights:** Top-ranked student items or active selected cards receive an ambient primary tint: `box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.08), 0 8px 10px -6px rgba(37, 99, 235, 0.04)`.
- **Glassmorphic Floating Bars & Nav:** Sticky bottom navigation, floating quick-action score loggers, and sheet headers utilize glassmorphism: `background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px) saturate(180%); border-top: 1px solid rgba(226, 232, 240, 0.8)`.
- **Modals & Drawers:** High-elevation overlays feature an ambient neutral shadow `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)` combined with a background scrim of `rgba(15, 23, 42, 0.3)`.

## Shapes

The interface balances sharp Swiss structural boundaries with soft, approachable interaction targets:

- **Cards & Sheets:** Rounded corners at `rounded-lg` (16px) convey a modern and friendly mobile app feel.
- **Buttons & Field Inputs:** Styled with `rounded` (12px to 14px), providing generous, tap-friendly targets for both students and teachers.
- **Status Pills & Score Badges:** Fully circular (`rounded-full` / 9999px) for point differentials (`+10`, `-5`), rank tags, and individual student avatars.

## Components

### Buttons
- **Primary (Record Action / Submit):** Solid `#2563EB` fill, `#FFFFFF` text, height of 48px, corner radius of 12px, font weight 600. Active state scales subtly (`scale: 0.98`) with a transition duration of 150ms.
- **Commendation Button (+):** Soft green surface (`#ECFDF5`), `#059669` label, `#10B981` border tint. Emits a clean micro-scale interaction on tap.
- **Penalty Button (-):** Soft red surface (`#FFF1F2`), `#E11D48` label, `#F43F5E` border tint.
- **Secondary / Ghost:** Transparent background, `#334155` text, 1px `#E2E8F0` border.

### Chips & Score Badges
- **Point Chips:** Pill-shaped capsules with monospaced numbers.
  - Plus: Green background tint (`#DCFCE7`), text `#15803D`, icon prefix `+`.
  - Minus: Red background tint (`#FFE4E6`), text `#BE123C`, icon prefix `-`.
- **Category Filter Chips (e.g., "Nề nếp", "Học tập", "Phong trào"):** Default `#F1F5F9` surface with `#475569` text; selected state switches to `#2563EB` with `#FFFFFF` text.

### Student & Team Ranking Cards
- Pure `#FFFFFF` surface, 1px `#E2E8F0` hairline border, 16px corner radius.
- Left column: Rank placement indicator (Top 1-3 highlighted with subtle metallic or vibrant badges).
- Center: Student avatar (40px circular), student name (`Space Grotesk` 16px SemiBold), and roll ID (`Manrope` 12px).
- Right column: Total points displayed in bold tabular figures (`stat-metric` or `headline-md`).

### Activity & Incident Lists
- Edge-to-edge internal division using `#F1F5F9` lines.
- Left icon indicators indicate event type: Green check for academic achievements, Red flag for uniform/attendance violations.
- Right side displays relative timestamp (`10m ago`, `Hôm nay`) in `#64748B`.

### Form & Score Input Fields
- Height 48px, background `#FFFFFF`, border 1px solid `#CBD5E1`, corner radius 12px.
- Focus ring: 2px solid `#2563EB` with `box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12)`.
- Numeric Stepper: Large direct-entry field flanked by quick increment buttons (`+1`, `+5`, `+10`).

### Floating Quick-Logger (Mobile FAB & Drawer)
- Fixed bottom center with 16px screen clearance.
- Frosted glass capsule housing a prominent "Chấm điểm thi đua" button with `#2563EB` gradient and ambient glow.
- Opens a bottom sheet with safe-area padding and a clean grab handle (`4px x 36px`, `#CBD5E1`).