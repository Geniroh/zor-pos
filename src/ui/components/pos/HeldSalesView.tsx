import { Clock, PauseCircle } from "lucide-react";
import type { ParkedSale } from "./pos-data";
import { formatNaira, saleLinesItemCount, saleLinesTotal } from "./pos-data";
import "./HeldSalesView.css";

interface HeldSalesViewProps {
  sales: ParkedSale[];
  onResume: (sale: ParkedSale) => void;
}

function heldAgo(heldAt: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - heldAt) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function itemsPreview(sale: ParkedSale): string {
  const names = sale.lines.map((l) => l.name);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

function HeldSalesView({ sales, onResume }: HeldSalesViewProps) {
  if (sales.length === 0) {
    return (
      <div className="held-sales-view">
        <div className="held-sales-empty">
          <PauseCircle className="held-sales-empty-icon" />
          <div className="held-sales-empty-title">No sales on hold</div>
          <div className="held-sales-empty-hint">
            Sales you hold from the cart panel will show up here as cards you can resume.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="held-sales-view">
      <div className="held-sales-grid">
        {sales.map((sale) => (
          <div key={sale.id} className="held-sale-card">
            <div className="held-sale-card-header">
              <span className="held-sale-card-customer">{sale.customer}</span>
              <span className="held-sale-card-tag">Hold</span>
            </div>
            <div className="held-sale-card-meta">
              <Clock className="held-sale-card-meta-icon" />
              {heldAgo(sale.heldAt)} · Served by {sale.servedBy}
            </div>
            <div className="held-sale-card-preview">{itemsPreview(sale)}</div>
            <div className="held-sale-card-footer">
              <span className="held-sale-card-summary">
                {saleLinesItemCount(sale.lines)} item(s) · {formatNaira(saleLinesTotal(sale.lines))}
              </span>
              <button type="button" className="held-sale-card-resume" onClick={() => onResume(sale)}>
                Resume
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeldSalesView;
