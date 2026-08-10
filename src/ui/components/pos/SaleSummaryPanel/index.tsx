import { useState } from "react";
import { PanelRightClose, PanelRightOpen, Percent } from "lucide-react";
import CustomerPicker from "../CustomerPicker";
import DiscountModal from "../DiscountModal";
import type { Customer } from "../pos-data";
import { formatNaira } from "../pos-data";
import "./index.css";

interface SaleSummaryPanelProps {
  lineCount: number;
  customer: string;
  customers: Customer[];
  onSelectCustomer: (name: string) => void;
  onAddCustomer: (customer: Customer) => void;
  saleDate: string;
  servedBy: string;
  invoiceNo: string;
  onHold: () => void;
  onClear: () => void;
  onCheckout: () => void;
  gross: number;
  discount: number;
  vatAmount: number;
  vatRatePct: number;
  total: number;
  discountMode: "pct" | "amt";
  discountInput: string;
  onApplyDiscount: (mode: "pct" | "amt", value: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function SaleSummaryPanel({
  lineCount,
  customer,
  customers,
  onSelectCustomer,
  onAddCustomer,
  saleDate,
  servedBy,
  invoiceNo,
  onHold,
  onClear,
  onCheckout,
  gross,
  discount,
  vatAmount,
  vatRatePct,
  total,
  discountMode,
  discountInput,
  onApplyDiscount,
  collapsed,
  onToggleCollapsed,
}: SaleSummaryPanelProps) {
  const isEmpty = lineCount === 0;
  const [discountModalOpen, setDiscountModalOpen] = useState(false);

  if (collapsed) {
    return (
      <div className="sale-summary-panel sale-summary-panel--collapsed">
        <button
          type="button"
          className="sale-summary-collapse-toggle"
          onClick={onToggleCollapsed}
          aria-label="Expand sale summary"
          title="Expand sale summary"
        >
          <PanelRightOpen />
        </button>

        <div className="sale-summary-mini-field">
          <span className="sale-summary-info-label">Customer</span>
          <span className="sale-summary-mini-value">{customer}</span>
        </div>
        <div className="sale-summary-mini-field">
          <span className="sale-summary-info-label">Items</span>
          <span className="sale-summary-mini-value">{lineCount}</span>
        </div>

        <div className="sale-summary-mini-spacer" />

        <div className="sale-summary-mini-field">
          <span className="sale-summary-info-label">Total</span>
          <span className="sale-summary-mini-total">{formatNaira(total)}</span>
        </div>

        <button type="button" className="sale-summary-mini-checkout" disabled={isEmpty} onClick={onCheckout}>
          Checkout
        </button>
        <button type="button" className="sale-summary-mini-hold" onClick={onHold}>
          Hold
        </button>
      </div>
    );
  }

  return (
    <div className="sale-summary-panel">
      <div className="sale-summary-header">
        <div className="sale-summary-title-block">
          <span className="sale-summary-title">Sale Summary</span>
          <span className="sale-summary-subtitle">{lineCount} item(s)</span>
        </div>
        <div className="sale-summary-header-actions">
          <button type="button" className="sale-summary-hold-btn" onClick={onHold}>
            Hold
          </button>
          <button type="button" className="sale-summary-clear-btn" onClick={onClear}>
            Clear
          </button>
          <button
            type="button"
            className="sale-summary-collapse-toggle"
            onClick={onToggleCollapsed}
            aria-label="Collapse sale summary"
            title="Collapse sale summary"
          >
            <PanelRightClose />
          </button>
        </div>
      </div>

      <div className="sale-summary-info-grid">
        <div className="sale-summary-info-field sale-summary-info-field--span2">
          <span className="sale-summary-info-label">Customer</span>
          <CustomerPicker
            customer={customer}
            customers={customers}
            onSelectCustomer={onSelectCustomer}
            onAddCustomer={onAddCustomer}
          />
        </div>
        <div className="sale-summary-info-field">
          <span className="sale-summary-info-label">Sale date</span>
          <div className="sale-summary-info-static">{saleDate}</div>
        </div>
        <div className="sale-summary-info-field">
          <span className="sale-summary-info-label">Served by</span>
          <div className="sale-summary-info-static">{servedBy}</div>
        </div>
        <div className="sale-summary-info-field sale-summary-info-field--span2">
          <span className="sale-summary-info-label">Invoice no</span>
          <div className="sale-summary-info-static sale-summary-info-static--between">
            <span>{invoiceNo}</span>
            <span className="sale-summary-info-auto">Auto</span>
          </div>
        </div>
      </div>

      <div className="sale-summary-footer">
        <button type="button" className="sale-summary-note">
          + Add note / prescription
        </button>

        <div className="sale-summary-totals-row">
          <span>Subtotal</span>
          <span className="sale-summary-totals-value">{formatNaira(gross)}</span>
        </div>
        <div className="sale-summary-totals-row">
          <span>Discount</span>
          <span className="sale-summary-totals-value sale-summary-totals-value--danger">
            −{formatNaira(discount)}
          </span>
        </div>
        <div className="sale-summary-totals-row">
          <span>VAT ({vatRatePct}%)</span>
          <span className="sale-summary-totals-value">{formatNaira(vatAmount)}</span>
        </div>
        <div className="sale-summary-total-row">
          <span>Total</span>
          <span className="sale-summary-total-value">{formatNaira(total)}</span>
        </div>

        <button type="button" className="sale-summary-checkout" disabled={isEmpty} onClick={onCheckout}>
          <span>Checkout &amp; print</span>
          <kbd>F5</kbd>
        </button>

        <div className="sale-summary-secondary-actions">
          <button type="button" className="sale-summary-secondary-btn" onClick={onHold}>
            Hold <kbd>F6</kbd>
          </button>
          <button type="button" className="sale-summary-secondary-btn" onClick={() => setDiscountModalOpen(true)}>
            <Percent className="sale-summary-secondary-btn-icon" />
            Give discount
          </button>
        </div>
      </div>

      {discountModalOpen && (
        <DiscountModal
          onClose={() => setDiscountModalOpen(false)}
          gross={gross}
          mode={discountMode}
          value={discountInput}
          onApply={onApplyDiscount}
        />
      )}
    </div>
  );
}

export default SaleSummaryPanel;
