import { Minus, Plus, X } from "lucide-react";
import type { SaleLine } from "./pos-data";
import { formatNaira } from "./pos-data";
import "./CartPanel.css";

interface CartPanelProps {
  lines: SaleLine[];
  selectedKey: number | null;
  onSelectLine: (key: number) => void;
  onInc: (key: number) => void;
  onDec: (key: number) => void;
  onRemove: (key: number) => void;
  onHold: () => void;
  onClear: () => void;
  onDraft: () => void;
  onCheckout: () => void;
  gross: number;
  discount: number;
  vatAmount: number;
  vatRatePct: number;
  total: number;
}

function CartPanel({
  lines,
  selectedKey,
  onSelectLine,
  onInc,
  onDec,
  onRemove,
  onHold,
  onClear,
  onDraft,
  onCheckout,
  gross,
  discount,
  vatAmount,
  vatRatePct,
  total,
}: CartPanelProps) {
  const isEmpty = lines.length === 0;

  return (
    <div className="cart-panel">
      <div className="cart-panel-header">
        <span className="cart-panel-title">Cart ({lines.length})</span>
        <div className="cart-panel-header-actions">
          <button type="button" className="cart-panel-hold-btn" onClick={onHold}>
            Hold
          </button>
          <button type="button" className="cart-panel-clear-btn" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="cart-panel-list">
        {isEmpty ? (
          <div className="cart-panel-empty">
            The cart summary appears here.
            <br />
            Every line stays editable until checkout.
          </div>
        ) : (
          lines.map((line) => (
            <div
              key={line.key}
              className={`cart-panel-line${line.key === selectedKey ? " cart-panel-line--selected" : ""}`}
            >
              <div className="cart-panel-line-top">
                <div className="cart-panel-line-info">
                  <span className="cart-panel-line-name">{line.name}</span>
                  <span className="cart-panel-line-unit">
                    {formatNaira(line.price)} each · {line.vat ? "VAT" : "no VAT"}
                  </span>
                </div>
                <div className="cart-panel-line-amount-row">
                  <span className="cart-panel-line-amount">{formatNaira(line.price * line.qty)}</span>
                  <button
                    type="button"
                    className="cart-panel-line-remove"
                    onClick={() => onRemove(line.key)}
                    aria-label={`Remove ${line.name}`}
                  >
                    <X />
                  </button>
                </div>
              </div>
              <div className="cart-panel-line-bottom">
                <div className="cart-panel-stepper">
                  <button type="button" onClick={() => onDec(line.key)} aria-label="Decrease quantity">
                    <Minus />
                  </button>
                  <span className="cart-panel-stepper-qty">{line.qty}</span>
                  <button type="button" onClick={() => onInc(line.key)} aria-label="Increase quantity">
                    <Plus />
                  </button>
                </div>
                <button type="button" className="cart-panel-edit-line" onClick={() => onSelectLine(line.key)}>
                  Edit line
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-panel-footer">
        <button type="button" className="cart-panel-note">
          + Add note / prescription
        </button>

        <div className="cart-panel-totals-row">
          <span>Subtotal</span>
          <span className="cart-panel-totals-value">{formatNaira(gross)}</span>
        </div>
        <div className="cart-panel-totals-row">
          <span>Discount</span>
          <span className="cart-panel-totals-value cart-panel-totals-value--danger">
            −{formatNaira(discount)}
          </span>
        </div>
        <div className="cart-panel-totals-row">
          <span>VAT ({vatRatePct}%)</span>
          <span className="cart-panel-totals-value">{formatNaira(vatAmount)}</span>
        </div>
        <div className="cart-panel-total-row">
          <span>Total</span>
          <span className="cart-panel-total-value">{formatNaira(total)}</span>
        </div>

        <button type="button" className="cart-panel-checkout" disabled={isEmpty} onClick={onCheckout}>
          <span>Checkout &amp; print</span>
          <kbd>F5</kbd>
        </button>

        <div className="cart-panel-secondary-actions">
          <button type="button" className="cart-panel-secondary-btn" onClick={onHold}>
            Hold <kbd>F6</kbd>
          </button>
          <button type="button" className="cart-panel-secondary-btn" onClick={onDraft}>
            Draft <kbd>F7</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPanel;
