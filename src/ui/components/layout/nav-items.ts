import type { ComponentType } from "react";
import {
  ShoppingCart,
  Boxes,
  Truck,
  Users,
  Building2,
  BarChart3,
  ShieldCheck,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  /** Path segment relative to /dashboard. Empty string is the index route. */
  path: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Sales (POS)", path: "", icon: ShoppingCart },
  { label: "Inventory", path: "inventory", icon: Boxes },
  { label: "Purchases", path: "purchases", icon: Truck },
  { label: "Customers", path: "customers", icon: Users },
  { label: "Suppliers", path: "suppliers", icon: Building2 },
  { label: "Reports", path: "reports", icon: BarChart3 },
  { label: "Users & Roles", path: "users-roles", icon: ShieldCheck },
  { label: "Settings", path: "settings", icon: Settings },
];
