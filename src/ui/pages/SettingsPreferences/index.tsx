import { Pill, Receipt, ShoppingCart } from "lucide-react";
import SettingsShell from "../../components/settings/SettingsShell";
import Switch from "../../components/common/Switch";
import { useSettings } from "../../context/SettingsContext";
import "./index.css";

/**
 * Preferences — the rules the pharmacy runs by, grouped small so each card
 * answers one question: how sales behave, how medicines are handled, what
 * happens to a receipt after checkout.
 *
 * Everything here is pharmacy-level (no branch picker). VAT is the one value
 * the settings model marks as arguably per-branch; it is kept pharmacy-wide
 * because a single business files one VAT rate, and splitting it per location
 * would be a tax decision, not a UI one.
 */

/** Clamps a percentage field, so a stray keystroke can't set VAT to 900%. */
function toPercent(value: string, max = 100): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(max, Math.max(0, parsed));
}

function SettingsPreferences() {
  const { preferences, updateSales, updateMedicines, updateReceiptPrefs, flash } = useSettings();
  const { sales, medicines, receipts } = preferences;

  return (
    <SettingsShell
      title="Preferences"
      subtitle="How sales, medicines and receipts behave across your pharmacy."
    >
      <section className="panel-card">
        <div className="panel-card-head">
          <div className="prefs-head">
            <span className="prefs-icon prefs-icon--sales">
              <ShoppingCart />
            </span>
            <div>
              <h2>Sales</h2>
              <p>Pricing, tax and what staff are allowed to do at the till.</p>
            </div>
          </div>
        </div>

        <div className="panel-rows">
          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Default markup</strong>
              <small>Applied over cost price when a product has no set sale price.</small>
            </span>
            <span className="panel-unit">
              <input
                type="number"
                min={0}
                max={500}
                value={sales.defaultMarkup}
                aria-label="Default markup percentage"
                onChange={(e) => updateSales({ defaultMarkup: toPercent(e.target.value, 500) })}
                onBlur={() => flash("Preferences updated")}
              />
              <span>%</span>
            </span>
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>VAT / tax rate</strong>
              <small>Used on every sale and shown as its own line on receipts.</small>
            </span>
            <span className="panel-unit">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={sales.vatRate}
                aria-label="VAT rate percentage"
                onChange={(e) => updateSales({ vatRate: toPercent(e.target.value) })}
                onBlur={() => flash("Preferences updated")}
              />
              <span>%</span>
            </span>
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Allow discounts</strong>
              <small>Let staff reduce a sale total at checkout.</small>
            </span>
            <Switch
              checked={sales.allowDiscounts}
              onChange={(allowDiscounts) => {
                updateSales({ allowDiscounts });
                flash("Preferences updated");
              }}
              ariaLabel="Allow discounts"
            />
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Require a reason for discounts</strong>
              <small>
                {sales.allowDiscounts
                  ? "Staff must say why before a discount is applied."
                  : "Turn on discounts first."}
              </small>
            </span>
            {/* Meaningless while discounts are off, so it's disabled rather
                than hidden — the rule still exists, it just can't apply. */}
            <Switch
              checked={sales.requireDiscountReason}
              disabled={!sales.allowDiscounts}
              onChange={(requireDiscountReason) => {
                updateSales({ requireDiscountReason });
                flash("Preferences updated");
              }}
              ariaLabel="Require a reason for discounts"
            />
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Allow negative stock sales</strong>
              <small>Sell items the system thinks are out of stock.</small>
            </span>
            <Switch
              checked={sales.allowNegativeStock}
              onChange={(allowNegativeStock) => {
                updateSales({ allowNegativeStock });
                flash("Preferences updated");
              }}
              ariaLabel="Allow negative stock sales"
            />
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div className="prefs-head">
            <span className="prefs-icon prefs-icon--meds">
              <Pill />
            </span>
            <div>
              <h2>Medicines</h2>
              <p>Safety checks that run while dispensing.</p>
            </div>
          </div>
        </div>

        <div className="panel-rows">
          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Require a prescription</strong>
              <small>
                For prescription-only and controlled medicines, before they can be sold.
              </small>
            </span>
            <Switch
              checked={medicines.requirePrescription}
              onChange={(requirePrescription) => {
                updateMedicines({ requirePrescription });
                flash("Preferences updated");
              }}
              ariaLabel="Require a prescription"
            />
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Warn before selling expired products</strong>
              <small>Blocks the line until someone confirms.</small>
            </span>
            <Switch
              checked={medicines.warnExpired}
              onChange={(warnExpired) => {
                updateMedicines({ warnExpired });
                flash("Preferences updated");
              }}
              ariaLabel="Warn before selling expired products"
            />
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Warn when stock is below reorder level</strong>
              <small>Flags low stock at the point of sale, not just in Inventory.</small>
            </span>
            <Switch
              checked={medicines.warnBelowReorder}
              onChange={(warnBelowReorder) => {
                updateMedicines({ warnBelowReorder });
                flash("Preferences updated");
              }}
              ariaLabel="Warn when stock is below reorder level"
            />
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Prefer earliest-expiry stock</strong>
              <small>Dispense the batch that expires soonest first.</small>
            </span>
            <Switch
              checked={medicines.preferEarliestExpiry}
              onChange={(preferEarliestExpiry) => {
                updateMedicines({ preferEarliestExpiry });
                flash("Preferences updated");
              }}
              ariaLabel="Prefer earliest-expiry stock"
            />
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div className="prefs-head">
            <span className="prefs-icon prefs-icon--receipts">
              <Receipt />
            </span>
            <div>
              <h2>Receipts</h2>
              <p>
                What happens after a sale. How the receipt looks is set in Profile &amp;
                Branding.
              </p>
            </div>
          </div>
        </div>

        <div className="panel-rows">
          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Print automatically after a sale</strong>
              <small>Sends to the branch's receipt printer on checkout.</small>
            </span>
            <Switch
              checked={receipts.autoPrint}
              onChange={(autoPrint) => {
                updateReceiptPrefs({ autoPrint });
                flash("Preferences updated");
              }}
              ariaLabel="Print automatically after a sale"
            />
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Send by SMS automatically</strong>
              <small>Only when the sale has a customer with a phone number.</small>
            </span>
            <Switch
              checked={receipts.autoSms}
              onChange={(autoSms) => {
                updateReceiptPrefs({ autoSms });
                flash("Preferences updated");
              }}
              ariaLabel="Send receipt by SMS automatically"
            />
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Send by email automatically</strong>
              <small>Only when the sale has a customer with an email address.</small>
            </span>
            <Switch
              checked={receipts.autoEmail}
              onChange={(autoEmail) => {
                updateReceiptPrefs({ autoEmail });
                flash("Preferences updated");
              }}
              ariaLabel="Send receipt by email automatically"
            />
          </div>
        </div>
      </section>
    </SettingsShell>
  );
}

export default SettingsPreferences;
