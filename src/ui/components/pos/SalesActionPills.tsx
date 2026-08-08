import { Clock, History, Plus } from "lucide-react";
import "./SalesActionPills.css";

interface SalesActionPillsProps {
  isHeldViewActive: boolean;
  heldCount: number;
  onNewSale: () => void;
  onToggleHeldView: () => void;
  onOpenHistory: () => void;
}

function SalesActionPills({
  isHeldViewActive,
  heldCount,
  onNewSale,
  onToggleHeldView,
  onOpenHistory,
}: SalesActionPillsProps) {
  return (
    <div className="sales-pills">
      <button type="button" className="sales-pill" onClick={onNewSale}>
        <Plus className="sales-pill-icon" />
        New Sale
      </button>

      <button
        type="button"
        className={`sales-pill${isHeldViewActive ? " sales-pill--active" : ""}`}
        onClick={onToggleHeldView}
        aria-pressed={isHeldViewActive}
      >
        <Clock className="sales-pill-icon" />
        Hold Sale
        {heldCount > 0 && <span className="sales-pill-badge">{heldCount}</span>}
      </button>

      <button type="button" className="sales-pill" onClick={onOpenHistory}>
        <History className="sales-pill-icon" />
        Sales History
      </button>
    </div>
  );
}

export default SalesActionPills;
