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
  - `pages/` — routed screens (`Login`, `PlaceholderPage`, `Sales`,
    `SalesHistory`, `Inventory`, `AddProduct`, `ViewProducts`,
    `StockLevels`, `StockAdjustment`), each its own `Name/index.tsx` +
    `index.css` folder (see "Component file layout" below). `Sales` and
    `SalesHistory` are real, built-out features, not placeholders — see
    "Point of Sale" below.
  - `components/layout/` — `TitleBar`, `Sidebar`, `DashboardLayout`,
    `WorkspaceSwitcher`, `BranchSelector`, `UserMenu`, plus `nav-items.ts`
    (the single source of truth for sidebar links, shared between
    `Sidebar` and the route table in `App.tsx`). There is no `TopNav`
    anymore — see below.
  - `components/pos/` — everything the `Sales` (POS) and `SalesHistory`
    pages are built from: table/summary/search/modal components plus
    `pos-data.ts`, `sales-history-data.ts`, `drug-interactions-data.ts`,
    and `lost-sales-data.ts` for dummy data. See "Point of Sale" below.
  - `components/reports/` — `ReportShell` (the shared shell + `.report-*`
    style primitives + `useReportPeriod`/`useToast`/`StatTile`/
    `ChartTooltip`) and `reports-data.ts`. See "Reports" below.
  - `components/icons.tsx` — hand-rolled SVGs used only by `Login`
    (predates the lucide-react adoption below; don't add more to it). Not
    yet moved to the folder convention below since it isn't a single
    component's JSX/CSS pair.
  - `components/common/` — shared components with no feature-specific
    home: `Tooltip` (the app's one tooltip primitive — see "Custom
    tooltip" below before touching hover labels anywhere) and
    `Accordion` (used by `AddProduct`).
  - `context/SidebarContext.tsx` — sidebar collapsed/expanded state,
    lifted out of `Sidebar` because `TitleBar` (a sibling, not a
    descendant) also needs to toggle it. `Sales` also reads it now, to
    collapse `SaleSummaryPanel` when the sidebar is expanded — see
    "Point of Sale" below.
  - `context/AiAssistContext.tsx` — same sibling-communication problem as
    `SidebarContext` (something outside `TitleBar` needs to control
    `AiAssistDrawer`, which renders inside it), solved the same way. See
    "Point of Sale" below for what actually opens it and why.
  - `context/ThemeContext.tsx` — app-wide light/dark theme. Sets
    `document.documentElement.dataset.theme`, which drives the global
    `:root` / `:root[data-theme="dark"]` token blocks in `index.css` (see
    "Brand palette" below). The only UI for it is the sun/moon toggle in
    `TitleBar`.

## Component file layout

A component's or page's JSX and CSS live together in their own folder
rather than as flat sibling files: `Name/index.tsx` + `Name/index.css`,
imported from outside as `"./Name"` (folder resolution) — not
`"./Name/Name"`. This is applied throughout `components/pos/`,
`components/layout/`, `components/common/`, and `pages/` — every
component and every routed page follows it. New components/pages should
follow it too. Files that aren't a single component's JSX/CSS pair
(`pos-data.ts` and friends, `nav-items.ts`, `App.tsx`) stay flat — this
convention is specifically for the JSX+CSS pair pattern, not every file
in the tree. `components/icons.tsx` is the one deliberate holdout among
component-ish files (see the note next to it above) — it's a bag of
hand-rolled SVGs, not a single component, so it doesn't fit the folder
shape.

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

**Some sidebar nav items are still placeholders.** Every item in
`nav-items.ts` routes to a real nested route; the ones without a built-out
section ("Users & Roles", "Settings") render the generic
`PlaceholderPage`. That's intentional (it proves the layout is reusable
across sections) — building out a real feature page means adding a route
in `App.tsx`, not "fixing" the placeholder. Sales (POS), Inventory,
Purchases, Customers & Care and Reports are genuinely built out; "Point of
Sale" and "Reports" below are the templates to follow when a next section
graduates.

**Workspace switcher ≠ branch selector.** `WorkspaceSwitcher` represents
which pharmacy business/tenant you belong to; `BranchSelector` (rendered
right below it in `Sidebar`) represents which physical location within
the current workspace. They're stacked deliberately — org-level switcher
above, location-level switcher below. Keep these separate; don't merge
them into one control.

**Workspace/branch switching is cosmetic.** Both `WorkspaceSwitcher` and
`BranchSelector` are dropdowns over hardcoded dummy arrays
(`WORKSPACES`/`BRANCHES` at the top of each file) — clicking an item just
changes local highlighted state, closes the menu, and does nothing else.
There's no multi-tenant/multi-branch backend for either to actually
switch. Same deal for the title bar's back/forward buttons: simple
`navigate(-1)/navigate(1)` pass-through, always enabled, no tracked
history stack. Don't "fix" any of these into stateful features unless a
real backend/requirement shows up — deliberate scope calls, not
oversights.

**There is no `TopNav` — everything lives in `TitleBar` or `Sidebar`
now.** The app went through a `TopNav` phase (branch selector, online
status, notifications, user block) that got dissolved once the title bar
took over search/AI/theme and the sidebar took over the user menu, leaving
`TopNav` too sparse to justify its own row. Where things ended up:
  - `TitleBar` (dashboard-gated, `isDashboard`): search, AI Assist, online
    status, notification bell.
  - `TitleBar` (ungated, works on `Login` too): menu, theme toggle, help,
    window controls.
  - `Sidebar`: `WorkspaceSwitcher`, `BranchSelector`, nav links, Quick
    Sale, `UserMenu`.
Don't recreate a TopNav-style horizontal bar under the title bar — if
something needs dashboard-only chrome, it belongs in one of the two
places above.

**Title bar menu is a placeholder; Help, Notifications, and AI Assist are
not (UI-wise).** The hamburger menu dropdown (Preferences / Check for
Updates / About Zorpill) is still inert scaffolding. `HelpModal` (opened
from the Help button), `NotificationsMenu` (the bell, in
`titlebar-actions`), and `AiAssistDrawer` (opened from the "AI Assist"
button) are fully-built UI with no real backend behind them:
  - `HelpModal` mirrors Slack's Help panel — hardcoded
    `DISCOVER_CARDS`/`HELP_TOPICS` in `HelpModal.tsx`.
  - `NotificationsMenu` mirrors Slack's Activity dropdown, adapted to
    pharmacy-relevant dummy events (stock alerts, sales, purchase
    orders) instead of chat/mentions — hardcoded `NOTIFICATIONS` array.
    Its "Unreads" toggle does real local filtering of that array — the
    one exception to "cosmetic only" in this group, since filtering a
    hardcoded list client-side needed no backend to implement honestly.
  - `AiAssistDrawer` is an original design (no reference screenshot was
    given for it) — a right-side slide-over below the title bar, welcome
    message bubble, hardcoded `SUGGESTIONS` prompts, and a text input.
    The input and suggestion buttons still don't do anything — that part
    is unchanged. What *did* change: the drawer can now also be opened
    pre-loaded with a real (simulated) answer from elsewhere in the app
    — see "Point of Sale" below for how and why. Typing your own message
    still goes nowhere; only the seeded-exchange path produces content.
None of these three are "coming soon" placeholders like the hamburger
menu — they're deliberately complete UI waiting on real data/logic, not
signals that more UI work is needed before they're usable.

## Frameless window / custom title bar

`frame: false` is set on the main window — there is no native OS chrome.
`TitleBar.tsx` is the entire replacement: drag region, menu, sidebar
toggle, back/forward, search, online status, notifications, AI Assist,
theme toggle, help, and OS-aware window controls (hand-drawn macOS
traffic lights vs. Windows/Linux `− □ ✕`, switched on
`window.electronAPI.platform`). `HelpModal` and `AiAssistDrawer` render
as children of `TitleBar` but are `position: fixed` overlays that
visually cover far more than the title bar strip — see the app-region
note below before assuming DOM nesting matches visual placement.

`AiAssistDrawer` hardcodes `top: 44px` to sit below the title bar rather
than covering it — that's the same number as `.titlebar`'s `height: 44px`
in `TitleBar.css`, duplicated because there's no shared layout-constant
file yet. If the title bar's height ever changes, grep for `44px` in
`AiAssistDrawer.css` too.

Things that will break silently if changed carelessly:

- **`-webkit-app-region: drag` / `no-drag` balance.** `.titlebar` is
  `drag`; every interactive child (buttons, inputs, menus) is explicitly
  `no-drag`. Adding a new interactive element to the title bar without
  marking it `no-drag` makes it unclickable (drag intercepts the click).
  This applies even to `position: fixed` overlays that visually escape the
  title bar's box — `app-region` inherits down the *DOM* tree, not by
  screen position, so `HelpModal`'s backdrop and `AiAssistDrawer`'s panel
  (both rendered as children of `TitleBar`) each need their own explicit
  `no-drag`, even though neither is confined to the title bar strip
  visually.
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
  ever need the same handlers. This stopped being theoretical: the Sales
  History window (see "Point of Sale" below) reuses these same
  `titlebar:*` handlers for free. The maximize/unmaximize push-event
  wiring (`win.on("maximize"/"unmaximize", ...)`) is factored into a
  `wireWindowChrome(win)` helper in `main.ts` for the same reason — call
  it for any new `BrowserWindow` rather than repeating the two `.on()`
  calls inline.

## Point of Sale (Sales page + Sales History window)

`Sales` (routed at `/dashboard`, the "Sales (POS)" nav item) is the one
fully-built-out feature page in the app, following a UI design reference
the user supplied, then reworked over several decluttering passes. Like
everything else in this app, **it's all local React state — no backend,
nothing persists across a restart.** Dummy data lives in
`components/pos/pos-data.ts` (`CATALOG`, `CUSTOMERS`, `STAFF`,
`INITIAL_PARKED`, `TODAY_STATS`), `components/pos/sales-history-data.ts`
(`SALES_HISTORY`), `components/pos/drug-interactions-data.ts`
(`DRUG_INTERACTIONS`), and `components/pos/lost-sales-data.ts`
(`LOST_SALES`) — the latter three are deterministically generated (a
seeded pseudo-random spread), not `Math.random()`, so each dataset is
stable across renders/reloads instead of reshuffling.

**Layout, top to bottom:**
- `SalesActionPills` — New Sale / Hold Sale / Sales History. These
  replaced an earlier `ParkedStrip` chip row entirely (deleted, not kept
  around).
- Left column: `ProductSearch` (compact bar, results as an absolute-
  positioned overlay dropdown that only appears while typing) above
  `SaleTable`.
- Right column: `SaleSummaryPanel`.
- `StatsDrawer` — collapsible daily-totals bar along the bottom, spans
  both columns.

**`SaleTable` is the single source of truth for what's on the sale —
`SaleSummaryPanel` never lists line items.** This split is the result of
two rounds of user feedback: the first build had a table on the left
*and* a cart list on the right both showing the same lines (plus a
separate "Sale totals" card duplicating the cart's own totals, plus qty
adjustable in three different places) — genuinely too cluttered. The fix
was **not** "pick one panel and put everything in it" but **give each
panel a distinct, non-overlapping job**: `SaleTable` owns the items
(select a row, `+`/`−`/delete rail, click a price cell to edit it
inline — this is the one place per-line price override happens, there is
no separate line-editor panel anymore), `SaleSummaryPanel` owns
everything else about the sale as a whole (Customer/Sale date/Served
by/Invoice no, Subtotal/Discount/VAT/Total, Checkout). If you're tempted
to add item rendering back into `SaleSummaryPanel` "for convenience,"
don't — that's the exact duplication that got removed. `ProductSearch`
reverted from an earlier "persistent full-catalog browser" design back
to the compact overlay-dropdown style specifically to free up vertical
space in the left column for `SaleTable`; the two designs are mutually
exclusive because both want the same flex space.

**Modals: `CheckoutModal`, `DiscountModal`, `AddCustomerModal`.** All
three are backdrop-centered overlays, but they use two different mount
patterns — don't homogenize them without re-reading this:
- `CheckoutModal` and `AddCustomerModal` are **always mounted**, take an
  `open` boolean, and `return null` when closed. This works because
  neither syncs incoming props into local draft state on open.
- `DiscountModal` is **conditionally rendered by its parent**
  (`{discountModalOpen && <DiscountModal .../>}`) and has *no* `open`
  prop at all. It needs local draft state (`draftMode`/`draftValue`) so
  Cancel/Escape can discard edits without committing them, and the only
  React-blessed way to initialize that draft state from the current
  `discountMode`/`discountInput` props on every open is a fresh mount —
  syncing it via a `useEffect(() => setDraftX(x), [open])` instead trips
  the `react-hooks/set-state-in-effect` lint rule (setState synchronously
  in an effect body). If a future modal needs "local draft state seeded
  from props, discardable on cancel," copy `DiscountModal`'s
  conditional-mount pattern, not `CheckoutModal`'s `open`-prop one.

**Held Sale is a view toggle, not a route.** Clicking the "Hold Sale"
pill flips `Sales`'s local `view` state between `"sale"` and `"held"`,
swapping the entire main-grid for `HeldSalesView` (a card grid) in
place — it doesn't navigate anywhere. `ParkedSale` entries carry a real
`lines: SaleLine[]` snapshot (plus `customer`/`servedBy`/`heldAt`), so
"Resume" actually restores the sale (renumbers line keys off the current
`seq` counter to avoid colliding with new lines added since) rather than
just showing a toast. There used to be a `"Draft"` kind alongside
`"Hold"` — it was removed outright (not deprecated) once the "Give
discount" button replaced the Draft button in `SaleSummaryPanel`: Draft
had no viewer anywhere in the UI even before that, so keeping the `kind`
field around would've been dead code with no path to reach it.

**Sales History opens a real second `BrowserWindow`** — this was an
explicit ask (not the default "just make it a bigger modal" choice), and
it's the first time this app has had more than one window. How it works:
`main.ts`'s `openSalesHistoryWindow()` is a singleton (focuses the
existing window instead of opening a second one) that creates another
`frame: false` window with the *same* preload script, loading the same
bundle at the `#/sales-history` hash route
(`loadURL(DEV_SERVER_URL + "#/sales-history")` in dev,
`loadFile(..., { hash: "/sales-history" })` in prod) — `App.tsx` has
`/sales-history` as a top-level route, a sibling of `/dashboard`, *not*
nested under `DashboardLayout`, so that window gets `TitleBar` (in its
non-dashboard mode: menu/theme/help/window-controls, no
search/AI/notifications) but no `Sidebar`. Triggered from the renderer
via `window.electronAPI.openSalesHistory()` →
`ipcRenderer.invoke("sales-history:open")` — a deliberately different
channel prefix from `titlebar:*` since it's "open a window," not
"control the current window's chrome." The page itself gates on its
filters (date preset + staff via `STAFF`): results only render after
clicking "View Sales" once, not on every filter change.

**`SaleSummaryPanel` collapses when the sidebar expands, not the other
way around.** Early on, opening the main nav `Sidebar` shrank
`sales-main-grid`'s left column (since `SaleSummaryPanel` was a fixed
372px) and the product table's name column got visibly cramped. The fix
ties `SaleSummaryPanel`'s collapsed state directly to
`useSidebar().collapsed` in `Sales.tsx`
(`summaryCollapsed = !sidebarCollapsed`) — there's no separate local
toggle state to keep in sync. When collapsed, `SaleSummaryPanel` renders
an entirely different, narrow (160px) layout showing only
Customer/Items/Total/Checkout/Hold, not a squeezed version of the full
one. The collapse-arrow button on the panel itself (`PanelRightClose`/
`PanelRightOpen`, matching the sidebar's own toggle icons) calls the
*same* `toggleCollapsed()` from `useSidebar()` rather than owning
independent state, so it also visibly toggles the main sidebar — that's
intentional, not a side effect to "fix." There's one "give me more room"
control, reachable from either side of the screen.

**AI Assist can now explain a drug interaction or "what is this
product," via `AiAssistContext`.** `SaleTable` and `ProductSearch` each
show two small per-product icon affordances: an always-visible amber ⚠
(only when that product is — or, in `ProductSearch`'s case, would be —
interacting with something already on the sale) and a hover-reveal ⓘ
(always available). Both call `useAiAssist().openWithExchange({...})`
directly, no prop drilling through `Sales.tsx`, since `AiAssistContext`
is global. `drug-interactions-data.ts` holds a small hardcoded
`DRUG_INTERACTIONS` list (pid pairs + severity + explanation) checked
against whatever's actually in `lines`; `pos-data.ts`'s
`Product.description` field backs the info icon. Opening the drawer this
way seeds `AiAssistContext`'s `exchange` (contextLabel + prompt + canned
response) — `AiAssistDrawer` renders that as a completed user/assistant
exchange instead of its normal welcome+suggestions state. This is a
**simulated single exchange, not a chat** — no follow-up, and the
free-text input still does nothing (see the "Title bar menu" note
above). Opening AI Assist from the title bar button (`openBlank()`)
clears any active exchange back to the normal welcome state.

**Lost sales: capture in `ProductSearch`, review in `SalesHistory`.**
When there's a search query typed, the results dropdown now always shows
a "Log a lost sale" footer link, whether or not any products matched —
that's the moment a pharmacist notices they can't fulfill a request, so
that's where the capture affordance lives, not a separate always-there
button. It opens `LogLostSaleModal` (product/qty/reason/optional
customer/optional notes, prefilled with the search text) and, like
`DiscountModal`, is conditionally rendered by its parent rather than
taking an `open` prop, for the same prop-into-draft-state reason
documented above. **Submitting only flashes a toast in the main window —
it does not feed into `SalesHistory`'s "Lost Sales" tab.** That tab reads
its own independent seeded dummy dataset (`lost-sales-data.ts`'s
`LOST_SALES`, generated the same deterministic way as `SALES_HISTORY`).
This mirrors how `SalesHistory` already worked before this feature (it
was never wired to the live cart session either) — the two windows are
separate renderer processes with no shared store or IPC-based state
sync, and building that was out of scope for what was asked here. If
real cross-window persistence is ever wanted, that's the "new
architectural pattern" the "Before adding a dependency" section below
says to raise before building, not something to add quietly.

## Reports

Built from a UI design reference the user supplied, with every non-obvious
call signed off before building rather than assumed. Like the rest of the
app it is **local state over dummy data — no backend, nothing persists.**

**Hub first, dashboard behind it.** `/dashboard/reports` is a chooser page
(`pages/Reports`), consistent with Inventory / Purchases / Customers &
Care; the screenshot's analytics dashboard lives at
`/dashboard/reports/overview` (`pages/ReportsOverview`). The reference
screenshot showed the dashboard landing directly at `/dashboard/reports` —
consistency with the other four sections won that call deliberately. The
hub is *not* the usual uniform 4-card grid: the overview is promoted to a
wide featured card above a 6-card grid of the drill-downs, because it's
the destination most visits actually want. The six drill-downs are
`SalesReport`, `CategoryReport`, `ProductsReport`, `PaymentReport`,
`CustomerReport`, `CareReport` at `reports/{sales,categories,products,
payments,customers,care}`.

**The page header stays lean, on purpose.** The reference screenshot drew
Online status, a notification bell and an AI Assist button into the
Reports page header. Those were deliberately *not* reproduced — they'd
duplicate the controls `TitleBar` already owns (see "There is no `TopNav`"
above), so the header carries only title, subtitle, date range, the
read-only compare label and Export. Don't add them back.

**`components/reports/ReportShell`** is the shared shell all seven screens
render inside: back link, title, period picker, compare label, Export
button, toast. It also exports `useReportPeriod()` (period state),
`useToast()`, `StatTile` and `ChartTooltip` — `StatTile`/`ChartTooltip`
live in that file rather than their own folders because they're styled
entirely by `ReportShell/index.css`, and the folder convention exists to
keep a component's JSX with the CSS that owns it. `ReportShell/index.css`
also defines the `.report-*` primitives (`.report-card`, `.report-table`,
`.report-tiles`, `.report-segmented`, `.report-legend`) every report page
reuses — put shared report styling there, not in a page's stylesheet.

**Date handling: presets only, comparison auto-derived.** `DATE_PRESETS`
(Today / Last 7 / Last 30 / This month / This quarter) resolve to a
`Period`; the comparison is always `precedingPeriod()` — the equal-length
window immediately before. There is no compare picker and no calendar
range picker; a hand-built calendar was considered and declined (adding a
date library would need sign-off per the section below). `useReportPeriod`
memoises the resolved `Period` for *identity*, not speed — `resolvePeriod`
builds a fresh object per call and every page keys its `useMemo`s on
`period`, so without the memo, opening a dropdown would re-filter every
sale line on the page.

**Data is hybrid, and that split is the point.**
`components/reports/reports-data.ts` derives product, staff and customer
*identity* from the datasets the rest of the app already shows (`CATALOG`,
`STAFF`, `CARE_CUSTOMERS`, `CARE_ACTIVITIES`, `FOLLOW_UPS`) so a product
topping the sales report is the same product Inventory lists. What no
existing dataset carries is a *time dimension* deep enough to filter by —
"this quarter" over `sales-history-data.ts`'s 34 days is meaningless — so
the sale lines themselves are generated across `HISTORY_DAYS` (220).
Generation uses an integer-hash PRNG, never `Math.random()`, same
stability contract as `sales-history-data.ts`: don't introduce
`Math.random()` or date-dependent branching into the generators or every
chart starts reshuffling under the user. `stockAlerts()` reuses pos-data's
own `stockStatus()` rather than a local threshold, so Reports and
Inventory can't disagree about the same product. `careSeries()` is kept
separate from `seriesFor()` because it reads the care datasets, not sale
lines — don't substitute one for the other just because both feed a
sparkline.

**Categories are defined over the ten real CATALOG products**, which
yields four non-empty categories (Prescription Drugs, OTC & Vitamins,
Health & Wellness, Baby & Child Care). The reference screenshot showed six
including Personal Care and Others; those were dropped rather than
rendered as zero-value wedges, since an empty slice is a lie about the
catalog. Adding them means adding real products to `CATALOG`, not padding
`CATEGORY_BY_PRODUCT`.

**Each drill-down is bespoke, not a shared template.** Sales is trend-led,
Category is donut-led with the legend doubling as a filter, Products is
table-led (share bar inside the sales cell rather than a second chart),
Payment is stacked-mix-over-time led, Customer splits "who's coming in"
from "who's worth most", Care is timeline-led and reads only the care
datasets. They share `ReportShell` and the `.report-*` styles, not a
layout.

**Export writes a real CSV**, via `downloadCsv()` — the renderer-side Blob
+ `<a download>` approach `PurchaseHistory` already uses. No main-process
file IPC is involved; don't add any.

**AI Insight reuses the existing drawer.** The overview's insight bar
composes a summary from the current period's real figures and passes it to
`useAiAssist().openWithExchange()` — the same seeded-exchange path the POS
drug-interaction icons use (see "AI Assist can now explain a drug
interaction" above). It does not get its own panel.

**Stock Alerts is display-only.** The card reports counts and links
nowhere — Reports summarises stock, Inventory manages it.

## Splash screen

`src/electron/splash.html` is a static, self-contained file (illustration
inlined as base64) — deliberately outside the Vite/React build so it can
render before the bundle is ready. It is **not** compiled by `tsc`; the
`transpile:electron` script copies it into `dist-electron/` as a separate
step. If you rename or move it, update that copy step in `package.json`.

## Custom tooltip

`components/common/Tooltip` replaced the native browser `title` attribute
everywhere in `Sidebar` and `TitleBar` (Slack-style dark pill, optional
keyboard-shortcut badge below the label). A few things that aren't
obvious from reading a single call site:

- **It renders via `createPortal` to `document.body`**, not inline —
  necessary so it isn't clipped by any ancestor's `overflow` and so its
  `position: fixed` coordinates (computed from `getBoundingClientRect()`)
  are simple viewport pixels, not relative to some scrolled/positioned
  ancestor.
- **Placement is fully auto-detected, not passed in.** It measures
  available space on all four sides of the trigger and picks whichever
  has the most room — this is *why* sidebar tooltips end up on the right
  (little room to the left, at the window edge) and title bar tooltips
  end up on the bottom (little room above, at the window edge) without
  either call site specifying a side. Don't add a manual `side` prop
  unless the auto-detection genuinely gets something wrong — that was a
  deliberate choice over simpler manual placement.
- **`disabled` means "don't attach hover behavior," not "hide."** Sidebar
  items pass `disabled={!collapsed}` — when the sidebar is expanded, the
  label is already visible as text next to the icon, so the tooltip would
  be redundant. Title bar buttons never pass `disabled` since they're
  always icon-only.
- **The `command` prop is decorative in almost every case.** Only
  `Ctrl K` (title bar search) reflects a real key handler
  (`searchRef.current?.focus()` in `TitleBar.tsx`). Everything else —
  `F2` (Quick Sale), `F1` (Help), `Ctrl B` (sidebar toggle), `Ctrl I` (AI
  Assist), `Alt ←`/`Alt →` (back/forward), `Alt F4` (close) — is a
  plausible-looking hint with no keydown listener behind it, consistent
  with how the rest of this app treats "looks real, isn't wired yet." If
  you wire up a real global shortcut, keep its `command` text in sync
  with whatever key combo you actually bind.
- **`children` is typed `ReactElement<any>` deliberately** (not tightened
  further) — it needs to `cloneElement` an arbitrary single child (a
  `<button>` here, a `NavLink` there) to inject a ref and hover/focus
  handlers, and TypeScript's `ref` prop typing doesn't unify cleanly
  across different element types without that escape hatch. Don't try to
  "fix" this to a stricter type without re-deriving why it was loosened.

## Brand palette / theming convention

Single source of truth: `index.css`'s `:root` block defines the light
tokens (`--cream`, `--page-bg`, `--white`, `--ink`, `--muted`, `--border`,
`--green`, `--green-dark`, `--green-bg`); `:root[data-theme="dark"]`
overrides them. `ThemeContext` sets `data-theme` on `<html>`, so every
descendant — `Login`, `DashboardLayout`, `TitleBar`, everything — inherits
the same tokens automatically. `color-scheme` is set explicitly per theme
(not `light dark`) so native form controls (checkboxes, etc.) render to
match the active theme instead of the OS's — this was a real bug once
(see git history around the login checkbox) if you're tempted to revert
it to `light dark`.

Individual surfaces (`Login.css`, `DashboardLayout.css`) used to each
redefine this exact palette locally, and `TitleBar.css` carried hardcoded
`var(--x, #hexfallback)` duplicates because it rendered outside both their
scopes. That's been consolidated — none of them should redefine `--green`
etc. locally anymore. If you find a local redefinition creeping back in,
that's drift; delete it and let the global tokens inherit down.

Don't add a second theme toggle. The only one is in `TitleBar`
(`ThemeContext`'s `setTheme`), and it controls the whole app, including
`Login` — there is no more per-page theme state.

## Before adding a dependency or new architectural pattern

This app started from the Vite React+TS template and has been built up
page by page with explicit sign-off on each non-obvious choice (UI
library, icon library, routing strategy, IPC design, layout ownership).
If you're about to add a UI/component library, state library, or backend
integration, or restructure how pages compose the layout — surface the
tradeoff and ask rather than assuming, the same way those choices were
made in the first place.
