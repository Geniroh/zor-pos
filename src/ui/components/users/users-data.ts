import { STAFF } from "../pos/pos-data";
import { INITIAL_BRANCHES } from "../settings/settings-data";

/**
 * Seed data for Users & Roles. Same contract as the rest of the app: dummy
 * data over local state, nothing random, nothing persisted.
 *
 * The access model is `user → role → permissions + branch scope`, kept as two
 * separate ideas throughout: the **role** says what someone may do, the
 * **branch scope** says where. They are stored in different fields and shown
 * on different lines everywhere in the UI.
 *
 * The first four users reuse the names in pos-data's STAFF, so the person who
 * "served" a sale is a real user you can open here.
 */

/**
 * Module-load timestamp. Relative labels ("5 min ago") are inherently
 * now-relative, so offsets are measured from this single fixed point rather
 * than calling Date.now() per render — that keeps every row stable for the
 * life of the session instead of drifting between renders.
 */
const NOW = Date.now();

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/* ------------------------------------------------------------------ *
 * Roles
 * ------------------------------------------------------------------ */

export type RoleId =
  | "owner"
  | "pharmacy-admin"
  | "branch-manager"
  | "pharmacist"
  | "pharmacy-technician"
  | "cashier"
  | "inventory-manager";

/**
 * How much of the pharmacy a role can be scoped to. This is what keeps the
 * branch picker honest without the admin having to reason about it:
 * - "all"    — inherently pharmacy-wide; scope isn't editable
 * - "single" — responsible for exactly one location
 * - "multi"  — can work across any set of branches
 */
export type ScopeKind = "all" | "single" | "multi";

export interface Role {
  id: RoleId;
  name: string;
  /** One line, shown under the role name in lists. */
  summary: string;
  /** The "can do" half of the add-user summary. */
  can: string;
  /** The "cannot do" half. */
  cannot: string;
  scope: ScopeKind;
  /** System roles can't be edited or deleted. All of them are, for now. */
  system: true;
}

export const ROLES: Role[] = [
  {
    id: "owner",
    name: "Owner",
    summary: "Full control of the pharmacy, including billing.",
    can: "Do everything, across every branch, including billing and cancelling the plan.",
    cannot: "Nothing is restricted.",
    scope: "all",
    system: true,
  },
  {
    id: "pharmacy-admin",
    name: "Pharmacy Administrator",
    summary: "Runs the business day to day across all branches.",
    can: "Configure the pharmacy, manage users, inventory, sales and reports across every branch.",
    cannot: "Change role definitions or manage billing.",
    scope: "all",
    system: true,
  },
  {
    id: "branch-manager",
    name: "Branch Manager",
    summary: "Everything relevant to their own branch.",
    can: "Run sales, stock, purchasing and reporting for their branch, including refunds and voids.",
    cannot: "Manage users, roles or pharmacy-wide settings.",
    scope: "single",
    system: true,
  },
  {
    id: "pharmacist",
    name: "Pharmacist",
    summary: "Dispensing, clinical care and sales.",
    can: "Dispense medicines, manage customers and their clinical records, and perform sales.",
    cannot: "Manage users, pharmacy settings, or create products.",
    scope: "multi",
    system: true,
  },
  {
    id: "pharmacy-technician",
    name: "Pharmacy Technician",
    summary: "Dispensing support and stock handling.",
    can: "Assist with dispensing under supervision, sell at the till and adjust stock with approval.",
    cannot: "Access clinical records, edit customers, or view reports.",
    scope: "multi",
    system: true,
  },
  {
    id: "cashier",
    name: "Cashier",
    summary: "The till, and basic customer details.",
    can: "Take sales and look up basic customer information.",
    cannot: "Void or refund sales, touch stock, or see reports.",
    scope: "multi",
    system: true,
  },
  {
    id: "inventory-manager",
    name: "Inventory Manager",
    summary: "Products, stock, purchasing and suppliers.",
    can: "Create and adjust products, manage stock and raise purchase orders.",
    cannot: "Sell at the till or access customer records.",
    scope: "multi",
    system: true,
  },
];

export function roleById(id: RoleId): Role {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

/* ------------------------------------------------------------------ *
 * Permissions
 * ------------------------------------------------------------------ */

/**
 * Three states, not two. "approval" is a real answer to "can a pharmacist
 * refund a sale?" — yes, but a manager has to sign it off — and collapsing it
 * to a tick or a dash would misdescribe how a pharmacy actually runs.
 */
export type PermissionLevel = "yes" | "approval" | "no";

export interface Permission {
  id: string;
  label: string;
}

export interface PermissionGroup {
  id: string;
  label: string;
  permissions: Permission[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "sales",
    label: "Sales",
    permissions: [
      { id: "view-sales", label: "View sales" },
      { id: "create-sale", label: "Create sale" },
      { id: "void-sale", label: "Void sale" },
      { id: "refund-sale", label: "Refund sale" },
      { id: "apply-discount", label: "Apply discount" },
    ],
  },
  {
    id: "stock",
    label: "Products & Stock",
    permissions: [
      { id: "view-products", label: "View products" },
      { id: "adjust-stock", label: "Adjust stock" },
      { id: "create-products", label: "Create products" },
      { id: "manage-purchase-orders", label: "Manage purchase orders" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    permissions: [
      { id: "view-customers", label: "View customers" },
      { id: "edit-customers", label: "Edit customers" },
      { id: "view-clinical", label: "View clinical information" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    permissions: [
      { id: "view-sales-reports", label: "View sales reports" },
      { id: "view-financial-reports", label: "View financial reports" },
      { id: "export-reports", label: "Export reports" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    permissions: [
      { id: "manage-users", label: "Manage users" },
      { id: "manage-roles", label: "Manage roles" },
      { id: "manage-settings", label: "Manage pharmacy settings" },
    ],
  },
];

export const ALL_PERMISSION_IDS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.id),
);

type Matrix = Record<string, PermissionLevel>;

/** Everything allowed — the Owner's row, and the base other roles pare down. */
function allYes(): Matrix {
  return Object.fromEntries(ALL_PERMISSION_IDS.map((id) => [id, "yes" as const]));
}

/** Nothing allowed — the base the narrower roles build up from. */
function allNo(): Matrix {
  return Object.fromEntries(ALL_PERMISSION_IDS.map((id) => [id, "no" as const]));
}

export const ROLE_PERMISSIONS: Record<RoleId, Matrix> = {
  owner: allYes(),

  "pharmacy-admin": {
    ...allYes(),
    // The one real boundary between Owner and Administrator inside the matrix:
    // role definitions belong to whoever owns the pharmacy. (Billing is the
    // other, and lives in Settings rather than here.)
    "manage-roles": "no",
  },

  "branch-manager": {
    ...allNo(),
    "view-sales": "yes",
    "create-sale": "yes",
    "void-sale": "yes",
    "refund-sale": "yes",
    "apply-discount": "yes",
    "view-products": "yes",
    "adjust-stock": "yes",
    "manage-purchase-orders": "yes",
    "view-customers": "yes",
    "edit-customers": "yes",
    "view-sales-reports": "yes",
    "view-financial-reports": "yes",
    "export-reports": "yes",
  },

  pharmacist: {
    ...allNo(),
    "view-sales": "yes",
    "create-sale": "yes",
    "refund-sale": "approval",
    "apply-discount": "approval",
    "view-products": "yes",
    "view-customers": "yes",
    "edit-customers": "yes",
    "view-clinical": "yes",
    "view-sales-reports": "yes",
  },

  "pharmacy-technician": {
    ...allNo(),
    "view-sales": "yes",
    "create-sale": "yes",
    "view-products": "yes",
    "adjust-stock": "approval",
    "view-customers": "yes",
  },

  cashier: {
    ...allNo(),
    "view-sales": "yes",
    "create-sale": "yes",
    "apply-discount": "approval",
    "view-products": "yes",
    "view-customers": "yes",
  },

  "inventory-manager": {
    ...allNo(),
    "view-sales": "yes",
    "view-products": "yes",
    "adjust-stock": "yes",
    "create-products": "yes",
    "manage-purchase-orders": "yes",
    "export-reports": "yes",
  },
};

export function levelFor(roleId: RoleId, permissionId: string): PermissionLevel {
  return ROLE_PERMISSIONS[roleId][permissionId] ?? "no";
}

/** Count of outright-allowed permissions, for the role cards' meta line. */
export function allowedCount(roleId: RoleId): number {
  return ALL_PERMISSION_IDS.filter((id) => levelFor(roleId, id) !== "no").length;
}

/* ------------------------------------------------------------------ *
 * Users
 * ------------------------------------------------------------------ */

export type UserStatus = "Active" | "Suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: RoleId;
  /**
   * Branch ids this user can work in. Roles with scope "all" carry an empty
   * array and are rendered as "All branches" — storing every branch id would
   * mean a new branch silently failing to reach existing admins.
   */
  branchIds: string[];
  status: UserStatus;
  twoFactorEnabled: boolean;
  lastActiveAt: number;
  joinedAt: number;
  /** Who set this user's role — shown read-only on their own profile. */
  roleAssignedBy: string;
}

const MAIN = INITIAL_BRANCHES[0].id;
const LEKKI = INITIAL_BRANCHES[1].id;
const ABUJA = INITIAL_BRANCHES[2].id;

export const USERS: User[] = [
  {
    id: "u-01",
    name: STAFF[0],
    email: "chibuzor@zorpill.ng",
    phone: "0803 412 7788",
    roleId: "owner",
    branchIds: [],
    status: "Active",
    twoFactorEnabled: true,
    lastActiveAt: NOW - 4 * MIN,
    joinedAt: new Date(2019, 4, 2).getTime(),
    roleAssignedBy: "System",
  },
  {
    id: "u-02",
    name: STAFF[1],
    email: "amaka@zorpill.ng",
    phone: "0805 221 9043",
    roleId: "pharmacy-admin",
    branchIds: [],
    status: "Active",
    twoFactorEnabled: true,
    lastActiveAt: NOW - 26 * MIN,
    joinedAt: new Date(2021, 0, 18).getTime(),
    roleAssignedBy: STAFF[0],
  },
  {
    id: "u-03",
    name: STAFF[2],
    email: "tunde@zorpill.ng",
    phone: "0807 655 1120",
    roleId: "branch-manager",
    branchIds: [LEKKI],
    status: "Active",
    twoFactorEnabled: true,
    lastActiveAt: NOW - 3 * HOUR,
    joinedAt: new Date(2022, 6, 11).getTime(),
    roleAssignedBy: STAFF[1],
  },
  {
    id: "u-04",
    name: STAFF[3],
    email: "ifeoma@zorpill.ng",
    phone: "0806 330 7742",
    roleId: "pharmacist",
    branchIds: [MAIN, LEKKI],
    status: "Active",
    twoFactorEnabled: true,
    lastActiveAt: NOW - 12 * MIN,
    joinedAt: new Date(2022, 9, 3).getTime(),
    roleAssignedBy: STAFF[1],
  },
  {
    id: "u-05",
    name: "Ngozi Okonkwo",
    email: "ngozi@zorpill.ng",
    phone: "0803 998 2216",
    roleId: "pharmacist",
    branchIds: [MAIN],
    status: "Active",
    twoFactorEnabled: true,
    lastActiveAt: NOW - 55 * MIN,
    joinedAt: new Date(2023, 1, 27).getTime(),
    roleAssignedBy: STAFF[1],
  },
  {
    id: "u-06",
    name: "Emeka Nwachukwu",
    email: "emeka@zorpill.ng",
    phone: "0809 114 6650",
    roleId: "branch-manager",
    branchIds: [ABUJA],
    status: "Active",
    twoFactorEnabled: true,
    lastActiveAt: NOW - DAY,
    joinedAt: new Date(2023, 3, 14).getTime(),
    roleAssignedBy: STAFF[1],
  },
  {
    id: "u-07",
    name: "Bola Adeyemi",
    email: "bola@zorpill.ng",
    phone: "0802 447 3391",
    roleId: "pharmacy-technician",
    branchIds: [MAIN],
    status: "Active",
    twoFactorEnabled: true,
    lastActiveAt: NOW - 2 * HOUR,
    joinedAt: new Date(2023, 8, 5).getTime(),
    roleAssignedBy: STAFF[2],
  },
  {
    id: "u-08",
    name: "Yusuf Ibrahim",
    email: "yusuf@zorpill.ng",
    phone: "0805 776 2214",
    roleId: "cashier",
    branchIds: [MAIN],
    status: "Active",
    twoFactorEnabled: false,
    lastActiveAt: NOW - 38 * MIN,
    joinedAt: new Date(2024, 2, 20).getTime(),
    roleAssignedBy: STAFF[2],
  },
  {
    id: "u-09",
    name: "Chinelo Obi",
    email: "chinelo@zorpill.ng",
    phone: "0807 220 8834",
    roleId: "cashier",
    branchIds: [LEKKI],
    status: "Active",
    twoFactorEnabled: false,
    lastActiveAt: NOW - 5 * HOUR,
    joinedAt: new Date(2024, 5, 9).getTime(),
    roleAssignedBy: STAFF[2],
  },
  {
    id: "u-10",
    name: "Segun Afolabi",
    email: "segun@zorpill.ng",
    phone: "0803 561 4407",
    roleId: "inventory-manager",
    branchIds: [MAIN, LEKKI, ABUJA],
    status: "Active",
    twoFactorEnabled: true,
    lastActiveAt: NOW - 90 * MIN,
    joinedAt: new Date(2024, 7, 1).getTime(),
    roleAssignedBy: STAFF[1],
  },
  {
    id: "u-11",
    name: "Halima Bello",
    email: "halima@zorpill.ng",
    phone: "0806 909 3312",
    roleId: "cashier",
    branchIds: [ABUJA],
    status: "Active",
    twoFactorEnabled: false,
    lastActiveAt: NOW - 2 * DAY,
    joinedAt: new Date(2025, 0, 15).getTime(),
    roleAssignedBy: "Emeka Nwachukwu",
  },
  {
    id: "u-12",
    name: "Kelechi Umeh",
    email: "kelechi@zorpill.ng",
    phone: "0808 332 7765",
    roleId: "pharmacist",
    branchIds: [LEKKI],
    status: "Active",
    twoFactorEnabled: true,
    lastActiveAt: NOW - 7 * HOUR,
    joinedAt: new Date(2025, 6, 22).getTime(),
    roleAssignedBy: STAFF[2],
  },
];

/** Who is signed in. The Owner, so the admin screens are browsable. */
export const CURRENT_USER_ID = "u-01";

/* ------------------------------------------------------------------ *
 * Invitations
 * ------------------------------------------------------------------ */

/**
 * An invitation is not a user yet. Once accepted it becomes one and leaves
 * this list, which is why "Accepted" never renders here — keeping the mental
 * model Invitation → User.
 */
export type InvitationStatus = "Pending" | "Expired" | "Cancelled";

export interface Invitation {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: RoleId;
  branchIds: string[];
  status: InvitationStatus;
  invitedAt: number;
  invitedBy: string;
}

export const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: "inv-01",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "0803 771 2204",
    roleId: "pharmacist",
    branchIds: [MAIN],
    status: "Pending",
    invitedAt: NOW - DAY,
    invitedBy: STAFF[1],
  },
  {
    id: "inv-02",
    name: "Daniel Okoro",
    email: "daniel.okoro@example.com",
    phone: "0805 118 9930",
    roleId: "cashier",
    branchIds: [LEKKI],
    status: "Pending",
    invitedAt: NOW - 3 * DAY,
    invitedBy: STAFF[2],
  },
  {
    id: "inv-03",
    name: "Grace Mensah",
    email: "grace.mensah@example.com",
    phone: "0807 664 1188",
    roleId: "pharmacy-technician",
    branchIds: [ABUJA],
    status: "Expired",
    invitedAt: NOW - 21 * DAY,
    invitedBy: STAFF[1],
  },
  {
    id: "inv-04",
    name: "Peter Aluko",
    email: "peter.aluko@example.com",
    phone: "0802 553 7719",
    roleId: "cashier",
    branchIds: [MAIN],
    status: "Cancelled",
    invitedAt: NOW - 9 * DAY,
    invitedBy: STAFF[0],
  },
];

/** Invitations older than this are treated as expired. */
export const INVITE_VALID_DAYS = 14;

/* ------------------------------------------------------------------ *
 * Devices
 * ------------------------------------------------------------------ */

export interface Device {
  id: string;
  /** e.g. "Electron · Windows 11" — the app and OS, as the spec asked. */
  client: string;
  os: string;
  kind: "desktop" | "mobile" | "tablet";
  userId: string;
  branchId: string;
  /** Approximate, from IP — always labelled as such in the UI. */
  location: string;
  lastActiveAt: number;
  signedInAt: number;
  /** The session this app is running in. It can't be revoked from itself. */
  current?: boolean;
}

export const INITIAL_DEVICES: Device[] = [
  {
    id: "d-01",
    client: "Zorpill Desktop",
    os: "Windows 11",
    kind: "desktop",
    userId: "u-01",
    branchId: MAIN,
    location: "Lagos, Nigeria",
    lastActiveAt: NOW - 2 * MIN,
    signedInAt: NOW - 6 * DAY,
    current: true,
  },
  {
    id: "d-02",
    client: "Chrome 141",
    os: "Windows 10",
    kind: "desktop",
    userId: "u-04",
    branchId: MAIN,
    location: "Lagos, Nigeria",
    lastActiveAt: NOW - 12 * MIN,
    signedInAt: NOW - 2 * DAY,
  },
  {
    id: "d-03",
    client: "Zorpill Desktop",
    os: "Windows 11",
    kind: "desktop",
    userId: "u-08",
    branchId: MAIN,
    location: "Lagos, Nigeria",
    lastActiveAt: NOW - 38 * MIN,
    signedInAt: NOW - 11 * DAY,
  },
  {
    id: "d-04",
    client: "Zorpill Desktop",
    os: "Windows 10",
    kind: "desktop",
    userId: "u-03",
    branchId: LEKKI,
    location: "Lagos, Nigeria",
    lastActiveAt: NOW - 3 * HOUR,
    signedInAt: NOW - 27 * DAY,
  },
  {
    id: "d-05",
    client: "Zorpill for Android",
    os: "Samsung Galaxy A54",
    kind: "mobile",
    userId: "u-03",
    branchId: LEKKI,
    location: "Lagos, Nigeria",
    lastActiveAt: NOW - 4 * HOUR,
    signedInAt: NOW - 5 * DAY,
  },
  {
    id: "d-06",
    client: "Chrome 140",
    os: "macOS 15",
    kind: "desktop",
    userId: "u-02",
    branchId: MAIN,
    location: "Abuja, Nigeria",
    lastActiveAt: NOW - 26 * MIN,
    signedInAt: NOW - DAY,
  },
  {
    id: "d-07",
    client: "Zorpill Desktop",
    os: "Windows 10",
    kind: "desktop",
    userId: "u-06",
    branchId: ABUJA,
    location: "Abuja, Nigeria",
    lastActiveAt: NOW - DAY,
    signedInAt: NOW - 40 * DAY,
  },
  {
    id: "d-08",
    client: "Zorpill for iOS",
    os: "iPhone 14",
    kind: "mobile",
    userId: "u-10",
    branchId: MAIN,
    location: "Ibadan, Nigeria",
    lastActiveAt: NOW - 90 * MIN,
    signedInAt: NOW - 3 * DAY,
  },
];

/* ------------------------------------------------------------------ *
 * Security
 * ------------------------------------------------------------------ */

export interface SecuritySettings {
  /** Existing users are prompted at next login rather than locked out now. */
  require2fa: boolean;
  signOutInactive: boolean;
  loginAlerts: boolean;
}

export const INITIAL_SECURITY: SecuritySettings = {
  require2fa: true,
  signOutInactive: false,
  loginAlerts: true,
};

/* ------------------------------------------------------------------ *
 * Derived helpers
 * ------------------------------------------------------------------ */

/**
 * "All branches" / "Main Branch · Lekki Branch" / "No branch access".
 * Roles scoped "all" never enumerate branches — see the note on `branchIds`.
 */
export function scopeLabel(
  user: Pick<User, "roleId" | "branchIds">,
  branches: { id: string; name: string }[],
): string {
  if (roleById(user.roleId).scope === "all") return "All branches";
  const names = user.branchIds
    .map((id) => branches.find((b) => b.id === id)?.name)
    .filter(Boolean) as string[];
  if (names.length === 0) return "No branch access";
  return names.join(" · ");
}

/** Whether a user can work in a given branch, honouring pharmacy-wide roles. */
export function hasBranchAccess(user: User, branchId: string): boolean {
  if (roleById(user.roleId).scope === "all") return true;
  return user.branchIds.includes(branchId);
}

export function activeUsers(users: User[]): User[] {
  return users.filter((u) => u.status === "Active");
}

export function usersNeeding2fa(users: User[]): User[] {
  return activeUsers(users).filter((u) => !u.twoFactorEnabled);
}

/** Compact relative time: "5 min ago", "2 hrs ago", "Yesterday", a date. */
export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < MIN) return "Just now";
  if (diff < HOUR) return Math.round(diff / MIN) + " min ago";
  if (diff < DAY) {
    const hrs = Math.round(diff / HOUR);
    return hrs + (hrs === 1 ? " hr ago" : " hrs ago");
  }
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return Math.round(diff / DAY) + " days ago";
  return new Date(ts).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function formatUserDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}
