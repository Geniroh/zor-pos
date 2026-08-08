export interface Product {
  id: string;
  name: string;
  form: string;
  price: number;
  stock: number;
  vat: boolean;
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
  gender?: string;
}

export interface SaleLine {
  key: number;
  pid: string;
  name: string;
  form: string;
  price: number;
  qty: number;
  stock: number;
  vat: boolean;
}

export interface ParkedSale {
  id: string;
  customer: string;
  servedBy: string;
  heldAt: number;
  lines: SaleLine[];
}

export const STAFF: string[] = [
  "Chibuzor Irobuisi",
  "Amaka Eze",
  "Tunde Bakare",
  "Ifeoma Chukwu",
];

export const VAT_RATE = 0.075;

export const CATALOG: Product[] = [
  { id: "PRD-1042", name: "Paracetamol 500mg", form: "Tablet · 10s card", price: 900, stock: 240, vat: true },
  { id: "PRD-1088", name: "Amoxicillin 500mg", form: "Capsule · 10s card", price: 1200, stock: 96, vat: true },
  { id: "PRD-1130", name: "Vitamin C 1000mg", form: "Tablet · 20s tin", price: 850, stock: 150, vat: false },
  { id: "PRD-1204", name: "Cough Syrup 100ml", form: "Syrup · bottle", price: 1100, stock: 44, vat: true },
  { id: "PRD-1255", name: "Coartem 20/120", form: "Tablet · 24s pack", price: 3200, stock: 6, vat: true },
  { id: "PRD-1310", name: "Lisinopril 10mg", form: "Tablet · 28s pack", price: 2400, stock: 72, vat: true },
  { id: "PRD-1366", name: "Insulin Syringe 1ml", form: "Device · single", price: 300, stock: 400, vat: false },
  { id: "PRD-1401", name: "Blood Glucose Strips", form: "Device · 50s", price: 8500, stock: 18, vat: true },
  { id: "PRD-1470", name: "ORS Sachet", form: "Powder · sachet", price: 250, stock: 320, vat: false },
  { id: "PRD-1512", name: "Ibuprofen 400mg", form: "Tablet · 10s card", price: 750, stock: 210, vat: true },
];

export const CUSTOMERS: Customer[] = [
  { name: "Walk-in Customer", phone: "default" },
  { name: "Ngozi Adeyemi", phone: "0803 441 2290" },
  { name: "Emeka Obi", phone: "0812 776 0031" },
  { name: "St. Luke's Clinic", phone: "Account · 30 days" },
  { name: "Fatima Bello", phone: "0706 220 9914" },
];

const MINUTE = 60_000;

export const INITIAL_PARKED: ParkedSale[] = [
  {
    id: "h1",
    customer: "Ngozi Adeyemi",
    servedBy: "Chibuzor Irobuisi",
    heldAt: Date.now() - 12 * MINUTE,
    lines: [
      { key: 101, pid: "PRD-1130", name: "Vitamin C 1000mg", form: "Tablet · 20s tin", price: 850, qty: 2, stock: 150, vat: false },
      { key: 102, pid: "PRD-1512", name: "Ibuprofen 400mg", form: "Tablet · 10s card", price: 750, qty: 2, stock: 210, vat: true },
    ],
  },
  {
    id: "h2",
    customer: "Walk-in Customer",
    servedBy: "Amaka Eze",
    heldAt: Date.now() - 40 * MINUTE,
    lines: [
      { key: 201, pid: "PRD-1042", name: "Paracetamol 500mg", form: "Tablet · 10s card", price: 900, qty: 1, stock: 240, vat: true },
    ],
  },
  {
    id: "h3",
    customer: "St. Luke's Clinic",
    servedBy: "Tunde Bakare",
    heldAt: Date.now() - 2 * 60 * MINUTE,
    lines: [
      { key: 301, pid: "PRD-1088", name: "Amoxicillin 500mg", form: "Capsule · 10s card", price: 1200, qty: 6, stock: 96, vat: true },
      { key: 302, pid: "PRD-1401", name: "Blood Glucose Strips", form: "Device · 50s", price: 8500, qty: 2, stock: 18, vat: true },
      { key: 303, pid: "PRD-1310", name: "Lisinopril 10mg", form: "Tablet · 28s pack", price: 2400, qty: 4, stock: 72, vat: true },
    ],
  },
];

export const TODAY_STATS = {
  salesTotal: 245680,
  salesChangePct: 12.5,
  grossProfit: 61420,
  marginPct: 25,
  itemsSold: 189,
  avgPerSale: 7677,
  transactions: 32,
  lowStockCount: 1,
  lowStockItem: "Coartem 20/120",
};

export function saleLinesTotal(lines: SaleLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}

export function saleLinesItemCount(lines: SaleLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export function formatNaira(amount: number): string {
  return (
    "₦" +
    (Math.round(amount * 100) / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
