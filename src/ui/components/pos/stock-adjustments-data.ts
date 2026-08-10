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
  productId: string;
  product: string;
  type: AdjustmentType;
  qtyChange: number;
  stockBefore: number;
  stockAfter: number;
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

  const product = CATALOG[index % CATALOG.length];
  const type = ADJUSTMENT_TYPES[index % ADJUSTMENT_TYPES.length];
  const magnitude = 2 + ((index * 5) % 18);
  const qtyChange = type === "Remove stock" ? -magnitude : type === "Add stock" ? magnitude : magnitude;
  const hasNotes = index % 4 === 0;

  // stockAfter is anchored to the product's current catalog stock (so the
  // "most recent" adjustment per product lines up with it); stockBefore is
  // derived backwards from the same qtyChange used above.
  const stockAfter = product.stock;
  const stockBefore = type === "Set count" ? Math.max(0, stockAfter - magnitude) : stockAfter - qtyChange;

  return {
    id: "ADJ-" + (500000 + index * 73),
    dateTime,
    productId: product.id,
    product: product.name,
    type,
    qtyChange,
    stockBefore,
    stockAfter,
    reason: ADJUSTMENT_REASONS[index % ADJUSTMENT_REASONS.length],
    notes: hasNotes ? "Confirmed during weekly stocktake" : undefined,
    adjustedBy: STAFF[index % STAFF.length],
  };
}

export const STOCK_ADJUSTMENTS: StockAdjustment[] = Array.from({ length: 20 }, (_, i) =>
  seededAdjustment(i),
).sort((a, b) => b.dateTime - a.dateTime);
