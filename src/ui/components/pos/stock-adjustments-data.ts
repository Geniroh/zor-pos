import { CATALOG, STAFF } from "./pos-data";

export type AdjustmentType = "Add stock" | "Remove stock" | "Set count";

export const ADJUSTMENT_TYPES: AdjustmentType[] = ["Add stock", "Remove stock", "Set count"];

export type AdjustmentReason =
  | "Damaged"
  | "Expired"
  | "Stocktake correction"
  | "Return to supplier"
  | "Theft / loss"
  | "Other";

export const ADJUSTMENT_REASONS: AdjustmentReason[] = [
  "Damaged",
  "Expired",
  "Stocktake correction",
  "Return to supplier",
  "Theft / loss",
  "Other",
];

export interface StockAdjustment {
  id: string;
  dateTime: number;
  product: string;
  type: AdjustmentType;
  qtyChange: number;
  reason: AdjustmentReason;
  notes?: string;
  adjustedBy: string;
}

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

function seededAdjustment(index: number): StockAdjustment {
  // Deterministic pseudo-random spread, same technique as lost-sales-data.ts,
  // so the dataset is stable across renders/builds rather than reshuffling.
  const daysAgo = (index * 17) % 30;
  const hourOfDay = 8 + ((index * 7) % 11);
  const minuteOfHour = (index * 23) % 60;
  const dateTime = now - daysAgo * DAY - (23 - hourOfDay) * 60 * 60 * 1000 - minuteOfHour * 60 * 1000;

  const type = ADJUSTMENT_TYPES[index % ADJUSTMENT_TYPES.length];
  const magnitude = 2 + ((index * 5) % 18);
  const qtyChange = type === "Remove stock" ? -magnitude : type === "Add stock" ? magnitude : magnitude;
  const hasNotes = index % 4 === 0;

  return {
    id: "ADJ-" + (500000 + index * 73),
    dateTime,
    product: CATALOG[index % CATALOG.length].name,
    type,
    qtyChange,
    reason: ADJUSTMENT_REASONS[index % ADJUSTMENT_REASONS.length],
    notes: hasNotes ? "Confirmed during weekly stocktake" : undefined,
    adjustedBy: STAFF[index % STAFF.length],
  };
}

export const STOCK_ADJUSTMENTS: StockAdjustment[] = Array.from({ length: 20 }, (_, i) =>
  seededAdjustment(i),
).sort((a, b) => b.dateTime - a.dateTime);
