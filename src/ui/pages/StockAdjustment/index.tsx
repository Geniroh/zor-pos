import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ScanLine, Search } from "lucide-react";
import { CATALOG, STAFF, findProduct, stockStatus, type Product } from "../../components/pos/pos-data";
import {
  STOCK_ADJUSTMENTS,
  type StockAdjustment as StockAdjustmentRecord,
} from "../../components/pos/stock-adjustments-data";
import AdjustProductDrawer, { type AdjustmentDraft } from "../../components/pos/AdjustProductDrawer";
import AdjustmentDetailDrawer from "../../components/pos/AdjustmentDetailDrawer";
import "./index.css";

type Tab = "adjust" | "history";
type DatePreset = "today" | "7d" | "month" | "all";

const PAGE_SIZE = 6;
const HISTORY_PAGE_SIZE = 8;

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

function StockAdjustment() {
  const location = useLocation();
  const initialProductId = (location.state as { productId?: string } | null)?.productId;

  const [tab, setTab] = useState<Tab>("adjust");
  const [adjustments, setAdjustments] = useState<StockAdjustmentRecord[]>(STOCK_ADJUSTMENTS);
  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Adjust tab state
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    initialProductId ? findProduct(initialProductId) ?? null : null,
  );
  const searchRef = useRef<HTMLInputElement>(null);

  // History tab state
  const [historyProduct, setHistoryProduct] = useState("all");
  const [historyStaff, setHistoryStaff] = useState("all");
  const [historyDate, setHistoryDate] = useState<DatePreset>("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustmentRecord | null>(null);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2200);
  }

  function switchTab(next: Tab) {
    setTab(next);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function simulateScan() {
    const product = CATALOG[Math.floor(Math.random() * CATALOG.length)];
    updateQuery(product.barcode);
    searchRef.current?.focus();
    flash("Scanned · " + product.name);
  }

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.barcode.includes(q),
    );
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredProducts.slice(pageStart, pageStart + PAGE_SIZE);

  function handleSaveAdjustment(draft: AdjustmentDraft) {
    if (!selectedProduct) return;
    const stockBefore = selectedProduct.stock;
    const qtyChange =
      draft.type === "Add stock" ? draft.qty : draft.type === "Remove stock" ? -draft.qty : draft.qty;
    const stockAfter =
      draft.type === "Set count" ? draft.qty : Math.max(0, stockBefore + qtyChange);
    const record: StockAdjustmentRecord = {
      id: "ADJ-" + Date.now(),
      dateTime: Date.now(),
      productId: selectedProduct.id,
      product: selectedProduct.name,
      type: draft.type,
      qtyChange: draft.type === "Set count" ? draft.qty : qtyChange,
      stockBefore,
      stockAfter,
      reason: draft.reason,
      notes: draft.notes,
      adjustedBy: draft.adjustedBy,
    };
    setAdjustments((prev) => [record, ...prev]);
    const summary =
      draft.type === "Add stock"
        ? `+${draft.qty}`
        : draft.type === "Remove stock"
          ? `-${draft.qty}`
          : `set to ${draft.qty}`;
    flash(`Stock adjusted · ${selectedProduct.name} (${summary})`);
    setSelectedProduct(null);
  }

  // History tab filtering
  const filteredHistory = useMemo(() => {
    const cutoff = cutoffFor(historyDate);
    return adjustments.filter(
      (a) =>
        (cutoff === null || a.dateTime >= cutoff) &&
        (historyStaff === "all" || a.adjustedBy === historyStaff) &&
        (historyProduct === "all" || a.product === historyProduct),
    );
  }, [adjustments, historyDate, historyStaff, historyProduct]);

  const historyPageCount = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
  const historyCurrentPage = Math.min(historyPage, historyPageCount);
  const historyPageStart = (historyCurrentPage - 1) * HISTORY_PAGE_SIZE;
  const historyPageItems = filteredHistory.slice(historyPageStart, historyPageStart + HISTORY_PAGE_SIZE);

  function updateHistoryFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setHistoryPage(1);
  }

  return (
    <div className="stock-adjustment-page">
      <div className="stock-adjustment-header">
        <h1>Stock Adjustment</h1>
        <p>Correct stock counts and record write-offs.</p>
      </div>

      <div className="stock-adjustment-tabs">
        <button
          type="button"
          className={`stock-adjustment-tab${tab === "adjust" ? " stock-adjustment-tab--active" : ""}`}
          onClick={() => switchTab("adjust")}
        >
          Adjust Stock
        </button>
        <button
          type="button"
          className={`stock-adjustment-tab${tab === "history" ? " stock-adjustment-tab--active" : ""}`}
          onClick={() => switchTab("history")}
        >
          History
        </button>
      </div>

      {tab === "adjust" ? (
        <>
          <div className="stock-adjustment-toolbar">
            <div className="stock-adjustment-search">
              <Search className="stock-adjustment-search-icon" />
              <input
                ref={searchRef}
                className="stock-adjustment-search-input"
                placeholder="Search by name, ID or barcode…"
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
              />
            </div>
            <button type="button" className="stock-adjustment-scan-btn" onClick={simulateScan}>
              <ScanLine className="stock-adjustment-btn-icon" />
              Scan
            </button>
          </div>

          <div className="stock-adjustment-table-card">
            {pageItems.length === 0 ? (
              <div className="stock-adjustment-empty">No products match &quot;{query}&quot;</div>
            ) : (
              <table className="stock-adjustment-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Barcode</th>
                    <th className="stock-adjustment-align-right">Current stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => {
                    const status = stockStatus(p.stock);
                    return (
                      <tr
                        key={p.id}
                        className="stock-adjustment-row-clickable"
                        onClick={() => setSelectedProduct(p)}
                      >
                        <td>
                          <div className="stock-adjustment-name">{p.name}</div>
                          <div className="stock-adjustment-form">{p.form}</div>
                        </td>
                        <td className="stock-adjustment-mono">{p.barcode}</td>
                        <td className="stock-adjustment-align-right stock-adjustment-mono">{p.stock}</td>
                        <td>
                          <span
                            className={`stock-adjustment-status stock-adjustment-status--${status
                              .toLowerCase()
                              .replace(/ /g, "-")}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="stock-adjustment-pagination">
            <span className="stock-adjustment-pagination-info">
              Showing {filteredProducts.length === 0 ? 0 : pageStart + 1}–
              {Math.min(pageStart + PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length}
            </span>
            <div className="stock-adjustment-pagination-controls">
              <button
                type="button"
                className="stock-adjustment-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`stock-adjustment-page-btn${n === currentPage ? " stock-adjustment-page-btn--active" : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="stock-adjustment-page-btn"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="stock-adjustment-filters">
            <div className="stock-adjustment-field">
              <span className="stock-adjustment-label">Product</span>
              <select
                className="stock-adjustment-select"
                value={historyProduct}
                onChange={(e) => updateHistoryFilter(setHistoryProduct, e.target.value)}
              >
                <option value="all">All products</option>
                {CATALOG.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="stock-adjustment-field">
              <span className="stock-adjustment-label">Adjusted by</span>
              <select
                className="stock-adjustment-select"
                value={historyStaff}
                onChange={(e) => updateHistoryFilter(setHistoryStaff, e.target.value)}
              >
                <option value="all">All staff</option>
                {STAFF.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="stock-adjustment-field">
              <span className="stock-adjustment-label">Date range</span>
              <select
                className="stock-adjustment-select"
                value={historyDate}
                onChange={(e) => updateHistoryFilter((v) => setHistoryDate(v as DatePreset), e.target.value)}
              >
                {DATE_PRESETS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="stock-adjustment-table-card">
            {historyPageItems.length === 0 ? (
              <div className="stock-adjustment-empty">No adjustments match this filter.</div>
            ) : (
              <table className="stock-adjustment-table">
                <thead>
                  <tr>
                    <th>Date &amp; time</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th className="stock-adjustment-align-right">Qty change</th>
                    <th>Reason</th>
                    <th>Adjusted by</th>
                  </tr>
                </thead>
                <tbody>
                  {historyPageItems.map((a) => (
                    <tr
                      key={a.id}
                      className="stock-adjustment-row-clickable"
                      onClick={() => setSelectedAdjustment(a)}
                    >
                      <td className="stock-adjustment-mono">{formatDateTime(a.dateTime)}</td>
                      <td>{a.product}</td>
                      <td>{a.type}</td>
                      <td
                        className={`stock-adjustment-align-right stock-adjustment-mono${
                          a.type === "Set count"
                            ? ""
                            : a.qtyChange < 0
                              ? " stock-adjustment-negative"
                              : " stock-adjustment-positive"
                        }`}
                      >
                        {a.type === "Set count" ? "→ " : a.qtyChange > 0 ? "+" : ""}
                        {a.qtyChange}
                      </td>
                      <td>{a.reason}</td>
                      <td>{a.adjustedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="stock-adjustment-pagination">
            <span className="stock-adjustment-pagination-info">
              Showing {filteredHistory.length === 0 ? 0 : historyPageStart + 1}–
              {Math.min(historyPageStart + HISTORY_PAGE_SIZE, filteredHistory.length)} of{" "}
              {filteredHistory.length}
            </span>
            <div className="stock-adjustment-pagination-controls">
              <button
                type="button"
                className="stock-adjustment-page-btn"
                disabled={historyCurrentPage <= 1}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {Array.from({ length: historyPageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`stock-adjustment-page-btn${n === historyCurrentPage ? " stock-adjustment-page-btn--active" : ""}`}
                  onClick={() => setHistoryPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="stock-adjustment-page-btn"
                disabled={historyCurrentPage >= historyPageCount}
                onClick={() => setHistoryPage((p) => Math.min(historyPageCount, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {selectedProduct && (
        <AdjustProductDrawer
          product={selectedProduct}
          staff={STAFF}
          onClose={() => setSelectedProduct(null)}
          onSave={handleSaveAdjustment}
        />
      )}

      {selectedAdjustment && (
        <AdjustmentDetailDrawer
          adjustment={selectedAdjustment}
          onClose={() => setSelectedAdjustment(null)}
        />
      )}

      {toast && <div className="stock-adjustment-toast">{toast}</div>}
    </div>
  );
}

export default StockAdjustment;
