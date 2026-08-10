import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { stockStatus, type Product } from "../pos-data";
import {
  ADJUSTMENT_REASONS,
  ADJUSTMENT_TYPES,
  type AdjustmentReason,
  type AdjustmentType,
} from "../stock-adjustments-data";
import "./index.css";

export interface AdjustmentDraft {
  type: AdjustmentType;
  qty: number;
  reason: AdjustmentReason;
  notes?: string;
  adjustedBy: string;
}

interface AdjustProductDrawerProps {
  product: Product;
  staff: string[];
  onClose: () => void;
  onSave: (draft: AdjustmentDraft) => void;
}

function AdjustProductDrawer({ product, staff, onClose, onSave }: AdjustProductDrawerProps) {
  const [type, setType] = useState<AdjustmentType>(ADJUSTMENT_TYPES[0]);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>(ADJUSTMENT_REASONS[0]);
  const [adjustedBy, setAdjustedBy] = useState(staff[0]);
  const [notes, setNotes] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = stockStatus(product.stock);
  const qtyValue = parseInt(qty, 10);
  const canSubmit = !Number.isNaN(qtyValue) && qtyValue >= 0 && (type === "Set count" || qtyValue > 0);
  const qtyLabel =
    type === "Add stock" ? "Qty to add" : type === "Remove stock" ? "Qty to remove" : "New stock count";

  function handleSave() {
    if (!canSubmit) return;
    onSave({ type, qty: qtyValue, reason, adjustedBy, notes: notes.trim() || undefined });
  }

  return (
    <div className="adjust-drawer open" ref={panelRef}>
      <div className="adjust-drawer-header">
        <div>
          <h2>{product.name}</h2>
          <span className="adjust-drawer-form">{product.form}</span>
        </div>
        <button type="button" className="adjust-drawer-close" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>

      <div className="adjust-drawer-body">
        <div className="adjust-drawer-summary">
          <div className="adjust-drawer-summary-row">
            <span>Barcode</span>
            <span className="adjust-drawer-mono">{product.barcode}</span>
          </div>
          <div className="adjust-drawer-summary-row">
            <span>Current stock</span>
            <span className="adjust-drawer-mono">{product.stock}</span>
          </div>
          <div className="adjust-drawer-summary-row">
            <span>Status</span>
            <span
              className={`adjust-drawer-status adjust-drawer-status--${status
                .toLowerCase()
                .replace(/ /g, "-")}`}
            >
              {status}
            </span>
          </div>
        </div>

        <div className="adjust-drawer-field">
          <span className="adjust-drawer-label">Adjustment type</span>
          <div className="adjust-drawer-type-pills">
            {ADJUSTMENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`adjust-drawer-pill${type === t ? " adjust-drawer-pill--active" : ""}`}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="adjust-drawer-row">
          <div className="adjust-drawer-field">
            <span className="adjust-drawer-label">{qtyLabel}</span>
            <input
              className="adjust-drawer-input"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="adjust-drawer-field">
            <span className="adjust-drawer-label">Reason</span>
            <select
              className="adjust-drawer-select"
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

        <div className="adjust-drawer-field">
          <span className="adjust-drawer-label">Adjusted by</span>
          <select
            className="adjust-drawer-select"
            value={adjustedBy}
            onChange={(e) => setAdjustedBy(e.target.value)}
          >
            {staff.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="adjust-drawer-field">
          <span className="adjust-drawer-label">
            Notes <em>optional</em>
          </span>
          <textarea
            className="adjust-drawer-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. found 3 units damaged during stocktake"
          />
        </div>
      </div>

      <div className="adjust-drawer-footer">
        <button type="button" className="adjust-drawer-cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="adjust-drawer-save" disabled={!canSubmit} onClick={handleSave}>
          Save adjustment
        </button>
      </div>
    </div>
  );
}

export default AdjustProductDrawer;
