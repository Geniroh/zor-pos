import { CATALOG, STAFF } from "../pos/pos-data";

/**
 * Dummy data for the Customers & Care section.
 *
 * Deterministically generated (a seeded pseudo-random spread, not Math.random())
 * so every list, chart and total is stable across renders and reloads — same
 * technique as sales-history-data.ts / lost-sales-data.ts.
 */

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

export type Gender = "Male" | "Female" | "Not specified";

export interface CareCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: Gender;
  /** null for institutional accounts (clinics, care homes) — they have no age. */
  dob: number | null;
  createdAt: number;
  /** True when the customer has a clinical file (allergies, meds, consultations). */
  isPatient: boolean;
  address: string;
  bloodGroup: string;
  height: string;
  weight: string;
  notes: string;
}

export interface PurchaseItem {
  name: string;
  qty: number;
  unit: string;
}

export interface CarePurchase {
  id: string;
  /** null means the sale was never attributed to anyone — a walk-in. */
  customerId: string | null;
  date: number;
  items: PurchaseItem[];
  type: "Medication" | "General";
  total: number;
  servedBy: string;
  /** Who the medicine was bought for — often the customer, sometimes a dependant. */
  boughtFor: string;
}

export type AllergySeverity = "Mild" | "Moderate" | "Severe";

export interface Allergy {
  id: string;
  customerId: string;
  substance: string;
  reaction: string;
  severity: AllergySeverity;
  recordedAt: number;
}

export interface Medication {
  id: string;
  customerId: string;
  name: string;
  schedule: string;
  startedAt: number;
  prescriber: string;
  /** Days one dispensed pack lasts — with lastRefillAt, this drives the refill-due list. */
  supplyDays: number;
  lastRefillAt: number;
}

/**
 * Why the patient was seen. Note "Follow-up" lives here as a *reason*, never
 * as a standalone activity type: a follow-up is the scheduled intent, and the
 * activity is what actually happened when it was worked. A consultation with
 * this reason must carry closesFollowUpId.
 */
export type VisitReason =
  | "Medication review"
  | "New symptom"
  | "OTC request"
  | "Medication counselling"
  | "Follow-up"
  | "Other";

export const VISIT_REASONS: VisitReason[] = [
  "Medication review",
  "New symptom",
  "OTC request",
  "Medication counselling",
  "Follow-up",
  "Other",
];

export const OUTCOMES = ["Better", "Stable", "Needs review", "Referred to clinic", "Resolved"];

/** A consultation record — what actually happened, structured. */
export interface CareActivity {
  id: string;
  customerId: string;
  date: number;
  by: string;
  reason: VisitReason;
  /** Patient's own words. */
  concern: string;
  /** What the pharmacist identified. */
  assessment: string;
  /** What the pharmacist did or advised. */
  intervention: string;
  /** Recommended, dispensed, or existing medication discussed. */
  medication: string;
  outcome: string;
  /** The follow-up this visit closed, when reason is "Follow-up". */
  closesFollowUpId?: string;
  /** The follow-up this visit scheduled, if any. */
  producedFollowUpId?: string;
}

export type FollowUpStatus = "Scheduled" | "Completed" | "Missed";

export type ContactChannel = "Phone call" | "In-person" | "SMS";

/** The scheduled intent. Completing one produces a CareActivity. */
export interface FollowUp {
  id: string;
  customerId: string;
  dueAt: number;
  reason: string;
  channel: ContactChannel;
  status: FollowUpStatus;
  by: string;
  /** The CareActivity produced when this was worked. */
  outcomeActivityId?: string;
}

export type CallOutcome = "Reached" | "No answer" | "Left message";

/**
 * A simulated SMS or call. Sending is faked for now — when a messaging
 * backend lands, only the send itself changes; this record is the shape
 * the UI already reads.
 */
export interface ContactLog {
  id: string;
  customerId: string;
  channel: "SMS" | "Phone call";
  at: number;
  by: string;
  message: string;
  outcome?: CallOutcome;
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

/** Kept in sync with pos-data's CUSTOMERS so the two screens name the same people. */
const SEEDED: { name: string; gender: Gender; phone: string; institutional?: boolean }[] = [
  { name: "John Doe", gender: "Male", phone: "0803 123 4567" },
  { name: "Ngozi Adeyemi", gender: "Female", phone: "0803 441 2290" },
  { name: "Emeka Obi", gender: "Male", phone: "0812 776 0031" },
  { name: "Fatima Bello", gender: "Female", phone: "0706 220 9914" },
  { name: "St. Luke's Clinic", gender: "Not specified", phone: "0809 118 4400", institutional: true },
];

const MALE_FIRST = [
  "Tunde", "Chidi", "Musa", "Ibrahim", "Segun", "Kelechi",
  "Yusuf", "Obinna", "Femi", "Uche", "Bashir", "Ayodele",
];

const FEMALE_FIRST = [
  "Amaka", "Ifeoma", "Halima", "Bisi", "Chiamaka", "Zainab",
  "Adaeze", "Yetunde", "Nkechi", "Aisha", "Chinelo", "Folake",
];

const SURNAMES = [
  "Okafor", "Balogun", "Eze", "Danladi", "Adewale", "Nwosu",
  "Lawal", "Chukwu", "Abubakar", "Ogundipe", "Umeh", "Salami",
  "Ilori", "Onyeka", "Garba", "Adebayo",
];

const INSTITUTIONS = ["Grace Maternity Home", "Redeemer's Staff Clinic", "Hilltop Care Home"];

const STREETS = [
  "12 Awolowo Road, Ikoyi", "45 Aba Road, Port Harcourt", "8 Ahmadu Bello Way, Abuja",
  "31 Ogui Road, Enugu", "7 Ring Road, Ibadan", "22 Zoo Road, Kano",
  "3 Marian Road, Calabar", "19 Airport Road, Warri",
];

const BLOOD_GROUPS = ["O+", "O−", "A+", "A−", "B+", "B−", "AB+"];

const CHRONIC_NOTES = [
  "No chronic condition recorded.",
  "Hypertensive — on long-term therapy.",
  "Type 2 diabetes, diet-controlled.",
  "Mild persistent asthma.",
  "No chronic condition recorded.",
  "Sickle cell trait (AS).",
];

function customerName(i: number): { name: string; gender: Gender; institutional: boolean } {
  if (i < SEEDED.length) {
    const s = SEEDED[i];
    return { name: s.name, gender: s.gender, institutional: Boolean(s.institutional) };
  }
  const n = i - SEEDED.length;
  // Every 17th non-seeded entry is an institutional account rather than a person.
  if (n % 17 === 16) {
    return { name: INSTITUTIONS[(n / 17) % INSTITUTIONS.length | 0], gender: "Not specified", institutional: true };
  }
  const male = n % 2 === 0;
  const first = male ? MALE_FIRST[(n * 5) % MALE_FIRST.length] : FEMALE_FIRST[(n * 3) % FEMALE_FIRST.length];
  const last = SURNAMES[(n * 7) % SURNAMES.length];
  return { name: first + " " + last, gender: male ? "Male" : "Female", institutional: false };
}

function seededCustomer(i: number): CareCustomer {
  const { name, gender, institutional } = customerName(i);
  const age = 9 + ((i * 11) % 62); // 9–70
  const isPatient = institutional ? false : (i * 3) % 7 < 4; // ~57% of people have a clinical file

  return {
    id: "CUS-" + String(i + 1).padStart(4, "0"),
    name,
    phone: "080" + ((i % 9) + 1) + " " + (100 + ((i * 37) % 900)) + " " + (1000 + ((i * 173) % 9000)),
    email: name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "") + "@mail.com",
    gender,
    dob: institutional ? null : now - age * 365 * DAY - ((i * 61) % 365) * DAY,
    createdAt: now - ((i * 53) % 1050) * DAY, // spread across ~3 years
    isPatient,
    address: STREETS[(i * 3) % STREETS.length],
    bloodGroup: institutional ? "—" : BLOOD_GROUPS[(i * 5) % BLOOD_GROUPS.length],
    height: institutional || i % 3 === 0 ? "—" : 150 + ((i * 7) % 40) + " cm",
    weight: institutional || i % 4 === 0 ? "—" : 52 + ((i * 9) % 45) + " kg",
    notes: institutional ? "Institutional account." : CHRONIC_NOTES[(i * 5) % CHRONIC_NOTES.length],
  };
}

export const CARE_CUSTOMERS: CareCustomer[] = Array.from({ length: 62 }, (_, i) => seededCustomer(i));

export const PATIENTS: CareCustomer[] = CARE_CUSTOMERS.filter((c) => c.isPatient);

export function findCustomer(id: string): CareCustomer | undefined {
  return CARE_CUSTOMERS.find((c) => c.id === id);
}

/**
 * Adds a customer created at runtime (the New patient modal) to the in-memory
 * dataset, so their detail page resolves and they show up in the directory.
 * This is an append to a module array, not persistence — it lasts until the
 * window reloads, and the second (Sales History) window never sees it.
 */
export function registerCustomer(input: {
  name: string;
  phone: string;
  email: string;
  gender: Gender;
  dob: number | null;
  isPatient: boolean;
}): CareCustomer {
  const customer: CareCustomer = {
    id: "CUS-" + String(CARE_CUSTOMERS.length + 1).padStart(4, "0"),
    name: input.name,
    phone: input.phone || "—",
    email: input.email || "—",
    gender: input.gender,
    dob: input.dob,
    createdAt: Date.now(),
    isPatient: input.isPatient,
    address: "—",
    bloodGroup: "—",
    height: "—",
    weight: "—",
    notes: "No chronic condition recorded.",
  };
  CARE_CUSTOMERS.push(customer);
  if (customer.isPatient) PATIENTS.push(customer);
  return customer;
}

export function ageOf(customer: CareCustomer): string {
  if (customer.dob === null) return "—";
  return Math.floor((now - customer.dob) / (365.25 * DAY)) + " years";
}

/* ------------------------------------------------------------------ */
/* Purchases                                                           */
/* ------------------------------------------------------------------ */

const UNITS = ["caps", "tabs", "sachets", "bottle", "tube"];

const DEPENDANTS = ["a dependant", "spouse", "child"];

function seededPurchase(i: number): CarePurchase {
  // ~28% of sales are never attributed to a customer — those are the walk-ins.
  const walkIn = (i * 4) % 14 < 4;
  const customer = walkIn ? null : CARE_CUSTOMERS[(i * 13) % CARE_CUSTOMERS.length];

  const itemCount = 1 + ((i * 3) % 3);
  const items: PurchaseItem[] = Array.from({ length: itemCount }, (_, k) => {
    const product = CATALOG[(i * 7 + k * 11) % CATALOG.length];
    return {
      name: product.name,
      qty: 5 * (1 + ((i + k) % 6)),
      unit: UNITS[(i + k) % UNITS.length],
    };
  });

  // Dependants only apply to real people, and only occasionally.
  const boughtFor =
    !customer || customer.dob === null || i % 9 !== 0
      ? (customer?.name ?? "Walk-in Customer")
      : customer.name.split(" ")[0] + "'s " + DEPENDANTS[(i / 9) % DEPENDANTS.length | 0];

  return {
    id: "INV-" + (1070000000 + i * 131),
    customerId: customer?.id ?? null,
    date: now - ((i * 43) % 330) * DAY - ((i * 17) % 12) * 60 * 60 * 1000,
    items,
    type: (i * 5) % 8 < 5 ? "Medication" : "General",
    total: 800 + ((i * 917) % 26000),
    servedBy: STAFF[i % STAFF.length],
    boughtFor,
  };
}

export const CARE_PURCHASES: CarePurchase[] = Array.from({ length: 340 }, (_, i) => seededPurchase(i)).sort(
  (a, b) => b.date - a.date,
);

export function purchasesFor(customerId: string): CarePurchase[] {
  return CARE_PURCHASES.filter((p) => p.customerId === customerId);
}

/* ------------------------------------------------------------------ */
/* Clinical records                                                    */
/* ------------------------------------------------------------------ */

const ALLERGENS: { substance: string; reaction: string; severity: AllergySeverity }[] = [
  { substance: "Penicillin", reaction: "Rash", severity: "Severe" },
  { substance: "Sulfa drugs", reaction: "Hives and swelling", severity: "Moderate" },
  { substance: "Aspirin", reaction: "Wheezing", severity: "Moderate" },
  { substance: "Peanuts", reaction: "Throat tightness", severity: "Severe" },
  { substance: "Codeine", reaction: "Nausea and dizziness", severity: "Mild" },
  { substance: "Ibuprofen", reaction: "Stomach upset", severity: "Mild" },
];

const REGIMENS: { name: string; schedule: string }[] = [
  { name: "Lisinopril 10mg", schedule: "1 tab daily" },
  { name: "Metformin 500mg", schedule: "1 tab twice daily" },
  { name: "Amlodipine 5mg", schedule: "1 tab at night" },
  { name: "Salbutamol inhaler", schedule: "2 puffs as needed" },
  { name: "Atorvastatin 20mg", schedule: "1 tab at night" },
  { name: "Folic acid 5mg", schedule: "1 tab daily" },
];

export const ALLERGIES: Allergy[] = PATIENTS.flatMap((c, p) => {
  const count = p % 7 === 0 ? 2 : p % 3 === 0 ? 0 : 1;
  return Array.from({ length: count }, (_, k) => {
    const a = ALLERGENS[(p * 3 + k * 2) % ALLERGENS.length];
    return {
      id: "ALG-" + c.id + "-" + k,
      customerId: c.id,
      ...a,
      recordedAt: now - ((p * 29 + k * 40) % 700) * DAY,
    };
  });
});

/** Pharmacists log most consultations; visiting doctors log the rest. */
export const CLINICIANS: string[] = [
  "Dr. Emmanuel",
  "Dr. Okafor",
  "Dr. Adaora",
  "Dr. Suleiman",
  ...STAFF,
];

const SUPPLY_DAYS = [30, 30, 60, 28, 90];

export const MEDICATIONS: Medication[] = PATIENTS.flatMap((c, p) => {
  const count = 1 + ((p * 2) % 3);
  return Array.from({ length: count }, (_, k) => {
    const r = REGIMENS[(p * 5 + k * 3) % REGIMENS.length];
    return {
      id: "MED-" + c.id + "-" + k,
      customerId: c.id,
      name: r.name,
      schedule: r.schedule,
      startedAt: now - ((p * 23 + k * 31) % 500) * DAY,
      prescriber: CLINICIANS[(p + k) % CLINICIANS.length],
      supplyDays: SUPPLY_DAYS[(p + k) % SUPPLY_DAYS.length],
      // Spread wide enough that a realistic slice of these read as overdue.
      lastRefillAt: now - ((p * 17 + k * 29) % 130) * DAY,
    };
  });
});

const FOLLOWUP_REASONS = [
  "Blood pressure re-check",
  "Refill due",
  "Post-antibiotic review",
  "Blood sugar check",
  "Adherence check-in",
];

const CHANNELS: ContactChannel[] = ["Phone call", "In-person", "SMS"];

export const FOLLOW_UPS: FollowUp[] = PATIENTS.flatMap((c, p) => {
  const count = p % 4 === 3 ? 0 : 1 + (p % 2);
  return Array.from({ length: count }, (_, k) => {
    // Roughly a third sit in the future (Scheduled); the rest are history.
    const offset = ((p * 19 + k * 53) % 120) - 40; // −40 … +79 days from now
    const dueAt = now + offset * DAY;
    const status: FollowUpStatus =
      dueAt > now ? "Scheduled" : (p + k) % 5 === 0 ? "Missed" : "Completed";
    return {
      id: "FUP-" + c.id + "-" + k,
      customerId: c.id,
      dueAt,
      reason: FOLLOWUP_REASONS[(p + k * 2) % FOLLOWUP_REASONS.length],
      channel: CHANNELS[(p + k) % CHANNELS.length],
      status,
      by: CLINICIANS[(p + k) % CLINICIANS.length],
    };
  });
});

/** Realistic pharmacy encounters, so the consultation log reads like real notes. */
const SCENARIOS: Omit<CareActivity, "id" | "customerId" | "date" | "by">[] = [
  {
    reason: "Medication review",
    concern: "Wants to know whether she still needs all her tablets.",
    assessment: "Two antihypertensives with overlapping action; BP well controlled at 128/82.",
    intervention: "Advised continuing current doses, recheck weekly at home. Flagged possible duplication to prescriber.",
    medication: "Lisinopril 10mg, Amlodipine 5mg (existing)",
    outcome: "Stable",
  },
  {
    reason: "New symptom",
    concern: "Persistent dry cough for 5 days, worse at night.",
    assessment: "Cough began about 3 weeks after starting lisinopril — consistent with ACE-inhibitor cough.",
    intervention: "Referred back to prescriber to consider an ARB. Advised not to stop the tablet abruptly.",
    medication: "Lisinopril 10mg (existing)",
    outcome: "Referred to clinic",
  },
  {
    reason: "OTC request",
    concern: "Asked for something strong for a headache.",
    assessment: "Takes daily aspirin; no red-flag features on questioning.",
    intervention: "Advised paracetamol rather than an NSAID to avoid additive bleeding risk.",
    medication: "Paracetamol 500mg (recommended)",
    outcome: "Resolved",
  },
  {
    reason: "Medication counselling",
    concern: "Unsure how to use the new inhaler.",
    assessment: "Poor technique — actuating before starting to inhale.",
    intervention: "Demonstrated technique, had patient repeat it back, supplied a spacer.",
    medication: "Salbutamol inhaler (existing)",
    outcome: "Better",
  },
  {
    reason: "Medication review",
    concern: "Reports feeling dizzy on standing in the mornings.",
    assessment: "Taking amlodipine and lisinopril together on waking; postural drop likely.",
    intervention: "Suggested moving amlodipine to bedtime. Advised rising slowly.",
    medication: "Amlodipine 5mg (existing)",
    outcome: "Needs review",
  },
  {
    reason: "New symptom",
    concern: "Stomach pain since starting a new painkiller.",
    assessment: "Ibuprofen taken on an empty stomach; no alarm symptoms.",
    intervention: "Advised taking with food and switched to paracetamol meanwhile.",
    medication: "Ibuprofen 400mg (existing), Paracetamol 500mg (recommended)",
    outcome: "Better",
  },
  {
    reason: "Other",
    concern: "Came in for a blood pressure check.",
    assessment: "142/90 on two readings taken 20 minutes apart.",
    intervention: "Advised home monitoring for two weeks and booked a re-check.",
    medication: "None",
    outcome: "Needs review",
  },
  {
    reason: "OTC request",
    concern: "Fever and body aches for two days, wants a malaria test.",
    assessment: "Rapid test positive; no vomiting or danger signs.",
    intervention: "Dispensed ACT with counselling on completing the full course.",
    medication: "Artemether/Lumefantrine (dispensed)",
    outcome: "Resolved",
  },
];

/** What a worked follow-up looks like once it's been closed out. */
const CLOSURE_SCENARIOS: Omit<CareActivity, "id" | "customerId" | "date" | "by" | "reason">[] = [
  {
    concern: "Scheduled blood pressure re-check.",
    assessment: "Home readings averaging 130/84 over the past two weeks.",
    intervention: "Advised continuing current therapy; next review in three months.",
    medication: "Lisinopril 10mg (existing)",
    outcome: "Better",
  },
  {
    concern: "Called about the refill that was due.",
    assessment: "Two weeks late collecting; reports running out over the weekend.",
    intervention: "Arranged collection and counselled on not skipping doses.",
    medication: "Metformin 500mg (existing)",
    outcome: "Stable",
  },
  {
    concern: "Post-antibiotic review after the chest infection.",
    assessment: "Course completed; cough resolved, no fever.",
    intervention: "No further treatment needed. Advised to return if symptoms recur.",
    medication: "Amoxicillin 500mg (completed)",
    outcome: "Resolved",
  },
  {
    concern: "Adherence check-in on the new regimen.",
    assessment: "Missing the evening dose most days — forgetting rather than side effects.",
    intervention: "Set up a pill organiser and a phone reminder. Re-check in a month.",
    medication: "Atorvastatin 20mg (existing)",
    outcome: "Needs review",
  },
];

/**
 * Two sources: ordinary walk-in consultations, plus one closure record for
 * every follow-up that was worked. The second group is what enforces
 * "completing a follow-up produces an activity" in the seeded data too.
 */
export const CARE_ACTIVITIES: CareActivity[] = (() => {
  const walkIns: CareActivity[] = PATIENTS.flatMap((c, p) => {
    const count = 1 + ((p * 3) % 3);
    return Array.from({ length: count }, (_, k) => ({
      id: "ACT-" + c.id + "-" + k,
      customerId: c.id,
      date: now - ((p * 13 + k * 47) % 240) * DAY,
      by: CLINICIANS[(p + k) % CLINICIANS.length],
      ...SCENARIOS[(p * 2 + k) % SCENARIOS.length],
    }));
  });

  const closures: CareActivity[] = FOLLOW_UPS.filter((f) => f.status === "Completed").map((f, i) => {
    const activity: CareActivity = {
      id: "ACT-close-" + f.id,
      customerId: f.customerId,
      // Worked on or shortly after the day it was due.
      date: f.dueAt + (i % 3) * DAY,
      by: f.by,
      reason: "Follow-up",
      closesFollowUpId: f.id,
      ...CLOSURE_SCENARIOS[i % CLOSURE_SCENARIOS.length],
    };
    f.outcomeActivityId = activity.id;
    return activity;
  });

  return [...walkIns, ...closures].sort((a, b) => b.date - a.date);
})();

/** Simulated SMS/call history. Real sending arrives with the backend. */
export const CONTACT_LOG: ContactLog[] = PATIENTS.filter((_, p) => p % 3 === 0).map((c, i) => ({
  id: "CON-" + c.id,
  customerId: c.id,
  channel: i % 2 === 0 ? "SMS" : "Phone call",
  at: now - ((i * 23) % 90) * DAY,
  by: STAFF[i % STAFF.length],
  message:
    i % 2 === 0
      ? "Hello " + c.name.split(" ")[0] + ", your refill at Zorpill Pharmacy is due. Reply or call us to arrange collection."
      : "Reminder call about upcoming review.",
  outcome: i % 2 === 0 ? undefined : (["Reached", "No answer", "Left message"] as const)[i % 3],
}));

export function allergiesFor(customerId: string): Allergy[] {
  return ALLERGIES.filter((a) => a.customerId === customerId);
}

export function medicationsFor(customerId: string): Medication[] {
  return MEDICATIONS.filter((m) => m.customerId === customerId);
}

export function activitiesFor(customerId: string): CareActivity[] {
  return CARE_ACTIVITIES.filter((a) => a.customerId === customerId);
}

export function followUpsFor(customerId: string): FollowUp[] {
  return FOLLOW_UPS.filter((f) => f.customerId === customerId).sort((a, b) => b.dueAt - a.dueAt);
}

export function contactsFor(customerId: string): ContactLog[] {
  return CONTACT_LOG.filter((c) => c.customerId === customerId).sort((a, b) => b.at - a.at);
}

/** Most recent consultation, used by the detail page's alert cards. */
export function lastConsultation(customerId: string): CareActivity | undefined {
  return activitiesFor(customerId).sort((a, b) => b.date - a.date)[0];
}

export function nextFollowUp(customerId: string): FollowUp | undefined {
  return followUpsFor(customerId)
    .filter((f) => f.status === "Scheduled")
    .sort((a, b) => a.dueAt - b.dueAt)[0];
}

/* ------------------------------------------------------------------ */
/* Mutators                                                            */
/* ------------------------------------------------------------------ */

/*
 * These append to the module arrays so a follow-up closed in the queue shows
 * up on that customer's folder, and a consultation logged on the folder shows
 * up in the consultation log. It lasts until the window reloads — there's no
 * store and no persistence, and the Sales History window never sees any of it.
 * Callers still keep their own copy in React state for an immediate re-render.
 */

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  return prefix + "-live-" + sequence;
}

export function saveConsultation(input: Omit<CareActivity, "id">): CareActivity {
  const activity: CareActivity = { ...input, id: nextId("ACT") };
  CARE_ACTIVITIES.unshift(activity);
  return activity;
}

export function scheduleFollowUp(input: Omit<FollowUp, "id">): FollowUp {
  const followUp: FollowUp = { ...input, id: nextId("FUP") };
  FOLLOW_UPS.push(followUp);
  return followUp;
}

/**
 * Closing a follow-up always produces a CareActivity — that link is the whole
 * point of keeping the two entities separate, so there's no path here that
 * marks one done without a record.
 */
export function completeFollowUp(
  followUpId: string,
  activity: Omit<CareActivity, "id" | "reason" | "closesFollowUpId">,
): { activity: CareActivity; followUp: FollowUp | undefined } {
  const saved = saveConsultation({ ...activity, reason: "Follow-up", closesFollowUpId: followUpId });
  const followUp = FOLLOW_UPS.find((f) => f.id === followUpId);
  if (followUp) {
    followUp.status = "Completed";
    followUp.outcomeActivityId = saved.id;
  }
  return { activity: saved, followUp };
}

export function rescheduleFollowUp(followUpId: string, dueAt: number): FollowUp | undefined {
  const followUp = FOLLOW_UPS.find((f) => f.id === followUpId);
  if (followUp) {
    followUp.dueAt = dueAt;
    followUp.status = "Scheduled";
  }
  return followUp;
}

export function logContact(input: Omit<ContactLog, "id">): ContactLog {
  const contact: ContactLog = { ...input, id: nextId("CON") };
  CONTACT_LOG.unshift(contact);
  return contact;
}

/* ------------------------------------------------------------------ */
/* Outreach lists — all derived, nothing new stored                    */
/* ------------------------------------------------------------------ */

export interface OutreachEntry {
  customerId: string;
  name: string;
  phone: string;
  /** The line that explains why they're on this list. */
  detail: string;
  /** Days overdue / days since — drives sort order and urgency styling. */
  days: number;
  lastContactedAt: number | null;
}

function contactedAt(customerId: string): number | null {
  const contacts = contactsFor(customerId);
  return contacts.length ? contacts[0].at : null;
}

/** On a chronic medicine, and the supply they last collected has run out. */
export function refillDueList(): OutreachEntry[] {
  const entries: OutreachEntry[] = [];
  for (const m of MEDICATIONS) {
    const dueAt = m.lastRefillAt + m.supplyDays * DAY;
    if (dueAt > now) continue;
    const customer = findCustomer(m.customerId);
    if (!customer) continue;
    entries.push({
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      detail: m.name + " · " + m.supplyDays + "-day supply, collected " + formatDate(m.lastRefillAt),
      days: Math.floor((now - dueAt) / DAY),
      lastContactedAt: contactedAt(customer.id),
    });
  }
  return entries.sort((a, b) => b.days - a.days);
}

/** Bought regularly once, then stopped. */
export function lapsedList(): OutreachEntry[] {
  const last = new Map<string, { at: number; orders: number }>();
  for (const p of CARE_PURCHASES) {
    if (!p.customerId) continue;
    const entry = last.get(p.customerId) ?? { at: 0, orders: 0 };
    entry.at = Math.max(entry.at, p.date);
    entry.orders += 1;
    last.set(p.customerId, entry);
  }

  const entries: OutreachEntry[] = [];
  for (const [customerId, { at, orders }] of last) {
    const days = Math.floor((now - at) / DAY);
    if (days < 90 || orders < 2) continue;
    const customer = findCustomer(customerId);
    if (!customer) continue;
    entries.push({
      customerId,
      name: customer.name,
      phone: customer.phone,
      detail: orders + " previous orders · last on " + formatDate(at),
      days,
      lastContactedAt: contactedAt(customerId),
    });
  }
  return entries.sort((a, b) => a.days - b.days);
}

/** Follow-ups that went past their due date unworked. */
export function missedFollowUpList(): OutreachEntry[] {
  return FOLLOW_UPS.filter((f) => f.status === "Missed")
    .map((f) => {
      const customer = findCustomer(f.customerId);
      return {
        customerId: f.customerId,
        name: customer?.name ?? f.customerId,
        phone: customer?.phone ?? "—",
        detail: f.reason + " · was due " + formatDate(f.dueAt),
        days: Math.floor((now - f.dueAt) / DAY),
        lastContactedAt: contactedAt(f.customerId),
      };
    })
    .sort((a, b) => b.days - a.days);
}

/** Birthday this month — goodwill, not care. */
export function birthdayList(): OutreachEntry[] {
  const month = new Date().getMonth();
  const today = new Date().getDate();
  return CARE_CUSTOMERS.filter((c) => c.dob !== null && new Date(c.dob).getMonth() === month)
    .map((c) => {
      const d = new Date(c.dob as number);
      return {
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        detail: "Turns " + (new Date().getFullYear() - d.getFullYear()) + " on " + d.getDate() + " " + MONTHS_SHORT[month],
        days: d.getDate() - today,
        lastContactedAt: contactedAt(c.id),
      };
    })
    .sort((a, b) => a.days - b.days);
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return String(d.getDate()).padStart(2, "0") + " " + MONTHS_SHORT[d.getMonth()] + " " + d.getFullYear();
}

export function monthLabel(year: number, month: number): string {
  return MONTHS_SHORT[month] + " " + String(year).slice(2);
}

/** "In 3 days" / "2 days ago" / "Today" — relative wording for follow-up cards. */
export function relativeDays(ts: number): string {
  const days = Math.round((ts - now) / DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? "In " + days + " days" : Math.abs(days) + " days ago";
}
