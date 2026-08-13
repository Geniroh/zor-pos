import { CATALOG, STAFF, formatNaira, stockStatus, type Product } from "../pos/pos-data";
import { CARE_ACTIVITIES, CARE_CUSTOMERS, FOLLOW_UPS } from "../care/care-data";

/**
 * Data layer for the Reports section.
 *
 * Hybrid by design (an explicit call, not an accident): product, staff and
 * customer *identity* is derived from the datasets the rest of the app already
 * shows — CATALOG, STAFF, CARE_CUSTOMERS, CARE_ACTIVITIES, FOLLOW_UPS — so a
 * product that tops the sales report is the same product Inventory lists. What
 * no existing dataset carries is a *time dimension* deep enough to filter by
 * ("this quarter" over 34 days of sales history is meaningless), so the sale
 * lines themselves are generated here across HISTORY_DAYS.
 *
 * Generation is deterministic (an integer-hash PRNG, never Math.random()), same
 * contract as sales-history-data.ts: identical numbers on every render, reload
 * and in both windows. Do not introduce Math.random() or Date-dependent
 * branching into the generators — every chart in this section would start
 * reshuffling under the user.
 */

const DAY = 24 * 60 * 60 * 1000;

/** Midnight today. Every generated day is an offset from this, so day buckets align. */
const TODAY_START = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
})();

/** Deep enough to cover the longest preset (this quarter) with room to compare against. */
const HISTORY_DAYS = 220;

/* ------------------------------------------------------------------ */
/* Deterministic PRNG                                                  */
/* ------------------------------------------------------------------ */

/** Integer-only hash → [0, 1). Exact across engines; no floating-point drift. */
function rand(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pick<T>(items: T[], seed: number): T {
  return items[Math.floor(rand(seed) * items.length) % items.length];
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

/**
 * Categories are defined over the ten real CATALOG products rather than
 * invented alongside them. That deliberately yields four non-empty categories
 * instead of a longer list padded with zero-value slices — a donut with an
 * empty "Personal Care" wedge would be a lie about the catalog.
 */
export type Category =
  | "Prescription Drugs"
  | "OTC & Vitamins"
  | "Health & Wellness"
  | "Baby & Child Care";

export const CATEGORIES: Category[] = [
  "Prescription Drugs",
  "OTC & Vitamins",
  "Health & Wellness",
  "Baby & Child Care",
];

const CATEGORY_BY_PRODUCT: Record<string, Category> = {
  "PRD-1088": "Prescription Drugs", // Amoxicillin 500mg
  "PRD-1255": "Prescription Drugs", // Coartem 20/120
  "PRD-1310": "Prescription Drugs", // Lisinopril 10mg
  "PRD-1042": "OTC & Vitamins", // Paracetamol 500mg
  "PRD-1512": "OTC & Vitamins", // Ibuprofen 400mg
  "PRD-1130": "OTC & Vitamins", // Vitamin C 1000mg
  "PRD-1204": "OTC & Vitamins", // Cough Syrup 100ml
  "PRD-1401": "Health & Wellness", // Blood Glucose Strips
  "PRD-1366": "Health & Wellness", // Insulin Syringe 1ml
  "PRD-1470": "Baby & Child Care", // ORS Sachet
};

export function categoryOf(productId: string): Category {
  return CATEGORY_BY_PRODUCT[productId] ?? "OTC & Vitamins";
}

/** Fixed per-category colour so a category keeps its colour across every report. */
export const CATEGORY_COLOR: Record<Category, string> = {
  "Prescription Drugs": "var(--chart-cat-1)",
  "OTC & Vitamins": "var(--chart-cat-3)",
  "Health & Wellness": "var(--chart-cat-4)",
  "Baby & Child Care": "var(--chart-cat-5)",
};

/* ------------------------------------------------------------------ */
/* Cost basis                                                          */
/* ------------------------------------------------------------------ */

/** Per-product margin, stable per id, so gross profit is consistent everywhere. */
function marginFor(productId: string, index: number): number {
  return 0.28 + rand(index * 977 + productId.length) * 0.16; // 28%–44%
}

const UNIT_COST: Record<string, number> = {};
CATALOG.forEach((p, i) => {
  UNIT_COST[p.id] = Math.round(p.price * (1 - marginFor(p.id, i)));
});

export function unitCostOf(productId: string): number {
  return UNIT_COST[productId] ?? 0;
}

/* ------------------------------------------------------------------ */
/* Sale lines                                                          */
/* ------------------------------------------------------------------ */

export type PaymentMethod = "Cash" | "Transfer" | "POS / Card" | "Other";

export const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Transfer", "POS / Card", "Other"];

export const PAYMENT_COLOR: Record<PaymentMethod, string> = {
  Cash: "var(--chart-cat-1)",
  Transfer: "var(--chart-cat-3)",
  "POS / Card": "var(--chart-cat-4)",
  Other: "var(--chart-cat-2)",
};

/** Weighted so the payment mix looks like a Nigerian community pharmacy's. */
const PAYMENT_WEIGHTS: [PaymentMethod, number][] = [
  ["Cash", 0.587],
  ["Transfer", 0.283],
  ["POS / Card", 0.098],
  ["Other", 0.032],
];

function paymentFor(seed: number): PaymentMethod {
  let r = rand(seed);
  for (const [method, weight] of PAYMENT_WEIGHTS) {
    if (r < weight) return method;
    r -= weight;
  }
  return "Cash";
}

export interface ReportSaleLine {
  saleId: string;
  date: number;
  productId: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  payment: PaymentMethod;
  /** null means a walk-in that was never attributed to a customer record. */
  customerId: string | null;
  staff: string;
}

/** Named customers only — walk-ins are represented by a null customerId. */
const NAMED_CUSTOMERS = CARE_CUSTOMERS.slice(0, 48);

function salesForDay(dayIndex: number): ReportSaleLine[] {
  const date = TODAY_START - dayIndex * DAY;
  const weekday = new Date(date).getDay();

  // Sundays quiet, Saturdays busy — plus a mild upward trend toward today, so
  // "vs previous period" reads as growth rather than noise.
  const weekendFactor = weekday === 0 ? 0.45 : weekday === 6 ? 1.25 : 1;
  const trend = 1 + (HISTORY_DAYS - dayIndex) / (HISTORY_DAYS * 6);
  const noise = 0.82 + rand(dayIndex * 31) * 0.36;
  const saleCount = Math.max(3, Math.round(17 * weekendFactor * trend * noise));

  const lines: ReportSaleLine[] = [];

  for (let s = 0; s < saleCount; s++) {
    const seed = dayIndex * 1000 + s;
    const hour = 8 + Math.floor(rand(seed * 3) * 11);
    const minute = Math.floor(rand(seed * 5) * 60);
    const at = date + hour * 60 * 60 * 1000 + minute * 60 * 1000;

    const saleId = "SL-" + String(dayIndex).padStart(3, "0") + "-" + String(s).padStart(3, "0");
    const payment = paymentFor(seed * 7);
    // Roughly a third of sales are attributed to a known customer.
    const named = rand(seed * 11) < 0.34;
    const customerId = named ? NAMED_CUSTOMERS[Math.floor(rand(seed * 13) * NAMED_CUSTOMERS.length)].id : null;
    const staff = pick(STAFF, seed * 17);

    const lineCount = 1 + Math.floor(rand(seed * 19) * 3); // 1–3 products per sale
    const used = new Set<string>();

    for (let l = 0; l < lineCount; l++) {
      const product = CATALOG[Math.floor(rand(seed * 23 + l * 101) * CATALOG.length)];
      if (used.has(product.id)) continue;
      used.add(product.id);

      lines.push({
        saleId,
        date: at,
        productId: product.id,
        qty: 1 + Math.floor(rand(seed * 29 + l * 37) * 4),
        unitPrice: product.price,
        unitCost: unitCostOf(product.id),
        payment,
        customerId,
        staff,
      });
    }
  }

  return lines;
}

export const SALE_LINES: ReportSaleLine[] = Array.from({ length: HISTORY_DAYS }, (_, d) =>
  salesForDay(d),
).flat();

/** First attributed purchase per customer — drives the new-vs-returning split. */
const FIRST_PURCHASE: Record<string, number> = {};
for (const line of SALE_LINES) {
  if (!line.customerId) continue;
  const seen = FIRST_PURCHASE[line.customerId];
  if (seen === undefined || line.date < seen) FIRST_PURCHASE[line.customerId] = line.date;
}

/* ------------------------------------------------------------------ */
/* Periods                                                             */
/* ------------------------------------------------------------------ */

export type DatePreset = "today" | "7d" | "30d" | "month" | "quarter";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
];

export interface Period {
  /** Inclusive start of the first day. */
  start: number;
  /** Exclusive end — the instant after the last day. */
  end: number;
}

export function resolvePeriod(preset: DatePreset): Period {
  const end = TODAY_START + DAY; // through the end of today
  const now = new Date(TODAY_START);

  if (preset === "today") return { start: TODAY_START, end };
  if (preset === "7d") return { start: TODAY_START - 6 * DAY, end };
  if (preset === "30d") return { start: TODAY_START - 29 * DAY, end };
  if (preset === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), end };
  }
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  return { start: new Date(now.getFullYear(), quarterStartMonth, 1).getTime(), end };
}

/**
 * The equal-length window immediately before `period`. Comparison is never
 * user-chosen — it always auto-derives, which is why there is no compare
 * picker in the UI, only a read-only label.
 */
export function precedingPeriod(period: Period): Period {
  const span = period.end - period.start;
  return { start: period.start - span, end: period.start };
}

export function dayCount(period: Period): number {
  return Math.max(1, Math.round((period.end - period.start) / DAY));
}

export function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatPeriod(period: Period): string {
  const last = period.end - DAY;
  const year = new Date(last).getFullYear();
  if (dayCount(period) === 1) return formatDay(last) + ", " + year;
  return formatDay(period.start) + " – " + formatDay(last) + ", " + year;
}

export function inPeriod(ms: number, period: Period): boolean {
  return ms >= period.start && ms < period.end;
}

export function linesIn(period: Period): ReportSaleLine[] {
  return SALE_LINES.filter((l) => inPeriod(l.date, period));
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

export interface Totals {
  revenue: number;
  cost: number;
  profit: number;
  units: number;
  transactions: number;
  customers: number;
  basket: number;
}

export function totalsFor(lines: ReportSaleLine[]): Totals {
  let revenue = 0;
  let cost = 0;
  let units = 0;
  const sales = new Set<string>();
  const customers = new Set<string>();

  for (const l of lines) {
    revenue += l.unitPrice * l.qty;
    cost += l.unitCost * l.qty;
    units += l.qty;
    sales.add(l.saleId);
    if (l.customerId) customers.add(l.customerId);
  }

  return {
    revenue,
    cost,
    profit: revenue - cost,
    units,
    transactions: sales.size,
    customers: customers.size,
    basket: sales.size === 0 ? 0 : revenue / sales.size,
  };
}

/** Percentage change, guarding the divide-by-zero an empty previous period gives. */
export function changePct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatChange(pct: number | null): string {
  if (pct === null) return "—";
  return (pct >= 0 ? "▲ " : "▼ ") + Math.abs(pct).toFixed(1) + "%";
}

/** Compact naira for axis ticks and tight tiles — ₦800K rather than ₦800,000.00. */
export function formatCompactNaira(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return "₦" + (amount / 1_000_000).toFixed(1) + "M";
  if (Math.abs(amount) >= 1_000) return "₦" + Math.round(amount / 1_000) + "K";
  return "₦" + Math.round(amount);
}

/* Re-exported so report pages have one import for money and stock formatting. */
export { formatNaira, stockStatus };

/* ------------------------------------------------------------------ */
/* Series                                                              */
/* ------------------------------------------------------------------ */

export type Granularity = "daily" | "weekly" | "monthly";

export interface SeriesPoint {
  /** Bucket start, used as the x key. */
  bucket: number;
  label: string;
  revenue: number;
  profit: number;
  transactions: number;
  units: number;
  customers: number;
}

function bucketStart(ms: number, granularity: Granularity): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  if (granularity === "weekly") {
    // Week starts Monday.
    const offset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - offset);
  } else if (granularity === "monthly") {
    d.setDate(1);
  }
  return d.getTime();
}

function bucketLabel(ms: number, granularity: Granularity): string {
  if (granularity === "monthly") {
    return new Date(ms).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  }
  return formatDay(ms);
}

export function seriesFor(
  lines: ReportSaleLine[],
  period: Period,
  granularity: Granularity,
): SeriesPoint[] {
  const buckets = new Map<number, { revenue: number; profit: number; sales: Set<string>; units: number; customers: Set<string> }>();

  // Seed every bucket in range so quiet days render as zero rather than vanishing.
  for (let t = bucketStart(period.start, granularity); t < period.end; ) {
    buckets.set(t, { revenue: 0, profit: 0, sales: new Set(), units: 0, customers: new Set() });
    const next = new Date(t);
    if (granularity === "daily") next.setDate(next.getDate() + 1);
    else if (granularity === "weekly") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    t = next.getTime();
  }

  for (const l of lines) {
    const key = bucketStart(l.date, granularity);
    const entry = buckets.get(key);
    if (!entry) continue;
    entry.revenue += l.unitPrice * l.qty;
    entry.profit += (l.unitPrice - l.unitCost) * l.qty;
    entry.units += l.qty;
    entry.sales.add(l.saleId);
    if (l.customerId) entry.customers.add(l.customerId);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, v]) => ({
      bucket,
      label: bucketLabel(bucket, granularity),
      revenue: v.revenue,
      profit: v.profit,
      transactions: v.sales.size,
      units: v.units,
      customers: v.customers.size,
    }));
}

/** Sensible bucket size for a period — daily over a week, monthly over a quarter. */
export function defaultGranularity(period: Period): Granularity {
  const days = dayCount(period);
  if (days <= 31) return "daily";
  if (days <= 120) return "weekly";
  return "monthly";
}

/* ------------------------------------------------------------------ */
/* Breakdowns                                                          */
/* ------------------------------------------------------------------ */

export interface Slice {
  key: string;
  label: string;
  color: string;
  revenue: number;
  profit: number;
  units: number;
  transactions: number;
  share: number;
}

function toSlices(
  groups: Map<string, { label: string; color: string; revenue: number; profit: number; units: number; sales: Set<string> }>,
): Slice[] {
  const total = [...groups.values()].reduce((sum, g) => sum + g.revenue, 0);
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      label: g.label,
      color: g.color,
      revenue: g.revenue,
      profit: g.profit,
      units: g.units,
      transactions: g.sales.size,
      share: total === 0 ? 0 : (g.revenue / total) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function byCategory(lines: ReportSaleLine[]): Slice[] {
  const groups = new Map<string, { label: string; color: string; revenue: number; profit: number; units: number; sales: Set<string> }>();
  for (const category of CATEGORIES) {
    groups.set(category, { label: category, color: CATEGORY_COLOR[category], revenue: 0, profit: 0, units: 0, sales: new Set() });
  }
  for (const l of lines) {
    const g = groups.get(categoryOf(l.productId));
    if (!g) continue;
    g.revenue += l.unitPrice * l.qty;
    g.profit += (l.unitPrice - l.unitCost) * l.qty;
    g.units += l.qty;
    g.sales.add(l.saleId);
  }
  return toSlices(groups);
}

export function byPayment(lines: ReportSaleLine[]): Slice[] {
  const groups = new Map<string, { label: string; color: string; revenue: number; profit: number; units: number; sales: Set<string> }>();
  for (const method of PAYMENT_METHODS) {
    groups.set(method, { label: method, color: PAYMENT_COLOR[method], revenue: 0, profit: 0, units: 0, sales: new Set() });
  }
  for (const l of lines) {
    const g = groups.get(l.payment);
    if (!g) continue;
    g.revenue += l.unitPrice * l.qty;
    g.profit += (l.unitPrice - l.unitCost) * l.qty;
    g.units += l.qty;
    g.sales.add(l.saleId);
  }
  return toSlices(groups);
}

export interface ProductRow {
  product: Product;
  category: Category;
  revenue: number;
  profit: number;
  units: number;
  transactions: number;
  share: number;
}

export function byProduct(lines: ReportSaleLine[]): ProductRow[] {
  const groups = new Map<string, { revenue: number; profit: number; units: number; sales: Set<string> }>();
  for (const l of lines) {
    let g = groups.get(l.productId);
    if (!g) {
      g = { revenue: 0, profit: 0, units: 0, sales: new Set() };
      groups.set(l.productId, g);
    }
    g.revenue += l.unitPrice * l.qty;
    g.profit += (l.unitPrice - l.unitCost) * l.qty;
    g.units += l.qty;
    g.sales.add(l.saleId);
  }

  const total = [...groups.values()].reduce((sum, g) => sum + g.revenue, 0);

  return CATALOG.map((product) => {
    const g = groups.get(product.id);
    return {
      product,
      category: categoryOf(product.id),
      revenue: g?.revenue ?? 0,
      profit: g?.profit ?? 0,
      units: g?.units ?? 0,
      transactions: g?.sales.size ?? 0,
      share: total === 0 ? 0 : ((g?.revenue ?? 0) / total) * 100,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export interface StaffRow {
  name: string;
  revenue: number;
  transactions: number;
  basket: number;
}

export function byStaff(lines: ReportSaleLine[]): StaffRow[] {
  const groups = new Map<string, { revenue: number; sales: Set<string> }>();
  for (const name of STAFF) groups.set(name, { revenue: 0, sales: new Set() });
  for (const l of lines) {
    const g = groups.get(l.staff);
    if (!g) continue;
    g.revenue += l.unitPrice * l.qty;
    g.sales.add(l.saleId);
  }
  return [...groups.entries()]
    .map(([name, g]) => ({
      name,
      revenue: g.revenue,
      transactions: g.sales.size,
      basket: g.sales.size === 0 ? 0 : g.revenue / g.sales.size,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export interface CustomerRow {
  id: string;
  name: string;
  revenue: number;
  transactions: number;
  units: number;
  basket: number;
  lastPurchase: number;
  isNew: boolean;
}

export function byCustomer(lines: ReportSaleLine[], period: Period): CustomerRow[] {
  const groups = new Map<string, { revenue: number; units: number; sales: Set<string>; last: number }>();

  for (const l of lines) {
    if (!l.customerId) continue;
    let g = groups.get(l.customerId);
    if (!g) {
      g = { revenue: 0, units: 0, sales: new Set(), last: 0 };
      groups.set(l.customerId, g);
    }
    g.revenue += l.unitPrice * l.qty;
    g.units += l.qty;
    g.sales.add(l.saleId);
    if (l.date > g.last) g.last = l.date;
  }

  return [...groups.entries()]
    .map(([id, g]) => ({
      id,
      name: CARE_CUSTOMERS.find((c) => c.id === id)?.name ?? id,
      revenue: g.revenue,
      transactions: g.sales.size,
      units: g.units,
      basket: g.sales.size === 0 ? 0 : g.revenue / g.sales.size,
      lastPurchase: g.last,
      // "New" means their very first attributed purchase falls inside this period.
      isNew: inPeriod(FIRST_PURCHASE[id] ?? 0, period),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface CustomerMix {
  newCount: number;
  returningCount: number;
  newRevenue: number;
  returningRevenue: number;
  walkInSales: number;
  attributedSales: number;
}

export function customerMix(lines: ReportSaleLine[], period: Period): CustomerMix {
  const rows = byCustomer(lines, period);
  const walkIn = new Set<string>();
  const attributed = new Set<string>();
  for (const l of lines) {
    if (l.customerId) attributed.add(l.saleId);
    else walkIn.add(l.saleId);
  }
  return {
    newCount: rows.filter((r) => r.isNew).length,
    returningCount: rows.filter((r) => !r.isNew).length,
    newRevenue: rows.filter((r) => r.isNew).reduce((s, r) => s + r.revenue, 0),
    returningRevenue: rows.filter((r) => !r.isNew).reduce((s, r) => s + r.revenue, 0),
    walkInSales: walkIn.size,
    attributedSales: attributed.size,
  };
}

/* ------------------------------------------------------------------ */
/* Care                                                                */
/* ------------------------------------------------------------------ */

export interface CareTotals {
  consultations: number;
  followUpsDue: number;
  followUpsCompleted: number;
  followUpsMissed: number;
  completionPct: number;
  patientsSeen: number;
}

export function careTotals(period: Period): CareTotals {
  const consultations = CARE_ACTIVITIES.filter((a) => inPeriod(a.date, period));
  const due = FOLLOW_UPS.filter((f) => inPeriod(f.dueAt, period));
  const completed = due.filter((f) => f.status === "Completed").length;
  const missed = due.filter((f) => f.status === "Missed").length;

  return {
    consultations: consultations.length,
    followUpsDue: due.length,
    followUpsCompleted: completed,
    followUpsMissed: missed,
    completionPct: due.length === 0 ? 0 : (completed / due.length) * 100,
    patientsSeen: new Set(consultations.map((a) => a.customerId)).size,
  };
}

export interface CarePoint {
  bucket: number;
  label: string;
  consultations: number;
  completed: number;
}

/**
 * Care activity bucketed by day. Kept separate from seriesFor because it reads
 * the care datasets, not sale lines — the two must never be substituted for one
 * another just because both produce a sparkline.
 */
export function careSeries(period: Period): CarePoint[] {
  const buckets = new Map<number, CarePoint>();

  for (let t = period.start; t < period.end; t += DAY) {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    buckets.set(d.getTime(), { bucket: d.getTime(), label: formatDay(d.getTime()), consultations: 0, completed: 0 });
  }

  function keyFor(ms: number): number {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  for (const activity of CARE_ACTIVITIES) {
    const entry = buckets.get(keyFor(activity.date));
    if (entry) entry.consultations += 1;
  }

  for (const followUp of FOLLOW_UPS) {
    if (followUp.status !== "Completed") continue;
    const entry = buckets.get(keyFor(followUp.dueAt));
    if (entry) entry.completed += 1;
  }

  return [...buckets.values()].sort((a, b) => a.bucket - b.bucket);
}

/* ------------------------------------------------------------------ */
/* Stock alerts                                                        */
/* ------------------------------------------------------------------ */

export interface StockAlerts {
  lowStock: number;
  expiringSoon: number;
  outOfStock: number;
}

/**
 * Low/out-of-stock reuse pos-data's own stockStatus rather than a local
 * threshold, so the alert counts here agree with what Inventory and the POS
 * report for the same product. Expiry has no field in the catalog, so it is
 * derived deterministically per product rather than invented per render.
 */
export function stockAlerts(): StockAlerts {
  const lowStock = CATALOG.filter((p) => stockStatus(p.stock) === "Low Stock").length;
  const outOfStock = CATALOG.filter((p) => stockStatus(p.stock) === "Out of Stock").length;
  const expiringSoon = CATALOG.filter((_, i) => rand(i * 613) < 0.25).length;
  return { lowStock, expiringSoon, outOfStock };
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Renderer-side CSV download — same Blob + <a download> approach
 * PurchaseHistory already uses, so no main-process file IPC is involved.
 */
export function downloadCsv(filename: string, header: string[], rows: string[][]): void {
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + "-" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
