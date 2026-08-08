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
  kind: "Hold" | "Draft";
  name: string;
  meta: string;
}

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

export const INITIAL_PARKED: ParkedSale[] = [
  { id: "h1", kind: "Hold", name: "Ngozi Adeyemi", meta: "3 items · ₦4,250.00" },
  { id: "h2", kind: "Hold", name: "Walk-in Customer", meta: "1 item · ₦900.00" },
  { id: "d1", kind: "Draft", name: "St. Luke's Clinic", meta: "12 items · ₦86,400.00" },
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

export function formatNaira(amount: number): string {
  return (
    "₦" +
    (Math.round(amount * 100) / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
