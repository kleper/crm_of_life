# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Primary: Multi-context individuals, founders, and small teams managing both personal life routines and organizational business operations (personal CRM, habits/tasks, finances, and team collaboration).
- Roles: `SUPER_ADMIN` (global tenant & org provisioning), `TENANT_ADMIN` (workspace management & team invitations), `USER` (collaborators executing tasks, logging contacts, transactions, and kudos).

## Product Purpose
- An all-in-one personal and organizational CRM ("CRM de la Vida") that unifies daily tasks, contact relationship management, and financial records with gamification and peer recognition.
- Success means lowering cognitive load, eliminating distraction, maintaining execution streaks, and providing effortless context switching across personal and professional spaces without data leakage.

## Positioning
- A distraction-free, low-cognitive-load holistic CRM combining life, tasks, relationships, and finances with strict multi-tenant isolation, neurodivergent accessibility, and gamified momentum.
- Unlike fragmented task managers or heavyweight enterprise CRMs, CRM de la Vida delivers a unified cockpit with strict flat design (`rounded-none`), full data isolation per organization, and offline PWA capabilities.

## Operating Context
- Environments: Mobile and desktop browsers, installable Progressive Web App (PWA) via Serwist service workers.
- Daily Rituals:
  - Checking the Kanban board and recurring task cadences.
  - Tracking interactions with key personal and business contacts to prevent relationships from going cold.
  - Logging income and expense transactions categorized by personal/business budgets.
  - Sending peer recognition (kudos) and reviewing daily gamification stats (streaks, points, badges).
  - Receiving push notifications for time-based reminders and scheduled follow-ups.

## Capabilities and Constraints
- Multi-Tenant Security: Every piece of user data (tasks, contacts, transactions, kudos, categories) is strictly scoped to an `organizationId` derived securely from the server JWT session, never from client input.
- Offline-First PWA: Background sync with IndexedDB queue, push notifications (VAPID), service worker caching.
- Architectural Constraints:
  - Next.js 15+ App Router with TypeScript (strict).
  - PostgreSQL 18 with Prisma ORM.
  - Server Actions (`"use server"`) for mutations, terminating with `revalidatePath()`. No REST endpoints for standard CRUD.
  - Shared UI components from `src/components/ui/` with strict `rounded-none`.

## Brand Commitments
- Name: CRM de la Vida.
- Tone of Voice: Focused, calm, empowering, and respectful of attention. Free of artificial urgency, fluff, or visual noise.
- Visual Palette & Identity: Clean slate/white surfaces (`bg-slate-50`, `bg-white`, `border-slate-200`), primary indigo accents (`indigo-600`), emerald successes (`emerald-500`), and warm amber gamification highlights (`amber-400`). Admin surfaces strictly distinct (`amber-100` / `amber-800`).

## Evidence on Hand
- Full working codebase in `src/` with complete schemas in `prisma/schema.prisma`.
- Formalized design and architecture guardrails in `AGENTS.md` and `CONVENTIONS.md`.
- Active dev server on `http://localhost:3000`.

## Product Principles
1. Low Cognitive Load First: Clean, distraction-free surfaces with strict flat aesthetics (`rounded-none`) and zero unnecessary visual clutter.
2. Uncompromising Tenant Isolation: Absolute separation between organizations at the server level; switching organizations always invalidates and refreshes context cleanly.
3. Complete Execution Loop: Every state (especially empty states) offers an active call-to-action; lists never look broken or ambiguous.
4. Holistic Life & Work Balance: Personal habits, financial discipline, professional tasks, and relational health reinforce one another through positive gamification.

## Accessibility & Inclusion
- Designed with neurodivergent accessibility at the forefront: flat design, clear borders, high text contrast (WCAG AA minimum), and light palette to reduce sensory overload and visual fatigue.
- Mobile-first responsive baseline: explicitly tested from 320px up to 1024px+ without horizontal page overflow, accounting for device safe areas (`env(safe-area-inset-bottom)`).
