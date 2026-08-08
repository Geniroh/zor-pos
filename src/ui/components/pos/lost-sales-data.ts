import { STAFF } from "./pos-data";

export type LostSaleReason = "Out of stock" | "Not stocked here" | "Different brand requested" | "Other";

export const LOST_SALE_REASONS: LostSaleReason[] = [
  "Out of stock",
  "Not stocked here",
  "Different brand requested",
  "Other",
];

export interface LostSale {
  id: string;
  dateTime: number;
  product: string;
  qty: number;
  reason: LostSaleReason;
  customer?: string;
  notes?: string;
  loggedBy: string;
}

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const REQUESTED_PRODUCTS = [
  "Panadol Extra",
  "Augmentin 625mg",
  "Flagyl 400mg",
  "Zinc + Vitamin C tablets",
  "Ventolin Inhaler",
  "Metformin 500mg",
  "Piriton Syrup",
  "Diclofenac Gel",
  "Folic Acid 5mg",
  "Artesunate injection",
];

const CUSTOMER_NAMES = ["Walk-in Customer", "Ngozi Adeyemi", "Emeka Obi", "Fatima Bello"];

function seededLostSale(index: number): LostSale {
  // Deterministic pseudo-random spread, same technique as sales-history-data.ts,
  // so the dataset is stable across renders/builds rather than reshuffling.
  const daysAgo = (index * 29) % 34;
  const hourOfDay = 8 + ((index * 11) % 11);
  const minuteOfHour = (index * 19) % 60;
  const dateTime = now - daysAgo * DAY - (23 - hourOfDay) * 60 * 60 * 1000 - minuteOfHour * 60 * 1000;
  const hasCustomer = index % 3 !== 0;

  return {
    id: "LS-" + (400000 + index * 91),
    dateTime,
    product: REQUESTED_PRODUCTS[index % REQUESTED_PRODUCTS.length],
    qty: 1 + ((index * 3) % 4),
    reason: LOST_SALE_REASONS[index % LOST_SALE_REASONS.length],
    customer: hasCustomer ? CUSTOMER_NAMES[index % CUSTOMER_NAMES.length] : undefined,
    loggedBy: STAFF[index % STAFF.length],
  };
}

export const LOST_SALES: LostSale[] = Array.from({ length: 24 }, (_, i) => seededLostSale(i)).sort(
  (a, b) => b.dateTime - a.dateTime,
);
