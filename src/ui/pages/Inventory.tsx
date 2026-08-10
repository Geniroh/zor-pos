import { Link } from "react-router-dom";
import {
  ClipboardEdit,
  PackagePlus,
  PackageSearch,
  Layers,
} from "lucide-react";
import "./Inventory.css";

const INVENTORY_ACTIONS = [
  {
    icon: PackagePlus,
    title: "Add Product",
    subtitle: "Create a new product in your catalog",
    path: "add-product",
    gradient: "linear-gradient(135deg, #4f7d52, #263b28)",
  },
  {
    icon: PackageSearch,
    title: "View Product",
    subtitle: "Browse and search your product catalog",
    path: "view-product",
    gradient: "linear-gradient(135deg, #1c2b3a, #3d5069)",
  },
  {
    icon: Layers,
    title: "View Stock Levels",
    subtitle: "Check current stock across branches",
    path: "stock-levels",
    gradient: "linear-gradient(135deg, #d8cfa8, #ab8f4c)",
  },
  {
    icon: ClipboardEdit,
    title: "Stock Adjustment",
    subtitle: "Correct stock counts and record write-offs",
    path: "stock-adjustment",
    gradient: "linear-gradient(135deg, #8a4b6b, #4a2438)",
  },
];

function Inventory() {
  return (
    <div className="inventory-page">
      <h1>Inventory</h1>
      <p className="inventory-subtitle">
        Manage your product catalog and stock in one place.
      </p>

      <div className="inventory-actions">
        {INVENTORY_ACTIONS.map(({ icon: Icon, title, subtitle, path, gradient }) => (
          <Link
            key={path}
            to={path}
            className="inventory-action"
            style={{ background: gradient }}
          >
            <span className="inventory-action-icon">
              <Icon className="inventory-icon" />
            </span>
            <span className="inventory-action-text">
              <strong>{title}</strong>
              <span>{subtitle}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Inventory;
