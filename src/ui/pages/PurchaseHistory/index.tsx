import { useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { formatNaira } from "../../components/pos/pos-data";
import { supplierName } from "../../components/purchases/purchases-data";
import { PURCHASE_HISTORY } from "../../components/purchases/purchase-history-data";
import "./index.css";

type DatePreset = "today" | "7d" | "month" | "all";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

const PAGE_SIZE = 8;

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

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function PurchaseHistory() {
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2400);
  }

  function updateDatePreset(value: DatePreset) {
    setDatePreset(value);
    setPage(1);
  }

  // Stat cards are fixed KPIs, independent of the table's date filter below.
  const thisMonthStats = useMemo(() => {
    const cutoff = cutoffFor("month");
    const records = PURCHASE_HISTORY.filter((r) => r.dateTime >= (cutoff ?? 0));
    return {
      total: records.reduce((sum, r) => sum + r.total, 0),
      count: records.length,
    };
  }, []);

  const pendingStats = useMemo(() => {
    const unpaid = PURCHASE_HISTORY.filter((r) => r.status !== "Paid");
    return {
      outstanding: unpaid.reduce((sum, r) => sum + (r.total - r.amountPaid), 0),
      count: unpaid.length,
    };
  }, []);

  const lastPayment = useMemo(() => {
    return PURCHASE_HISTORY.filter((r) => r.lastPaymentDate !== null).sort(
      (a, b) => (b.lastPaymentDate ?? 0) - (a.lastPaymentDate ?? 0),
    )[0];
  }, []);

  const filtered = useMemo(() => {
    const cutoff = cutoffFor(datePreset);
    return PURCHASE_HISTORY.filter((r) => cutoff === null || r.dateTime >= cutoff);
  }, [datePreset]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function handleExport() {
    const header = ["PO Number", "Date", "Supplier", "Items", "Total", "Paid", "Balance", "Status"];
    const rows = filtered.map((r) => [
      r.id,
      formatDate(r.dateTime),
      supplierName(r.supplierId),
      String(r.itemCount),
      r.total.toFixed(2),
      r.amountPaid.toFixed(2),
      (r.total - r.amountPaid).toFixed(2),
      r.status,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchase-history-${datePreset}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    flash(`Exported ${filtered.length} record${filtered.length === 1 ? "" : "s"} to CSV`);
  }

  return (
    <div className="purchase-history-page">
      <div className="purchase-history-header">
        <h1>Purchase History</h1>
        <p>Review past purchase orders and what's still owed to suppliers.</p>
      </div>

      <div className="purchase-history-stats">
        <div className="purchase-history-stat">
          <div className="purchase-history-stat-label">Purchases this month</div>
          <div className="purchase-history-stat-value">{formatNaira(thisMonthStats.total)}</div>
          <div className="purchase-history-stat-note">
            {thisMonthStats.count} purchase order{thisMonthStats.count === 1 ? "" : "s"}
          </div>
        </div>
        <div className="purchase-history-stat purchase-history-stat--warning">
          <div className="purchase-history-stat-label purchase-history-stat-label--warning">
            Pending supplier payments
          </div>
          <div className="purchase-history-stat-value purchase-history-stat-value--warning">
            {formatNaira(pendingStats.outstanding)}
          </div>
          <div className="purchase-history-stat-note purchase-history-stat-note--warning">
            {pendingStats.count} invoice{pendingStats.count === 1 ? "" : "s"} unpaid
          </div>
        </div>
        <div className="purchase-history-stat">
          <div className="purchase-history-stat-label">Last payment</div>
          <div className="purchase-history-stat-value">
            {lastPayment ? formatNaira(lastPayment.amountPaid) : "—"}
          </div>
          <div className="purchase-history-stat-note">
            {lastPayment
              ? `${supplierName(lastPayment.supplierId)} · ${formatDate(lastPayment.lastPaymentDate as number)}`
              : "No payments recorded"}
          </div>
        </div>
      </div>

      <div className="purchase-history-toolbar">
        <div className="purchase-history-field">
          <span className="purchase-history-field-label">Date range</span>
          <select
            className="purchase-history-select"
            value={datePreset}
            onChange={(e) => updateDatePreset(e.target.value as DatePreset)}
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="purchase-history-export-btn" onClick={handleExport}>
          <Download className="purchase-history-export-icon" />
          Export CSV
        </button>
      </div>

      <div className="purchase-history-table-card">
        {pageItems.length === 0 ? (
          <div className="purchase-history-empty">No purchases match this filter.</div>
        ) : (
          <table className="purchase-history-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Date</th>
                <th>Supplier</th>
                <th className="purchase-history-align-right">Items</th>
                <th className="purchase-history-align-right">Total</th>
                <th className="purchase-history-align-right">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <tr key={r.id}>
                  <td className="purchase-history-mono">{r.id}</td>
                  <td className="purchase-history-mono">{formatDate(r.dateTime)}</td>
                  <td>{supplierName(r.supplierId)}</td>
                  <td className="purchase-history-align-right purchase-history-mono">{r.itemCount}</td>
                  <td className="purchase-history-align-right purchase-history-mono">{formatNaira(r.total)}</td>
                  <td className="purchase-history-align-right purchase-history-mono">
                    {formatNaira(r.total - r.amountPaid)}
                  </td>
                  <td>
                    <span
                      className={`purchase-history-status purchase-history-status--${r.status.toLowerCase()}`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="purchase-history-pagination">
        <span className="purchase-history-pagination-info">
          Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length}
        </span>
        <div className="purchase-history-pagination-controls">
          <button
            type="button"
            className="purchase-history-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`purchase-history-page-btn${n === currentPage ? " purchase-history-page-btn--active" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="purchase-history-page-btn"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {toast && <div className="purchase-history-toast">{toast}</div>}
    </div>
  );
}

export default PurchaseHistory;
