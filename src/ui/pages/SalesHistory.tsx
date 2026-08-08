import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { STAFF, formatNaira } from "../components/pos/pos-data";
import { SALES_HISTORY } from "../components/pos/sales-history-data";
import "./SalesHistory.css";

type DatePreset = "today" | "7d" | "month" | "all";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

function cutoffFor(preset: DatePreset): number | null {
  const now = new Date();
  if (preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  if (preset === "7d") {
    return Date.now() - 7 * 24 * 60 * 60 * 1000;
  }
  if (preset === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }
  return null;
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SalesHistory() {
  const [datePreset, setDatePreset] = useState<DatePreset>("7d");
  const [staff, setStaff] = useState<string>("all");
  const [hasSearched, setHasSearched] = useState(false);

  const filtered = useMemo(() => {
    const cutoff = cutoffFor(datePreset);
    return SALES_HISTORY.filter(
      (r) => (cutoff === null || r.dateTime >= cutoff) && (staff === "all" || r.servedBy === staff),
    );
  }, [datePreset, staff]);

  const totalAmount = filtered.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="sales-history-page">
      <div className="sales-history-header">
        <h1>Sales History</h1>
        <p>Choose a date range and staff member, then view the detailed breakdown.</p>
      </div>

      <div className="sales-history-filters">
        <div className="sales-history-field">
          <span className="sales-history-field-label">Date range</span>
          <select
            className="sales-history-select"
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as DatePreset);
              setHasSearched(false);
            }}
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sales-history-field">
          <span className="sales-history-field-label">Individual</span>
          <select
            className="sales-history-select"
            value={staff}
            onChange={(e) => {
              setStaff(e.target.value);
              setHasSearched(false);
            }}
          >
            <option value="all">All staff</option>
            {STAFF.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="sales-history-view-btn" onClick={() => setHasSearched(true)}>
          <Search className="sales-history-view-icon" />
          View Sales
        </button>
      </div>

      {!hasSearched ? (
        <div className="sales-history-prompt">
          Select a date range and staff member above, then click "View Sales" to see the breakdown.
        </div>
      ) : (
        <>
          <div className="sales-history-summary">
            <span>
              <strong>{filtered.length}</strong> sale{filtered.length === 1 ? "" : "s"}
            </span>
            <span className="sales-history-summary-total">{formatNaira(totalAmount)}</span>
          </div>

          <div className="sales-history-table-card">
            {filtered.length === 0 ? (
              <div className="sales-history-empty">No sales match this filter.</div>
            ) : (
              <table className="sales-history-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date &amp; time</th>
                    <th>Customer</th>
                    <th>Served by</th>
                    <th className="sales-history-align-right">Items</th>
                    <th className="sales-history-align-right">Total</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td className="sales-history-mono">{r.id}</td>
                      <td className="sales-history-mono">{formatDateTime(r.dateTime)}</td>
                      <td>{r.customer}</td>
                      <td>{r.servedBy}</td>
                      <td className="sales-history-align-right sales-history-mono">{r.itemCount}</td>
                      <td className="sales-history-align-right sales-history-mono">{formatNaira(r.total)}</td>
                      <td>{r.payment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SalesHistory;
