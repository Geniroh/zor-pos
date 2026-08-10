import { SUPPLIERS } from "./purchases-data";

export type PurchaseStatus = "Paid" | "Partial" | "Pending" | "Overdue";

export interface PurchaseHistoryRecord {
  id: string;
  supplierId: string;
  dateTime: number;
  dueDate: number;
  itemCount: number;
  total: number;
  amountPaid: number;
  status: PurchaseStatus;
  lastPaymentDate: number | null;
}

export const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const STATUS_CYCLE: PurchaseStatus[] = ["Paid", "Paid", "Partial", "Pending", "Overdue"];
const TERM_DAYS_CYCLE = [15, 30, 45];

function seededRecord(index: number): PurchaseHistoryRecord {
  // Deterministic pseudo-random spread so the dataset is stable across renders/builds.
  const daysAgo = (index * 41) % 120; // spreads across ~4 months, including "today"
  const hourOfDay = 8 + ((index * 17) % 9);
  const dateTime = now - daysAgo * DAY - (23 - hourOfDay) * 60 * 60 * 1000;

  const supplier = SUPPLIERS[index % SUPPLIERS.length];
  const itemCount = 2 + ((index * 7) % 12);
  const total = 15000 + ((index * 9173) % 480000);
  const status = STATUS_CYCLE[index % STATUS_CYCLE.length];
  const amountPaid =
    status === "Paid" ? total : status === "Partial" ? Math.round(total * (0.3 + ((index * 13) % 40) / 100)) : 0;
  const lastPaymentDate = amountPaid > 0 ? Math.min(dateTime + (1 + ((index * 19) % 20)) * DAY, now) : null;
  const termDays = TERM_DAYS_CYCLE[index % TERM_DAYS_CYCLE.length];
  const dueDate = dateTime + termDays * DAY;

  return {
    id: "PO-" + (2026000 + index * 29),
    supplierId: supplier.id,
    dateTime,
    dueDate,
    itemCount,
    total,
    amountPaid,
    status,
    lastPaymentDate,
  };
}

export const PURCHASE_HISTORY: PurchaseHistoryRecord[] = Array.from({ length: 60 }, (_, i) =>
  seededRecord(i),
).sort((a, b) => b.dateTime - a.dateTime);

/** Aging tier for a record's unpaid balance, based on days past its due date. */
export type AgingBucket = "Due" | "Outstanding" | "Overdue" | "Critical";

export const AGING_BUCKETS: AgingBucket[] = ["Due", "Outstanding", "Overdue", "Critical"];

export function outstandingBalance(record: PurchaseHistoryRecord): number {
  return record.total - record.amountPaid;
}

export function daysOverdue(record: PurchaseHistoryRecord): number {
  return Math.floor((Date.now() - record.dueDate) / DAY);
}

/** Null when the record carries no unpaid balance (fully paid). */
export function agingBucket(record: PurchaseHistoryRecord): AgingBucket | null {
  if (outstandingBalance(record) <= 0) return null;
  const overdue = daysOverdue(record);
  if (overdue <= 0) return "Due";
  if (overdue <= 15) return "Outstanding";
  if (overdue <= 45) return "Overdue";
  return "Critical";
}

export function payables(): (PurchaseHistoryRecord & { bucket: AgingBucket })[] {
  return PURCHASE_HISTORY.reduce<(PurchaseHistoryRecord & { bucket: AgingBucket })[]>((acc, r) => {
    const bucket = agingBucket(r);
    if (bucket) acc.push({ ...r, bucket });
    return acc;
  }, []);
}
