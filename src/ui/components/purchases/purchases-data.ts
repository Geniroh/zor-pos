import { CATALOG } from "../pos/pos-data";

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

export const SUPPLIERS: Supplier[] = [
  { id: "SUP-001", name: "MedPlus Distributors Ltd", contact: "Ngozi Adeyemi", phone: "0803 123 4567" },
  { id: "SUP-002", name: "PharmaCore Nigeria", contact: "Emeka Obi", phone: "0806 234 5678" },
  { id: "SUP-003", name: "Zenith Pharma Supplies", contact: "Fatima Bello", phone: "0812 345 6789" },
  { id: "SUP-004", name: "Greenlife Wholesale", contact: "Tobi Alade", phone: "0705 456 7890" },
  { id: "SUP-005", name: "Apex Health Logistics", contact: "Chinwe Okafor", phone: "0909 567 8901" },
];

export function findSupplier(id: string): Supplier | undefined {
  return SUPPLIERS.find((s) => s.id === id);
}

export function supplierName(id: string): string {
  return findSupplier(id)?.name ?? id;
}

export type PaymentTerm = "Cash" | "Credit" | "Transfer" | "Card";

export const PAYMENT_TERMS: PaymentTerm[] = ["Cash", "Credit", "Transfer", "Card"];

export interface ParsedLineItem {
  key: number;
  pid: string;
  name: string;
  batch: string;
  expiry: string;
  qty: number;
  cost: number;
}

export interface ParsedInvoice {
  supplierId: string;
  invoiceNumber: string;
  dateReceived: string;
  paymentTerm: PaymentTerm;
  notes: string;
  lines: ParsedLineItem[];
  invoiceTotal: number;
}

let parsedLineSeq = 1;

function randomBatch(): string {
  return "BN-" + Math.floor(1000 + Math.random() * 9000);
}

function randomExpiry(): string {
  const monthsAhead = 3 + Math.floor(Math.random() * 21);
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toISOString().slice(0, 10);
}

function randomInvoiceNumber(): string {
  return "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
}

/**
 * Stands in for real OCR/invoice parsing — picks a random supplier and a
 * handful of catalog products to simulate what an uploaded invoice "contains".
 */
export function simulateParseInvoice(): ParsedInvoice {
  const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
  const lineCount = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...CATALOG].sort(() => Math.random() - 0.5).slice(0, lineCount);

  const lines: ParsedLineItem[] = shuffled.map((p) => {
    const qty = 5 + Math.floor(Math.random() * 46);
    const cost = Math.round(p.price * (0.55 + Math.random() * 0.15));
    return {
      key: parsedLineSeq++,
      pid: p.id,
      name: p.name,
      batch: randomBatch(),
      expiry: randomExpiry(),
      qty,
      cost,
    };
  });

  return {
    supplierId: supplier.id,
    invoiceNumber: randomInvoiceNumber(),
    dateReceived: new Date().toISOString().slice(0, 10),
    paymentTerm: PAYMENT_TERMS[Math.floor(Math.random() * PAYMENT_TERMS.length)],
    notes: "Auto-filled from uploaded invoice — verify before submitting.",
    lines,
    invoiceTotal: lines.reduce((sum, l) => sum + l.qty * l.cost, 0),
  };
}
