import { ChevronDown, ChevronUp } from "lucide-react";
import { TODAY_STATS, formatNaira } from "../pos-data";
import "./index.css";

interface StatsDrawerProps {
  open: boolean;
  onToggle: () => void;
}

function StatsDrawer({ open, onToggle }: StatsDrawerProps) {
  const stats = TODAY_STATS;

  return (
    <div className="stats-drawer">
      <button type="button" className="stats-drawer-bar" onClick={onToggle}>
        <span className="stats-drawer-today">Today</span>
        <span className="stats-drawer-sales">
          Sales <span className="stats-drawer-mono">{formatNaira(stats.salesTotal)}</span>
        </span>
        <span className="stats-drawer-divider" />
        <span className="stats-drawer-item">{stats.transactions} transactions</span>
        <span className="stats-drawer-divider" />
        <span className="stats-drawer-item stats-drawer-item--warning">
          {stats.lowStockCount} item low on stock
        </span>
        <span className="stats-drawer-spacer" />
        <span className="stats-drawer-label">
          {open ? "Hide summary" : "Show summary"}
          {open ? <ChevronDown /> : <ChevronUp />}
        </span>
      </button>

      {open && (
        <div className="stats-drawer-body">
          <div className="stats-drawer-tile">
            <div className="stats-drawer-tile-label">Today's sales</div>
            <div className="stats-drawer-tile-value">{formatNaira(stats.salesTotal)}</div>
            <div className="stats-drawer-tile-note stats-drawer-tile-note--positive">
              ↑ {stats.salesChangePct}% vs yesterday
            </div>
          </div>
          <div className="stats-drawer-tile">
            <div className="stats-drawer-tile-label">Gross profit</div>
            <div className="stats-drawer-tile-value">{formatNaira(stats.grossProfit)}</div>
            <div className="stats-drawer-tile-note">{stats.marginPct}% margin</div>
          </div>
          <div className="stats-drawer-tile">
            <div className="stats-drawer-tile-label">Items sold</div>
            <div className="stats-drawer-tile-value">{stats.itemsSold}</div>
            <div className="stats-drawer-tile-note">Avg {formatNaira(stats.avgPerSale)} per sale</div>
          </div>
          <div className="stats-drawer-tile stats-drawer-tile--warning">
            <div className="stats-drawer-tile-label stats-drawer-tile-label--warning">Low stock</div>
            <div className="stats-drawer-tile-value stats-drawer-tile-value--warning">
              {stats.lowStockCount} item
            </div>
            <div className="stats-drawer-tile-note stats-drawer-tile-note--warning">
              {stats.lowStockItem} — reorder
            </div>
          </div>
          <div className="stats-drawer-tile">
            <div className="stats-drawer-tile-label">Shortcuts</div>
            <div className="stats-drawer-shortcuts">
              <div>F3 Scan</div>
              <div>F5 Pay</div>
              <div>Esc Close</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsDrawer;
