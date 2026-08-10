import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { LOST_SALE_REASONS, type LostSaleReason } from "../lost-sales-data";
import "./index.css";

export interface LostSaleDraft {
  product: string;
  qty: number;
  reason: LostSaleReason;
  customer?: string;
  notes?: string;
}

interface LogLostSaleModalProps {
  initialProduct: string;
  onClose: () => void;
  onSubmit: (draft: LostSaleDraft) => void;
}

function LogLostSaleModal({ initialProduct, onClose, onSubmit }: LogLostSaleModalProps) {
  const [product, setProduct] = useState(initialProduct);
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState<LostSaleReason>(LOST_SALE_REASONS[0]);
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = product.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      product: product.trim(),
      qty: Math.max(1, parseInt(qty, 10) || 1),
      reason,
      customer: customer.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  }

  return (
    <div className="lost-sale-backdrop" onClick={onClose}>
      <div className="lost-sale-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lost-sale-header">
          <span className="lost-sale-title">Log lost sale</span>
          <button type="button" className="lost-sale-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="lost-sale-body">
          <p className="lost-sale-hint">
            Record what the customer asked for so it can inform reordering or stocking decisions later.
          </p>

          <div className="lost-sale-field">
            <span className="lost-sale-label">Product / what they asked for</span>
            <input className="lost-sale-input" value={product} onChange={(e) => setProduct(e.target.value)} autoFocus />
          </div>

          <div className="lost-sale-row">
            <div className="lost-sale-field">
              <span className="lost-sale-label">Qty wanted</span>
              <input
                className="lost-sale-input"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="lost-sale-field">
              <span className="lost-sale-label">Reason</span>
              <select
                className="lost-sale-select"
                value={reason}
                onChange={(e) => setReason(e.target.value as LostSaleReason)}
              >
                {LOST_SALE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="lost-sale-field">
            <span className="lost-sale-label">
              Customer <em>optional</em>
            </span>
            <input className="lost-sale-input" value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>

          <div className="lost-sale-field">
            <span className="lost-sale-label">
              Notes <em>optional</em>
            </span>
            <input
              className="lost-sale-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. wanted the 20-tab pack specifically"
            />
          </div>
        </div>

        <div className="lost-sale-footer">
          <button type="button" className="lost-sale-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="lost-sale-submit" disabled={!canSubmit} onClick={handleSubmit}>
            Log lost sale
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogLostSaleModal;
