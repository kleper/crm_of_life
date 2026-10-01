---
name: CRM de la Vida
description: A distraction-free, low-cognitive-load holistic CRM with strict flat design and multi-tenant isolation
colors:
  primary: "#4f46e5"
  primary-hover: "#4338ca"
  primary-dark: "#0f172a"
  primary-dark-hover: "#1e293b"
  secondary: "#2563eb"
  secondary-hover: "#1d4ed8"
  success: "#10b981"
  success-surface: "#d1fae5"
  warning: "#f59e0b"
  warning-surface: "#fef3c7"
  danger: "#dc2626"
  danger-hover: "#b91c1c"
  danger-surface: "#fee2e2"
  canvas: "#f8fafc"
  surface: "#ffffff"
  border: "#e2e8f0"
  border-strong: "#cbd5e1"
  text-primary: "#0f172a"
  text-secondary: "#64748b"
  text-muted: "#94a3b8"
typography:
  display:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.05em"
rounded:
  none: "0px"
  sm: "0px"
  md: "0px"
  lg: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  touch: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "8px 24px"
    height: "{spacing.touch}"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark-hover}"
  button-accent:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "8px 24px"
    height: "{spacing.touch}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "8px 24px"
    height: "{spacing.touch}"
  card-default:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "{spacing.touch}"
---

# Design System: CRM de la Vida

## Overview

**Creative North Star: "The Precision Instrument"**

CRM de la Vida is engineered as a high-clarity utilitarian cockpit. It is calibrated for calm focus, cognitive ease, and daily execution momentum across personal habits, professional projects, relationships, and financial records. Visual noise is treated as operational friction. Every boundary is honest, structural, and unadorned.

The visual system is intentionally grounded in strict flat design and high-contrast light surfaces to support neurodivergent accessibility. By eliminating ambient shadows, heavy gradients, and rounded borders, the interface minimizes sensory overload and allows the user's attention to rest entirely on the task at hand. The system is planar, predictable, and tactile.

**Key Characteristics:**
- Uncompromising flat geometry (`rounded-none` across every surface, control, and container).
- Calibrated, high-contrast light palette (`bg-slate-50` canvas, crisp white cards, solid slate borders).
- Deliberate semantic color allocation (Cadence Indigo for interaction, Momentum Emerald for streaks, System Amber for admin/points).
- Active empty states ensuring no view ever feels abandoned or broken.
- Generous touch targets (minimum 44px) built mobile-first.

## Colors

The color system pairs a tranquil slate-and-white architectural canvas with precise, saturated status signals.

### Primary
- **Cadence Indigo** (#4f46e5): Used for active navigation links, focal calls-to-action, focus rings, and primary interactive highlights.
- **Obsidian Slate** (#0f172a): Used for high-contrast primary buttons, major headings, and primary text. Delivers grounded authority.

### Secondary
- **Momentum Emerald** (#10b981): Used for execution streaks, completed statuses, positive balances, and achievement toasts.
- **Action Blue** (#2563eb): Used for secondary focal buttons and informational accents.

### Tertiary
- **System Amber** (#f59e0b): Reserved for gamification points, level alerts, and the administrative workspace mode banner (`amber-100` / `amber-800`).
- **Signal Red** (#dc2626): Used strictly for destructive actions, validation errors, and overdue warnings.

### Neutral
- **Clarity Slate** (#f8fafc): Application canvas background (`--background`). Prevents glare while maintaining a clean, open atmosphere.
- **Pure Surface** (#ffffff): Card, modal, input, and sheet backgrounds.
- **Structural Border** (#e2e8f0): 1px structural container and divider stroke.
- **Input Border** (#cbd5e1): Resting stroke for form inputs and interactive boundaries.
- **Subtext Slate** (#64748b): Secondary metadata, timestamps, and supporting microcopy.

### Named Rules
**The Rarity Rule.** Primary accent colors (Cadence Indigo and Momentum Emerald) are reserved strictly for interactive state and completion signals. They never coat large passive background surfaces.

**The Light Horizon Rule.** Content surfaces must remain strictly within the slate-50 to white spectrum. Absolute dark themes on content surfaces are prohibited to maintain neurodivergent calm and readability.

## Typography

**Display Font:** Geist Sans (fallback: Arial, Helvetica, sans-serif)  
**Body Font:** Geist Sans (fallback: Arial, Helvetica, sans-serif)  
**Label/Mono Font:** Geist Mono (fallback: monospace)

**Character:** Technical, neutral, and exceptionally legible at dense information densities. Geist's geometric proportions maintain legibility across mobile viewports and structured tables.

### Hierarchy
- **Display** (Bold 700, 1.875rem / 30px, line-height 1.2, letter-spacing -0.025em): Page-level titles in page headers and major dashboard summaries.
- **Headline** (Bold 700, 1.25rem / 20px, line-height 1.3): Card titles, modal headers, and section groupings.
- **Title** (Semi-bold 600, 1.125rem / 18px, line-height 1.4): Sub-headers, task row names, and modal subsection labels.
- **Body** (Regular 400, 0.875rem / 14px, line-height 1.5, max-width 65ch): Descriptive paragraphs, form descriptions, and note content.
- **Label** (Bold 700, 0.75rem / 12px or 10px, uppercase, letter-spacing 0.05em): Badges, table column headers, status tags, and navigation icons.

### Named Rules
**The Uppercase Meta Rule.** System badges, status pills, and organization context indicators are set in bold uppercase with expanded letter-spacing (0.05em) to differentiate metadata from user content at a glance.

## Layout

The spatial model is mobile-first, fluidly scaling from compact 320px screens up to desktop dashboards without structural shifts.

- **Grid & Rhythm:** Base 4px/8px modular rhythm (4px, 8px, 12px, 16px, 24px, 32px, 48px).
- **Responsive Breakpoints:** 320px (minimum mobile), 375px (standard mobile), 640px (`sm:`), 768px (`md:` tablet), 1024px (`lg:` desktop).
- **Mobile Density:** Mobile screens under 640px default to single-column vertical stacks (`grid-cols-1`). Two-column grids are permitted only for concise numeric metric cards.
- **Touch Target Floor:** All interactive controls, inputs, and icon triggers maintain a minimum height and hit area of 44px (`min-h-[44px]`).
- **Safe Area Insets:** The bottom navigation bar accounts for device notches and home indicators via `env(safe-area-inset-bottom)`.
- **Overflow Isolation:** The root layout enforces `overflow-x-hidden`. Horizontal panning (Kanban columns, wide financial tables) is strictly contained within dedicated component containers with `overflow-x-auto`.

## Elevation & Depth

CRM de la Vida rejects simulated lighting, floating dropshadows, and diffused blurs for surface cards. Depth is expressed purely through tonal contrast and crisp 1px structural strokes.

- **Resting Depth:** Flat cards with `bg-white` over `bg-slate-50` separated by a 1px border of `#e2e8f0`.
- **Modal Elevation:** Modals render with a crisp 1px border over an opaque backdrop overlay (`bg-slate-900/60` with `backdrop-blur-sm`).
- **State Feedback:** Hover and focus states are indicated through border color shifts and background tinting, not shadow bloom.

### Named Rules
**The Flat-Plane Rule.** Surfaces are strictly planar. Ambient drop shadows are forbidden. Depth is defined by borders and background contrast alone.

## Shapes

The geometry of CRM de la Vida is strictly orthogonal.

- **Corner Radius:** 0px (`rounded-none`) applied to every element without exception.
- **Global Override:** Enforced globally in CSS via `* { border-radius: 0px !important; }`.
- **Borders:** Consistent 1px solid borders (`border`, `border-slate-200`, `border-slate-300`).

### Named Rules
**The Zero-Radius Rule.** Every container, button, card, modal, badge, avatar, and input has exactly 0px border radius across all viewports.

## Components

### Buttons
- **Shape:** Sharp right angles (0px radius).
- **Primary:** Obsidian Slate background (`#0f172a`), white text, 44px minimum height (`min-h-[44px]`), padding 8px 24px (`px-6 py-2`). Hover: `#1e293b`.
- **Accent:** Cadence Indigo background (`#4f46e5`), white text. Used for main affirmative creation flows.
- **Secondary / Outline:** White background, Slate 700 text, 1px border `#cbd5e1`. Hover: `#f8fafc`.
- **Destructive:** Signal Red background (`#dc2626`), white text. Hover: `#b91c1c`.
- **Focus:** 2px high-contrast focus ring with 2px offset (`focus-visible:ring-2 focus-visible:ring-offset-2`).

### Chips & Badges
- **Style:** Compact uppercase badges with bold tracking (`text-[10px]` or `text-xs`, font-bold, tracking-wider).
- **Variants:**
  - Default: `#f1f5f9` background, `#475569` text.
  - Success: `#d1fae5` background, `#047857` text.
  - Warning: `#fef3c7` background, `#b45309` text.
  - Danger: `#fee2e2` background, `#b91c1c` text.
  - Info: `#eff6ff` background, `#2563eb` text, 1px border `#dbeafe`.

### Cards & Containers
- **Corner Style:** Sharp 0px radius.
- **Background:** Crisp white (`#ffffff`).
- **Border:** 1px solid `#e2e8f0` (`border-slate-200`).
- **Internal Padding:** 16px mobile (`p-4`), 24px desktop (`md:p-6`).

### Inputs & Fields
- **Style:** White background, 1px solid border `#cbd5e1`, 44px minimum height (`min-h-[44px]`), padding 10px 12px.
- **Focus:** Focus ring in Cadence Indigo (`focus:ring-2 focus:ring-indigo-500 focus:border-transparent`).
- **Error:** 1px border `#ef4444`, red validation helper text below field.

### Navigation
- **Mobile Top Bar:** Fixed 56px (`h-14`) white header with logo, notification bell indicator, and hamburger trigger.
- **Mobile Active Org Bar:** Fixed 36px sub-header displaying current tenant context.
- **Mobile Bottom Bar:** Fixed 64px (`h-16`) bottom tab bar with 5 primary destinations (Dashboard, Tasks, Contacts, Finance, Kudos). Active tab features top border accent.
- **Desktop Sidebar:** Clean vertical navigation panel with user profile footer and organization selector.

### Signature Components
- **ActiveOrgIndicator:** Omnipresent tenant context switcher in navigation, clearly communicating the active organization boundary.
- **EmptyState:** Centered action card with icon, headline, helpful description, and immediate affirmative CTA button ("Crear primera tarea").

## Do's and Don'ts

### Do:
- **Do** use `rounded-none` on every component, card, button, and badge without exception.
- **Do** ensure all clickable and interactive elements have a minimum height of 44px (`min-h-[44px]`).
- **Do** verify interfaces at 320px viewport width to guarantee no horizontal window overflow.
- **Do** provide an `<EmptyState>` with a clear call-to-action for every empty data list.
- **Do** use uppercase bold text with expanded tracking (`tracking-wider`) on badges and meta labels.
- **Do** keep content backgrounds on the slate-50 to white spectrum (`bg-slate-50`, `bg-white`).

### Don't:
- **Don't** use border radius of any value (`rounded-sm`, `rounded-md`, `rounded-full` are strictly prohibited).
- **Don't** use ambient blur drop shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl`) on resting content cards.
- **Don't** create dark-mode content surfaces (`bg-slate-900`, `bg-black`) for content areas.
- **Don't** rely on color alone to convey state; pair colors with icons or descriptive text.
- **Don't** allow full-page horizontal scrolling; contain tabular or Kanban scrolling within dedicated containers (`overflow-x-auto`).
