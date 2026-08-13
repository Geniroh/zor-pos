import { Link } from "react-router-dom";
import {
  ArrowRight,
  CreditCard,
  HeartPulse,
  LayoutDashboard,
  PackageSearch,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";
import "./index.css";

/**
 * Hub landing page for Reports, keeping the section consistent with Inventory,
 * Purchases and Customers & Care (all of which land on a chooser, not straight
 * into a screen). The overview dashboard is deliberately promoted to a wide
 * featured card above the six drill-downs rather than being one tile among
 * seven — it is the page most visits actually want.
 */

const REPORTS = [
  {
    icon: TrendingUp,
    title: "Sales Report",
    subtitle: "Revenue, profit and transactions over time",
    path: "sales",
    gradient: "linear-gradient(135deg, #4f7d52, #263b28)",
  },
  {
    icon: PieChart,
    title: "Category Report",
    subtitle: "Which parts of the catalog earn their shelf space",
    path: "categories",
    gradient: "linear-gradient(135deg, #1c2b3a, #3d5069)",
  },
  {
    icon: PackageSearch,
    title: "Products Report",
    subtitle: "Every product ranked by sales, units and margin",
    path: "products",
    gradient: "linear-gradient(135deg, #d8cfa8, #ab8f4c)",
  },
  {
    icon: CreditCard,
    title: "Payment Report",
    subtitle: "How customers are paying, and what that costs you",
    path: "payments",
    gradient: "linear-gradient(135deg, #8a4b6b, #4a2438)",
  },
  {
    icon: Users,
    title: "Customer Report",
    subtitle: "New versus returning, and who spends the most",
    path: "customers",
    gradient: "linear-gradient(135deg, #2a5d7d, #16303f)",
  },
  {
    icon: HeartPulse,
    title: "Care Report",
    subtitle: "Consultations, follow-ups and how many get closed",
    path: "care",
    gradient: "linear-gradient(135deg, #a35a3a, #5c2e1c)",
  },
];

function Reports() {
  return (
    <div className="reports-page">
      <h1>Reports</h1>
      <p className="reports-subtitle">
        Understand how the pharmacy is performing, then dig into the detail.
      </p>

      <Link to="overview" className="reports-featured">
        <span className="reports-featured-icon">
          <LayoutDashboard className="reports-featured-glyph" />
        </span>
        <span className="reports-featured-text">
          <strong>Performance Overview</strong>
          <span>
            Sales, profit, categories, payments, customers and care — the whole
            business on one screen.
          </span>
        </span>
        <ArrowRight className="reports-featured-arrow" />
      </Link>

      <div className="reports-grid">
        {REPORTS.map(({ icon: Icon, title, subtitle, path, gradient }) => (
          <Link key={path} to={path} className="reports-card" style={{ background: gradient }}>
            <span className="reports-card-icon">
              <Icon className="reports-card-glyph" />
            </span>
            <span className="reports-card-text">
              <strong>{title}</strong>
              <span>{subtitle}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Reports;
