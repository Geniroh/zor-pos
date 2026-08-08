import { X } from "lucide-react";
import { formatNaira } from "./pos-data";
import "./CheckoutModal.css";

export interface TenderState {
  cash: string;
  pos: string;
  transfer: string;
  cheque: string;
}

type TenderKey = keyof TenderState;

interface TenderMeta {
  key: TenderKey;
  label: string;
  hint: string;
  color: string;
}

const TENDERS: TenderMeta[] = [
  { key: "cash", label: "Cash", hint: "Drawer 01", color: "#0d8f61" },
  { key: "pos", label: "POS / ATM card", hint: "Card terminal", color: "#6366f1" },
  { key: "transfer", label: "Bank transfer", hint: "Confirm alert before completing", color: "#2f7fd6" },
  { key: "cheque", label: "Cheque", hint: "Clears in 3 working days", color: "#c07a12" },
];

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  customer: string;
  lineCount: number;
  invoiceNo: string;
  saleDate: string;
  servedBy: string;
  total: number;
  tender: TenderState;
  onChangeTender: (key: TenderKey, value: string) => void;
  onFillBalance: (key: TenderKey) => void;
  onComplete: () => void;
}

function CheckoutModal({
  open,
  onClose,
  customer,
  lineCount,
  invoiceNo,
  saleDate,
  servedBy,
  total,
  tender,
  onChangeTender,
  onFillBalance,
  onComplete,
}: CheckoutModalProps) {
  if (!open) return null;

  const allocated = Object.values(tender).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const balance = total - allocated;
  const isOverpaid = balance < -0.001;
  const isFullyAllocated = !isOverpaid && balance <= 0.001;
  const needsRef = (parseFloat(tender.pos) > 0) || (parseFloat(tender.transfer) > 0) || (parseFloat(tender.cheque) > 0);

  return (
    <div className="checkout-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <div>
            <div className="checkout-title">Take payment</div>
            <div className="checkout-meta">
              {customer} · {lineCount} items · {invoiceNo}
            </div>
            <div className="checkout-meta-secondary">
              {saleDate} · Served by {servedBy}
            </div>
          </div>
          <button type="button" className="checkout-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="checkout-body">
          <div className="checkout-tenders">
            <div className="checkout-tenders-label">
              How the money came in — split across as many methods as you need
            </div>
            {TENDERS.map((t) => {
              const value = tender[t.key];
              const hasValue = parseFloat(value) > 0;
              return (
                <div key={t.key} className={`checkout-tender-row${hasValue ? " checkout-tender-row--filled" : ""}`}>
                  <div className="checkout-tender-info">
                    <div className="checkout-tender-dot" style={{ background: t.color }} />
                    <div className="checkout-tender-text">
                      <div className="checkout-tender-label">{t.label}</div>
                      <div className="checkout-tender-hint">{t.hint}</div>
                    </div>
                  </div>
                  <div className="checkout-tender-actions">
                    <button type="button" className="checkout-fill-balance" onClick={() => onFillBalance(t.key)}>
                      Fill balance
                    </button>
                    <div className="checkout-tender-input-wrap">
                      <span className="checkout-tender-currency">₦</span>
                      <input
                        className="checkout-tender-input"
                        value={value}
                        onChange={(e) => onChangeTender(t.key, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {needsRef && (
              <input className="checkout-reference-input" placeholder="Reference / terminal or cheque number" />
            )}
          </div>

          <div className="checkout-summary">
            <div className="checkout-summary-row">
              <span>Net payable</span>
              <span className="checkout-summary-value">{formatNaira(total)}</span>
            </div>
            <div className="checkout-summary-row">
              <span>Allocated</span>
              <span className="checkout-summary-value">{formatNaira(allocated)}</span>
            </div>
            <div className={`checkout-balance${isOverpaid ? " checkout-balance--change" : ""}`}>
              <span className="checkout-balance-label">
                {isOverpaid ? "Change due" : isFullyAllocated ? "Fully allocated" : "Balance due"}
              </span>
              <span className="checkout-balance-value">{formatNaira(Math.abs(balance))}</span>
            </div>
            <button
              type="button"
              className="checkout-complete"
              disabled={!isFullyAllocated}
              onClick={onComplete}
            >
              Complete &amp; print receipt
            </button>
            <button type="button" className="checkout-back" onClick={onClose}>
              Back to sale
            </button>
            <div className="checkout-disclaimer">
              Receipt prints on completion and the tender split is written to the day's cash-up.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutModal;
