import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { CATALOG, STAFF, findProduct } from "../components/pos/pos-data";
import {
  ADJUSTMENT_REASONS,
  ADJUSTMENT_TYPES,
  STOCK_ADJUSTMENTS,
  type AdjustmentReason,
  type AdjustmentType,
} from "../components/pos/stock-adjustments-data";
import "./StockAdjustment.css";

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

  const [productId, setProductId] = useState(initialProductId ?? CATALOG[0].id);
  const [type, setType] = useState<AdjustmentType>(ADJUSTMENT_TYPES[0]);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>(ADJUSTMENT_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [adjustedBy, setAdjustedBy] = useState(STAFF[0]);
  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const product = findProduct(productId);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2200);
  }

  const qtyValue = parseInt(qty, 10);
  const canSubmit = !!product && !Number.isNaN(qtyValue) && qtyValue >= 0 && (type === "Set count" || qtyValue > 0);

  const qtyLabel =
    type === "Add stock" ? "Qty to add" : type === "Remove stock" ? "Qty to remove" : "New stock count";

  function handleSubmit() {
    if (!canSubmit || !product) return;
    const summary =
      type === "Add stock"
        ? `+${qtyValue}`
        : type === "Remove stock"
          ? `-${qtyValue}`
          : `set to ${qtyValue}`;
    flash(`Stock adjusted · ${product.name} (${summary})`);
    setQty("");
    setNotes("");
    setReason(ADJUSTMENT_REASONS[0]);
  }

  const recentAdjustments = useMemo(() => STOCK_ADJUSTMENTS.slice(0, 12), []);

  return (
    <div className="stock-adjustment-page">
      <div className="stock-adjustment-header">
        <h1>Stock Adjustment</h1>
        <p>Correct stock counts and record write-offs.</p>
      </div>

      <div className="stock-adjustment-layout">
        <div className="stock-adjustment-card">
          <div className="stock-adjustment-field">
            <span className="stock-adjustment-label">Product</span>
            <select
              className="stock-adjustment-select"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {CATALOG.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {product && (
              <span className="stock-adjustment-current">Current stock: {product.stock}</span>
            )}
          </div>

          <div className="stock-adjustment-field">
            <span className="stock-adjustment-label">Adjustment type</span>
            <div className="stock-adjustment-type-pills">
              {ADJUSTMENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`stock-adjustment-pill${type === t ? " stock-adjustment-pill--active" : ""}`}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="stock-adjustment-row">
            <div className="stock-adjustment-field">
              <span className="stock-adjustment-label">{qtyLabel}</span>
              <input
                className="stock-adjustment-input"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="numeric"
                placeholder="0"
              />
            </div>
            <div className="stock-adjustment-field">
              <span className="stock-adjustment-label">Reason</span>
              <select
                className="stock-adjustment-select"
                value={reason}
                onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              >
                {ADJUSTMENT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="stock-adjustment-field">
            <span className="stock-adjustment-label">Adjusted by</span>
            <select
              className="stock-adjustment-select"
              value={adjustedBy}
              onChange={(e) => setAdjustedBy(e.target.value)}
            >
              {STAFF.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="stock-adjustment-field">
            <span className="stock-adjustment-label">
              Notes <em>optional</em>
            </span>
            <textarea
              className="stock-adjustment-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. found 3 units damaged during stocktake"
            />
          </div>

          <button
            type="button"
            className="stock-adjustment-submit"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Record adjustment
          </button>
        </div>

        <div className="stock-adjustment-history">
          <h2>Recent adjustments</h2>
          <div className="stock-adjustment-table-card">
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
                {recentAdjustments.map((a) => (
                  <tr key={a.id}>
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
          </div>
        </div>
      </div>

      {toast && <div className="stock-adjustment-toast">{toast}</div>}
    </div>
  );
}

export default StockAdjustment;
