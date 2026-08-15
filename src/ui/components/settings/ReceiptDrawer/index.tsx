import { Receipt, X } from "lucide-react";
import Switch from "../../common/Switch";
import { CATALOG, formatNaira } from "../../pos/pos-data";
import { useSettings } from "../../../context/SettingsContext";
import { RECEIPT_TOGGLES, type ReceiptSettings } from "../settings-data";
import "./index.css";

/**
 * Receipt appearance: a live paper preview with the controls beneath it,
 * rather than a form that describes a receipt you can't see. Every toggle
 * changes the paper above it immediately.
 *
 * Slides in from the right like AiAssistDrawer and, like it, hardcodes
 * `top: 44px` to sit below the title bar — the same duplicated constant
 * flagged in CLAUDE.md. If .titlebar's height changes, this stylesheet needs
 * the same edit.
 *
 * Always mounted with an `open` prop (the CheckoutModal pattern, not
 * DiscountModal's): it writes every change straight through to context, so
 * there is no local draft state that would need a fresh mount to reseed.
 */

/** A fixed three-line basket, so the preview is stable and reads like a real sale. */
const SAMPLE_LINES = CATALOG.slice(0, 3).map((product, i) => ({
  name: product.name,
  qty: i === 0 ? 2 : 1,
  price: product.price,
}));

const SAMPLE_SUBTOTAL = SAMPLE_LINES.reduce((sum, line) => sum + line.price * line.qty, 0);

interface ReceiptDrawerProps {
  open: boolean;
  onClose: () => void;
}

function ReceiptDrawer({ open, onClose }: ReceiptDrawerProps) {
  const { profile, receipt, updateReceipt, activeBranch, preferences, flash } = useSettings();

  const vat = SAMPLE_SUBTOTAL * (preferences.sales.vatRate / 100);
  const total = SAMPLE_SUBTOTAL + (receipt.showTax ? vat : 0);

  function toggle(key: keyof ReceiptSettings, value: boolean) {
    updateReceipt({ [key]: value } as Partial<ReceiptSettings>);
    flash("Receipt updated");
  }

  return (
    <div className={"receipt-drawer" + (open ? " open" : "")} aria-hidden={!open}>
      <div className="receipt-drawer-header">
        <span className="receipt-drawer-title">
          <span className="receipt-drawer-icon">
            <Receipt />
          </span>
          <span className="receipt-drawer-title-text">
            Receipt appearance
            <small>Customize what customers see on their receipts</small>
          </span>
        </span>
        <button
          type="button"
          className="receipt-drawer-close"
          onClick={onClose}
          aria-label="Close receipt appearance"
        >
          <X />
        </button>
      </div>

      <div className="receipt-drawer-body">
        <div className="receipt-preview-wrap">
          <span className="receipt-preview-label">Preview</span>

          {/* Torn-paper styling comes from the ::before/::after zigzags in CSS. */}
          <div className="receipt-paper">
            {receipt.showLogo && (
              <div className="receipt-paper-logo">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt="" />
                ) : (
                  <span className="receipt-paper-logo-fallback">
                    {profile.displayName.slice(0, 1)}
                  </span>
                )}
              </div>
            )}

            {receipt.showStoreName && (
              <p className="receipt-paper-store">{profile.displayName}</p>
            )}
            {receipt.showAddress && (
              <p className="receipt-paper-meta">
                {activeBranch.address}
                <br />
                {activeBranch.city}
              </p>
            )}
            {receipt.showPhone && <p className="receipt-paper-meta">{activeBranch.phone}</p>}

            <div className="receipt-paper-rule" />

            <p className="receipt-paper-meta receipt-paper-invoice">
              <span>Invoice</span>
              <span>#INV-0241</span>
            </p>
            {receipt.showCustomer && (
              <p className="receipt-paper-meta receipt-paper-invoice">
                <span>Customer</span>
                <span>Adaeze Nwosu</span>
              </p>
            )}

            <div className="receipt-paper-rule" />

            {SAMPLE_LINES.map((line) => (
              <div key={line.name} className="receipt-paper-line">
                <span className="receipt-paper-line-name">
                  {line.name}
                  <small>
                    {line.qty} × {formatNaira(line.price)}
                  </small>
                </span>
                <span className="receipt-paper-line-amount">
                  {formatNaira(line.price * line.qty)}
                </span>
              </div>
            ))}

            <div className="receipt-paper-rule" />

            <p className="receipt-paper-meta receipt-paper-invoice">
              <span>Subtotal</span>
              <span>{formatNaira(SAMPLE_SUBTOTAL)}</span>
            </p>
            {receipt.showTax && (
              <p className="receipt-paper-meta receipt-paper-invoice">
                <span>VAT ({preferences.sales.vatRate}%)</span>
                <span>{formatNaira(vat)}</span>
              </p>
            )}
            <p className="receipt-paper-total">
              <span>Total</span>
              <span>{formatNaira(total)}</span>
            </p>

            {receipt.showPaymentMethod && (
              <p className="receipt-paper-meta receipt-paper-invoice">
                <span>Paid by</span>
                <span>Cash</span>
              </p>
            )}
            {receipt.showCashier && (
              <p className="receipt-paper-meta receipt-paper-invoice">
                <span>Served by</span>
                <span>{activeBranch.manager}</span>
              </p>
            )}

            {(receipt.footerMessage || receipt.termsMessage) && (
              <div className="receipt-paper-rule" />
            )}
            {receipt.footerMessage && (
              <p className="receipt-paper-footer">{receipt.footerMessage}</p>
            )}
            {receipt.termsMessage && (
              <p className="receipt-paper-terms">{receipt.termsMessage}</p>
            )}
          </div>

          <p className="receipt-preview-note">
            Address and phone come from{" "}
            <strong>{activeBranch.name}</strong> — each branch prints its own.
          </p>
        </div>

        <div className="receipt-controls">
          {RECEIPT_TOGGLES.map(({ key, label, hint }) => (
            <div key={key} className="receipt-control-row">
              <span className="receipt-control-text">
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
              <Switch
                checked={Boolean(receipt[key])}
                onChange={(value) => toggle(key, value)}
                ariaLabel={label}
              />
            </div>
          ))}

          <label className="panel-field receipt-control-field">
            <span className="panel-label">Footer message</span>
            <textarea
              className="panel-input panel-textarea"
              value={receipt.footerMessage}
              onChange={(e) => updateReceipt({ footerMessage: e.target.value })}
              onBlur={() => flash("Receipt updated")}
              placeholder="Thank you for shopping with us"
            />
          </label>

          <label className="panel-field receipt-control-field">
            <span className="panel-label">
              Terms / return message <em>printed small at the bottom</em>
            </span>
            <textarea
              className="panel-input panel-textarea"
              value={receipt.termsMessage}
              onChange={(e) => updateReceipt({ termsMessage: e.target.value })}
              onBlur={() => flash("Receipt updated")}
              placeholder="Medicines are not returnable once dispensed"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default ReceiptDrawer;
