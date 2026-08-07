# Zorpill Desktop — agent guide

Electron + Vite + React 19 + TypeScript pharmacy management app. This file
exists so future work builds on what's here instead of re-deciding it.
When a decision below has a reason attached, that reason is the thing to
weigh before changing it — not the conclusion itself.

## Stack & structure

- `src/electron/` — main process. `main.ts` (window creation, IPC),
  `preload.cts` (renderer bridge), `util.ts`, `splash.html` (static, not
  part of the Vite/React bundle — see "Splash screen" below).
- `src/ui/` — the React app (Vite root is the project root; `index.html`
  points at `src/ui/main.tsx`).
  - `pages/` — routed screens (`Login`, `PlaceholderPage`).
  - `components/layout/` — `TitleBar`, `Sidebar`, `TopNav`,
    `DashboardLayout`, `WorkspaceSwitcher`, plus `nav-items.ts` (the single
    source of truth for sidebar links, shared between `Sidebar` and the
    route table in `App.tsx`).
  - `components/icons.tsx` — hand-rolled SVGs used only by `Login`
    (predates the lucide-react adoption below; don't add more to it).
  - `context/SidebarContext.tsx` — sidebar collapsed/expanded state,
    lifted out of `Sidebar` because `TitleBar` (a sibling, not a
    descendant) also needs to toggle it.

## Decisions already made — don't re-litigate without reason

**No UI component library (Ant/Chakra/Mantine, etc.).** The look is
custom (specific cream/green/navy palette, hand-built forms), and a
styled kit fights that harder than it helps. If a genuine need for
accessible complex primitives shows up (comboboxes, dialogs), reach for
**Radix UI primitives** (unstyled) before a full kit.

**Icons: lucide-react.** Adopted deliberately to replace hand-rolled SVGs.
`components/icons.tsx` is a pre-existing exception for `Login` only —
don't extend it; new icons anywhere else come from lucide-react.

**Routing: `react-router-dom` with `HashRouter`**, not `BrowserRouter`.
Required because production loads via `loadFile()` → `file://` — a
`BrowserRouter`'s pushState paths don't resolve as real files on reload.
Don't switch to `BrowserRouter` unless the app moves to being served over
http(s).

**No real authentication.** `Login`'s "Sign in" calls `navigate` straight
to `/dashboard` — there is no backend, no credential check. Don't treat
the login flow as a security boundary; it isn't one yet.

**Sidebar nav items are mostly placeholders.** Every item in
`nav-items.ts` routes to a real nested route, but all except "Sales
(POS)" render the generic `PlaceholderPage`. That's intentional (proves
the layout is reusable across sections) — building out a real feature
page means adding a route in `App.tsx`, not "fixing" the placeholder.

**Workspace switcher ≠ branch selector.** `WorkspaceSwitcher` (in the
sidebar) represents which pharmacy business/tenant you belong to.
`TopNav`'s branch button represents which physical location within the
current workspace. Keep these separate; don't merge them.

**Workspace switching is cosmetic.** Clicking a workspace in
`WorkspaceSwitcher` just changes local highlighted state — there's no
multi-tenant backend for it to actually switch. Same for the title bar's
back/forward buttons: simple `navigate(-1)/navigate(1)` pass-through,
always enabled, no tracked history stack. Don't "fix" these into stateful
features unless a real backend/requirement shows up — it was a deliberate
scope call, not an oversight.

**Title bar vs TopNav responsibility split**: search and "AI Assist" live
in `TitleBar` only (dashboard routes only — gated on
`location.pathname.startsWith("/dashboard")`, hidden on `Login` since
there's nothing to search before signing in). They were deliberately
*removed* from `TopNav` to avoid duplicating the same control at two
levels of chrome. `TopNav` keeps: branch selector, online status,
notifications, user block. Don't add a second search box or AI button to
`TopNav`.

**Title bar menu/help are placeholders.** The hamburger menu dropdown
(Preferences / Check for Updates / About Zorpill) and the Help button are
inert — visual scaffolding, not a signal that a menu/help system exists.

## Frameless window / custom title bar

`frame: false` is set on the main window — there is no native OS chrome.
`TitleBar.tsx` is the entire replacement: drag region, menu, sidebar
toggle, back/forward, search, AI Assist, help, and OS-aware window
controls (hand-drawn macOS traffic lights vs. Windows/Linux `− □ ✕`,
switched on `window.electronAPI.platform`).

Things that will break silently if changed carelessly:

- **`-webkit-app-region: drag` / `no-drag` balance.** `.titlebar` is
  `drag`; every interactive child (buttons, inputs, menus) is explicitly
  `no-drag`. Adding a new interactive element to the title bar without
  marking it `no-drag` makes it unclickable (drag intercepts the click).
- **Flex layout needs an explicit right-anchor.** `.titlebar-search` has
  `flex: 1` capped at `max-width: 420px` — once it hits that cap, leftover
  space has nowhere to go unless something absorbs it. `.titlebar-actions`
  has `margin-left: auto` specifically to soak up that slack and pin
  itself (and the window controls after it) to the right edge. If you
  restructure the title bar's children, keep an explicit `margin-left:
  auto` (or equivalent) on whatever should hug the right side — don't
  assume plain flex will do it.
- **`preload.cts`, not `preload.ts`.** The `.cts` extension forces
  CommonJS output (`preload.cjs`) regardless of the project's `"type":
  "module"`. Preload scripts mixing ESM `import` are a known source of
  flakiness in Electron. If you touch the preload script, keep the `.cts`
  extension and update `main.ts`'s path (`dist-electron/preload.cjs`) and
  the `transpile:electron` script together.
- **IPC channel naming**: `titlebar:minimize` / `titlebar:maximize-toggle`
  / `titlebar:close` / `titlebar:is-maximized` / `titlebar:maximized-changed`
  (main → renderer push on native maximize/unmaximize, so the
  maximize/restore icon stays correct even if the state changes via an OS
  gesture rather than the button). Keep this prefix if you add more
  window-chrome IPC.
- **Window handlers resolve via `BrowserWindow.fromWebContents(event.sender)`**,
  not a captured `mainWindow` variable — keep it that way if more windows
  ever need the same handlers.

## Splash screen

`src/electron/splash.html` is a static, self-contained file (illustration
inlined as base64) — deliberately outside the Vite/React build so it can
render before the bundle is ready. It is **not** compiled by `tsc`; the
`transpile:electron` script copies it into `dist-electron/` as a separate
step. If you rename or move it, update that copy step in `package.json`.

## Brand palette / theming convention

There is no single global theme file. Each major surface defines its own
CSS custom properties scoped to its own root class, following the pattern
already in `Login.css` (`.login-page { --green: #4f7d52; ... }`) and
`DashboardLayout.css` (`.dashboard-layout { ... }`, same values). Colors:
cream `#f5f2e9`, page background `#eeebe0`, ink (headings) `#1c2b3a`,
muted (secondary text) `#6b7280`, green (brand/accent) `#4f7d52`, green-dark
`#3e6641`, border `#e7e2d3`.

`TitleBar.css` renders at the app root — a sibling of `.login-page` and
`.dashboard-layout`, not a descendant of either — so it can't inherit
their scoped tokens. Its `var(--x, #hexfallback)` calls carry hardcoded
fallbacks matching the same palette. If the palette ever changes, grep for
all three definitions (`Login.css`, `DashboardLayout.css`, the fallbacks
in `TitleBar.css`) — there is no single source of truth yet.

`Login` also has its own light/dark toggle (`--green` etc. redefined under
`.login-page--dark`), independent of the OS theme. Nothing else in the app
has a dark mode; don't assume `Login`'s toggle implies a global one.

## Before adding a dependency or new architectural pattern

This app started from the Vite React+TS template and has been built up
page by page with explicit sign-off on each non-obvious choice (UI
library, icon library, routing strategy, IPC design, layout ownership).
If you're about to add a UI/component library, state library, or backend
integration, or restructure how pages compose the layout — surface the
tradeoff and ask rather than assuming, the same way those choices were
made in the first place.
