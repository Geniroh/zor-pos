import type { SaleLine } from "./pos-data";
import { formatNaira } from "./pos-data";
import "./TotalsPanel.css";

interface TotalsPanelProps {
  lines: SaleLine[];
  gross: number;
  discount: number;
  vatAmount: number;
  vatRatePct: number;
  total: number;
  discountOpen: boolean;
  onToggleDiscount: () => void;
  discountMode: "pct" | "amt";
  onSetDiscountMode: (mode: "pct" | "amt") => void;
  discountInput: string;
  onChangeDiscountInput: (value: string) => void;
}

function TotalsPanel({
  lines,
  gross,
  discount,
  vatAmount,
  vatRatePct,
  total,
  discountOpen,
  onToggleDiscount,
  discountMode,
  onSetDiscountMode,
  discountInput,
  onChangeDiscountInput,
}: TotalsPanelProps) {
  return (
    <div className="totals-panel">
      <div className="totals-panel-header">
        <span className="totals-panel-label">Sale totals</span>
        <div className="totals-panel-discount">
          <button type="button" className="totals-panel-discount-toggle" onClick={onToggleDiscount}>
            Give discount
          </button>
          {discountOpen && (
            <div className="totals-panel-discount-controls">
              <div className="totals-panel-discount-seg">
                <button
                  type="button"
                  className={`totals-panel-seg-btn${discountMode === "pct" ? " totals-panel-seg-btn--active" : ""}`}
                  onClick={() => onSetDiscountMode("pct")}
                >
                  %
                </button>
                <button
                  type="button"
                  className={`totals-panel-seg-btn${discountMode === "amt" ? " totals-panel-seg-btn--active" : ""}`}
                  onClick={() => onSetDiscountMode("amt")}
                >
                  ₦
                </button>
              </div>
              <input
                className="totals-panel-discount-input"
                value={discountInput}
                onChange={(e) => onChangeDiscountInput(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="totals-panel-tiles">
        <div className="totals-panel-tile">
          <div className="totals-panel-tile-label">Gross amt</div>
          <div className="totals-panel-tile-value">{formatNaira(gross)}</div>
        </div>
        <div className="totals-panel-tile">
          <div className="totals-panel-tile-label">Discount</div>
          <div className="totals-panel-tile-value totals-panel-tile-value--danger">{formatNaira(discount)}</div>
        </div>
        <div className="totals-panel-tile">
          <div className="totals-panel-tile-label">VAT amt</div>
          <div className="totals-panel-tile-value">{formatNaira(vatAmount)}</div>
        </div>
        <div className="totals-panel-tile totals-panel-tile--highlight">
          <div className="totals-panel-tile-label totals-panel-tile-label--highlight">Net payable</div>
          <div className="totals-panel-tile-value totals-panel-tile-value--highlight">{formatNaira(total)}</div>
        </div>
      </div>

      <div className="totals-panel-chips">
        <span className="totals-panel-chips-label">In cart</span>
        {lines.map((line) => (
          <div key={line.key} className="totals-panel-chip">
            {line.name}
            <span className="totals-panel-chip-qty">×{line.qty}</span>
            <span className="totals-panel-chip-amount">{formatNaira(line.price * line.qty)}</span>
          </div>
        ))}
      </div>

      <div className="totals-panel-vat-note">VAT applied at {vatRatePct}% on VAT-eligible lines.</div>
    </div>
  );
}

export default TotalsPanel;
