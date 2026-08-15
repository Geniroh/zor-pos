import { CATALOG, STAFF, VAT_RATE, formatNaira } from "../pos/pos-data";

/**
 * Seed data for Settings. Same contract as the rest of the app's dummy data:
 * no backend, and nothing here is random — every value is written out or
 * derived deterministically, so a reload never reshuffles what the user sees.
 *
 * Where a setting has a real counterpart elsewhere in the app it is seeded from
 * that source rather than re-typed (VAT from pos-data, staff names from STAFF,
 * product counts from CATALOG), so Settings can't quietly disagree with the
 * screen it claims to configure.
 */

export { formatNaira };

/* ------------------------------------------------------------------ *
 * Pharmacy profile — the pharmacy-level identity
 * ------------------------------------------------------------------ */

export interface PharmacyProfile {
  /** Registered/legal name, used on documents. */
  name: string;
  /** What customers see on receipts and the storefront. */
  displayName: string;
  licenseNumber: string;
  description: string;
  /** Object URL from a picked file — in memory only, never persisted. */
  logoUrl: string | null;
  logoName: string | null;
}

export const INITIAL_PROFILE: PharmacyProfile = {
  name: "Zorpill Pharmacy Limited",
  displayName: "Zorpill Pharmacy",
  licenseNumber: "PCN/LAG/2019/04871",
  description:
    "Community pharmacy serving Ikeja and the wider Lagos mainland since 2019. Prescription dispensing, OTC, wellness and pharmacist-led consultations.",
  logoUrl: null,
  logoName: null,
};

/* ------------------------------------------------------------------ *
 * Business documents
 * ------------------------------------------------------------------ */

export interface BusinessDocument {
  id: string;
  label: string;
  hint: string;
  fileName: string | null;
  /** Bytes. Null when nothing has been uploaded yet. */
  fileSize: number | null;
  uploadedAt: number | null;
  /** Object URL for a file picked this session; null for the seeded rows. */
  url: string | null;
}

/** Aug 12 2026, written as a fixed timestamp so it never drifts. */
const AUG_12_2026 = new Date(2026, 7, 12).getTime();
const MAR_02_2026 = new Date(2026, 2, 2).getTime();

export const INITIAL_DOCUMENTS: BusinessDocument[] = [
  {
    id: "license",
    label: "Pharmacy license",
    hint: "Your PCN premises license",
    fileName: "pcn-premises-license-2026.pdf",
    fileSize: 248_320,
    uploadedAt: AUG_12_2026,
    url: null,
  },
  {
    id: "cac",
    label: "CAC / business registration",
    hint: "Certificate of incorporation",
    fileName: "cac-certificate.pdf",
    fileSize: 512_000,
    uploadedAt: MAR_02_2026,
    url: null,
  },
  {
    id: "other",
    label: "Other documents",
    hint: "Tax clearance, premises permit, anything else",
    fileName: null,
    fileSize: null,
    uploadedAt: null,
    url: null,
  },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ------------------------------------------------------------------ *
 * Receipt appearance
 * ------------------------------------------------------------------ */

export interface ReceiptSettings {
  showLogo: boolean;
  showStoreName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showCashier: boolean;
  showCustomer: boolean;
  showPaymentMethod: boolean;
  showTax: boolean;
  footerMessage: string;
  termsMessage: string;
}

export const INITIAL_RECEIPT: ReceiptSettings = {
  showLogo: true,
  showStoreName: true,
  showAddress: true,
  showPhone: true,
  showCashier: true,
  showCustomer: false,
  showPaymentMethod: true,
  showTax: true,
  footerMessage: "Thank you for shopping with us. Get well soon!",
  termsMessage: "Medicines are not returnable once dispensed. Other items may be returned within 7 days with this receipt.",
};

/** Every boolean row the receipt drawer renders, so the list lives in one place. */
export const RECEIPT_TOGGLES: {
  key: keyof ReceiptSettings;
  label: string;
  hint: string;
}[] = [
  { key: "showLogo", label: "Logo on receipt", hint: "Print your pharmacy logo at the top" },
  { key: "showStoreName", label: "Store name", hint: "Your display name, under the logo" },
  { key: "showAddress", label: "Address", hint: "The address of the branch that made the sale" },
  { key: "showPhone", label: "Phone number", hint: "So customers can reach that branch" },
  { key: "showCashier", label: "Show cashier name", hint: "Who served the customer" },
  { key: "showCustomer", label: "Show customer name", hint: "Only prints when a customer is attached" },
  { key: "showPaymentMethod", label: "Show payment method", hint: "Cash, transfer or card" },
  { key: "showTax", label: "Show tax / VAT", hint: "Break VAT out as its own line" },
];

/* ------------------------------------------------------------------ *
 * Hours — branch level
 * ------------------------------------------------------------------ */

/** A single trading window, as 24-hour "HH:MM" strings. */
export interface HoursPeriod {
  open: string;
  close: string;
}

export interface DayHours {
  closed: boolean;
  /** More than one entry models a lunchtime close: 8–1, then 2–8. */
  periods: HoursPeriod[];
}

/** Index 0 is Monday — the week starts where the table in the design starts. */
export type WeekHours = DayHours[];

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function week(open: string, close: string, sunday: DayHours): WeekHours {
  return [
    ...Array.from({ length: 6 }, () => ({ closed: false, periods: [{ open, close }] })),
    sunday,
  ];
}

const CLOSED: DayHours = { closed: true, periods: [] };

/** Formats "08:00" as "8:00 AM". */
export function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return hour + ":" + String(m).padStart(2, "0") + " " + suffix;
}

export function formatDayHours(day: DayHours): string {
  if (day.closed || day.periods.length === 0) return "Closed";
  return day.periods.map((p) => formatTime(p.open) + " – " + formatTime(p.close)).join(", ");
}

function sameHours(a: DayHours, b: DayHours): boolean {
  if (a.closed !== b.closed) return false;
  if (a.periods.length !== b.periods.length) return false;
  return a.periods.every((p, i) => p.open === b.periods[i].open && p.close === b.periods[i].close);
}

/**
 * Compact one-line summary of a week, e.g. "Mon–Sat · 8:00 AM – 8:00 PM".
 * Runs of consecutive days with identical hours collapse into a range; the
 * longest open run wins the headline so the hub card says something useful
 * rather than listing seven days.
 */
export function weekSummary(hours: WeekHours): string {
  const runs: { start: number; end: number; day: DayHours }[] = [];
  hours.forEach((day, i) => {
    const last = runs[runs.length - 1];
    if (last && sameHours(last.day, day)) last.end = i;
    else runs.push({ start: i, end: i, day });
  });

  const open = runs.filter((r) => !r.day.closed);
  if (open.length === 0) return "Closed all week";

  const headline = open.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));
  const label =
    headline.start === headline.end
      ? DAY_SHORT[headline.start]
      : DAY_SHORT[headline.start] + "–" + DAY_SHORT[headline.end];

  // Only *other open* runs earn a "+n more". Closed days are already implied by
  // the range, so the ordinary Mon–Sat-plus-closed-Sunday week reads clean.
  const others = open.length - 1;

  return (
    label +
    " · " +
    formatDayHours(headline.day) +
    (others > 0 ? " · +" + others + " more" : "")
  );
}

/* ------------------------------------------------------------------ *
 * Branches
 * ------------------------------------------------------------------ */

export interface ReceiptPrinter {
  name: string;
  paperWidth: "58mm" | "80mm";
  autoCut: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  /** The head location. Exactly one branch carries this. */
  isMain: boolean;
  active: boolean;
  hours: WeekHours;
  printer: ReceiptPrinter;
  /** Seeded from CATALOG so Settings and Inventory agree on the main branch. */
  productCount: number;
}

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: "main",
    name: "Main Branch Pharmacy",
    address: "14 Obafemi Awolowo Way",
    city: "Ikeja, Lagos",
    phone: "0803 412 7788",
    email: "ikeja@zorpill.ng",
    manager: STAFF[0],
    isMain: true,
    active: true,
    hours: week("08:00", "20:00", CLOSED),
    printer: { name: "Xprinter XP-58IIH", paperWidth: "58mm", autoCut: true },
    productCount: CATALOG.length,
  },
  {
    id: "lekki",
    name: "Lekki Branch",
    address: "7B Admiralty Way",
    city: "Lekki Phase 1, Lagos",
    phone: "0805 990 2143",
    email: "lekki@zorpill.ng",
    manager: STAFF[1] ?? STAFF[0],
    isMain: false,
    active: true,
    // Opens later and closes later than Ikeja, and takes a Sunday half-day.
    hours: [
      ...Array.from({ length: 6 }, () => ({
        closed: false,
        periods: [{ open: "09:00", close: "21:00" }],
      })),
      { closed: false, periods: [{ open: "12:00", close: "18:00" }] },
    ],
    printer: { name: "Epson TM-T82", paperWidth: "80mm", autoCut: true },
    productCount: 412,
  },
  {
    id: "abuja",
    name: "Abuja Branch",
    address: "22 Aminu Kano Crescent",
    city: "Wuse II, Abuja",
    phone: "0807 335 6019",
    email: "wuse@zorpill.ng",
    manager: STAFF[2] ?? STAFF[0],
    isMain: false,
    active: true,
    // Closes for lunch — the multiple-periods case, present in the seed data so
    // that path is exercised without the user having to build it by hand.
    hours: [
      ...Array.from({ length: 5 }, () => ({
        closed: false,
        periods: [
          { open: "08:00", close: "13:00" },
          { open: "14:00", close: "19:00" },
        ],
      })),
      { closed: false, periods: [{ open: "09:00", close: "16:00" }] },
      CLOSED,
    ],
    printer: { name: "Xprinter XP-80C", paperWidth: "80mm", autoCut: false },
    productCount: 287,
  },
];

export const PAPER_WIDTHS: ReceiptPrinter["paperWidth"][] = ["58mm", "80mm"];

export const MANAGERS = STAFF;

/* ------------------------------------------------------------------ *
 * Preferences — pharmacy level
 * ------------------------------------------------------------------ */

export interface SalesPreferences {
  /** Percent added to cost price when a product has no explicit sale price. */
  defaultMarkup: number;
  /** Percent. Seeded from pos-data's VAT_RATE so the two can't disagree. */
  vatRate: number;
  allowDiscounts: boolean;
  requireDiscountReason: boolean;
  allowNegativeStock: boolean;
}

export interface MedicinePreferences {
  requirePrescription: boolean;
  warnExpired: boolean;
  warnBelowReorder: boolean;
  preferEarliestExpiry: boolean;
}

export interface ReceiptPreferences {
  autoPrint: boolean;
  autoSms: boolean;
  autoEmail: boolean;
}

export interface Preferences {
  sales: SalesPreferences;
  medicines: MedicinePreferences;
  receipts: ReceiptPreferences;
}

export const INITIAL_PREFERENCES: Preferences = {
  sales: {
    defaultMarkup: 25,
    vatRate: VAT_RATE * 100,
    allowDiscounts: true,
    requireDiscountReason: true,
    allowNegativeStock: false,
  },
  medicines: {
    requirePrescription: true,
    warnExpired: true,
    warnBelowReorder: true,
    preferEarliestExpiry: true,
  },
  receipts: {
    autoPrint: true,
    autoSms: false,
    autoEmail: false,
  },
};

/* ------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------ */

export type NotificationChannel = "Email" | "SMS" | "In-app";

export const NOTIFICATION_CHANNELS: NotificationChannel[] = ["Email", "SMS", "In-app"];

export interface AlertSetting {
  id: string;
  title: string;
  description: string;
  /** Empty means the alert is off — there is no separate enabled flag. */
  channels: NotificationChannel[];
}

export const INITIAL_ALERTS: AlertSetting[] = [
  {
    id: "low-stock",
    title: "Low stock",
    description: "Get notified when products reach their reorder level.",
    channels: ["Email", "In-app"],
  },
  {
    id: "expiry",
    title: "Expiry warning",
    description: "Get notified when stock is approaching expiry.",
    channels: ["Email"],
  },
  {
    id: "purchase-order",
    title: "Purchase order",
    description: "Get notified when a purchase order is received or updated.",
    channels: ["In-app"],
  },
  {
    id: "daily-summary",
    title: "Daily sales summary",
    description: "Receive a summary of your pharmacy's daily sales.",
    channels: ["Email"],
  },
];

/** An alert with no channel selected is off, so the count falls out of the data. */
export function enabledAlertCount(alerts: AlertSetting[]): number {
  return alerts.filter((a) => a.channels.length > 0).length;
}

/* ------------------------------------------------------------------ *
 * Plan & billing
 * ------------------------------------------------------------------ */

export interface Plan {
  id: string;
  name: string;
  price: number;
  blurb: string;
  features: string[];
  aiCredits: number;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 15_000,
    blurb: "One branch, the essentials",
    features: ["1 branch", "Up to 3 staff", "Sales & inventory", "200 AI credits / month"],
    aiCredits: 200,
  },
  {
    id: "professional",
    name: "Professional",
    price: 45_000,
    blurb: "Multiple branches and full reporting",
    features: [
      "Up to 5 branches",
      "Unlimited staff",
      "Full reports & customer care",
      "1,000 AI credits / month",
    ],
    aiCredits: 1000,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 120_000,
    blurb: "For pharmacy groups",
    features: [
      "Unlimited branches",
      "Priority support",
      "Custom integrations",
      "5,000 AI credits / month",
    ],
    aiCredits: 5000,
  },
];

export interface Subscription {
  planId: string;
  /** Renewal date as a timestamp. */
  nextPaymentAt: number;
  cancelled: boolean;
}

export const INITIAL_SUBSCRIPTION: Subscription = {
  planId: "professional",
  nextPaymentAt: new Date(2026, 8, 15).getTime(),
  cancelled: false,
};

export interface AiCredits {
  total: number;
  used: number;
  /** What the credits went on, so "View usage" has something honest to show. */
  breakdown: { label: string; credits: number }[];
}

export const INITIAL_CREDITS: AiCredits = {
  total: 1000,
  used: 180,
  breakdown: [
    { label: "AI-assisted customer calls", credits: 124 },
    { label: "Drug interaction explanations", credits: 41 },
    { label: "Report insights", credits: 15 },
  ],
};

export interface Invoice {
  id: string;
  date: number;
  description: string;
  amount: number;
  status: "Paid" | "Pending" | "Failed";
}

export const INVOICES: Invoice[] = [
  {
    id: "INV-2026-0815",
    date: new Date(2026, 7, 15).getTime(),
    description: "Professional Plan · monthly",
    amount: 45_000,
    status: "Paid",
  },
  {
    id: "INV-2026-0722",
    date: new Date(2026, 6, 22).getTime(),
    description: "AI credit top-up · 500 credits",
    amount: 7_500,
    status: "Paid",
  },
  {
    id: "INV-2026-0715",
    date: new Date(2026, 6, 15).getTime(),
    description: "Professional Plan · monthly",
    amount: 45_000,
    status: "Paid",
  },
  {
    id: "INV-2026-0615",
    date: new Date(2026, 5, 15).getTime(),
    description: "Professional Plan · monthly",
    amount: 45_000,
    status: "Paid",
  },
  {
    id: "INV-2026-0515",
    date: new Date(2026, 4, 15).getTime(),
    description: "Professional Plan · monthly",
    amount: 45_000,
    status: "Paid",
  },
];

/* ------------------------------------------------------------------ *
 * Shared formatting
 * ------------------------------------------------------------------ */

export function formatSettingsDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}
