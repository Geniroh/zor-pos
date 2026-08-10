import { Link } from "react-router-dom";
import {
  PackageOpen,
  History,
  Building2,
  Wallet,
} from "lucide-react";
import "./index.css";

const PURCHASE_ACTIONS = [
  {
    icon: PackageOpen,
    title: "Receive New Stock",
    subtitle: "Record incoming deliveries against a purchase order",
    path: "receive-stock",
    gradient: "linear-gradient(135deg, #4f7d52, #263b28)",
  },
  {
    icon: History,
    title: "Purchase History",
    subtitle: "Browse past orders and deliveries",
    path: "purchase-history",
    gradient: "linear-gradient(135deg, #1c2b3a, #3d5069)",
  },
  {
    icon: Building2,
    title: "Supplier Management",
    subtitle: "Manage suppliers tied to your purchase orders",
    path: "suppliers",
    gradient: "linear-gradient(135deg, #d8cfa8, #ab8f4c)",
  },
  {
    icon: Wallet,
    title: "Accounts Payable",
    subtitle: "Track what's owed to suppliers and due dates",
    path: "accounts-payable",
    gradient: "linear-gradient(135deg, #8a4b6b, #4a2438)",
  },
];

function Purchases() {
  return (
    <div className="purchases-page">
      <h1>Purchases</h1>
      <p className="purchases-subtitle">
        Manage incoming stock, suppliers, and what you owe them.
      </p>

      <div className="purchases-actions">
        {PURCHASE_ACTIONS.map(({ icon: Icon, title, subtitle, path, gradient }) => (
          <Link
            key={path}
            to={path}
            className="purchases-action"
            style={{ background: gradient }}
          >
            <span className="purchases-action-icon">
              <Icon className="purchases-icon" />
            </span>
            <span className="purchases-action-text">
              <strong>{title}</strong>
              <span>{subtitle}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Purchases;
