import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatNaira } from "./pos-data";
import "./DiscountModal.css";

interface DiscountModalProps {
  onClose: () => void;
  gross: number;
  mode: "pct" | "amt";
  value: string;
  onApply: (mode: "pct" | "amt", value: string) => void;
}

function DiscountModal({ onClose, gross, mode, value, onApply }: DiscountModalProps) {
  const [draftMode, setDraftMode] = useState(mode);
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsed = parseFloat(draftValue) || 0;
  const rawDiscount = draftMode === "pct" ? (gross * parsed) / 100 : parsed;
  const previewDiscount = Math.max(0, Math.min(rawDiscount, gross));

  function handleApply() {
    onApply(draftMode, draftValue);
    onClose();
  }

  return (
    <div className="discount-backdrop" onClick={onClose}>
      <div className="discount-modal" onClick={(e) => e.stopPropagation()}>
        <div className="discount-header">
          <span className="discount-title">Give discount</span>
          <button type="button" className="discount-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="discount-body">
          <div className="discount-mode-seg">
            <button
              type="button"
              className={`discount-mode-btn${draftMode === "pct" ? " discount-mode-btn--active" : ""}`}
              onClick={() => setDraftMode("pct")}
            >
              Percentage %
            </button>
            <button
              type="button"
              className={`discount-mode-btn${draftMode === "amt" ? " discount-mode-btn--active" : ""}`}
              onClick={() => setDraftMode("amt")}
            >
              Fixed ₦
            </button>
          </div>

          <div className="discount-field">
            <span className="discount-label">{draftMode === "pct" ? "Percentage off" : "Amount off"}</span>
            <div className="discount-input-wrap">
              <span className="discount-input-prefix">{draftMode === "pct" ? "%" : "₦"}</span>
              <input
                className="discount-input"
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="discount-preview">
            <span>Discount on {formatNaira(gross)} subtotal</span>
            <span className="discount-preview-value">−{formatNaira(previewDiscount)}</span>
          </div>
        </div>

        <div className="discount-footer">
          <button type="button" className="discount-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="discount-apply" onClick={handleApply}>
            Apply discount
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiscountModal;
