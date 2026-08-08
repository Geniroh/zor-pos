import { STAFF } from "./pos-data";

export interface SaleHistoryRecord {
  id: string;
  dateTime: number;
  customer: string;
  servedBy: string;
  itemCount: number;
  total: number;
  payment: "Cash" | "POS / Card" | "Bank transfer" | "Split";
}

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const CUSTOMER_NAMES = [
  "Walk-in Customer",
  "Ngozi Adeyemi",
  "Emeka Obi",
  "St. Luke's Clinic",
  "Fatima Bello",
];

const PAYMENTS: SaleHistoryRecord["payment"][] = ["Cash", "POS / Card", "Bank transfer", "Split"];

function seededRecord(index: number): SaleHistoryRecord {
  // Deterministic pseudo-random spread so the dataset is stable across renders/builds.
  const daysAgo = (index * 37) % 34; // spreads across ~34 days, including "today"
  const hourOfDay = 8 + ((index * 13) % 11); // 08:00–18:00
  const minuteOfHour = (index * 21) % 60;
  const dateTime = now - daysAgo * DAY - (23 - hourOfDay) * 60 * 60 * 1000 - minuteOfHour * 60 * 1000;

  return {
    id: "INV-" + (1060000000 + index * 137),
    dateTime,
    customer: CUSTOMER_NAMES[index % CUSTOMER_NAMES.length],
    servedBy: STAFF[index % STAFF.length],
    itemCount: 1 + ((index * 5) % 9),
    total: 650 + ((index * 913) % 42000),
    payment: PAYMENTS[index % PAYMENTS.length],
  };
}

export const SALES_HISTORY: SaleHistoryRecord[] = Array.from({ length: 48 }, (_, i) => seededRecord(i)).sort(
  (a, b) => b.dateTime - a.dateTime,
);
