import { useState } from "react";
import { CreditCard, Download, Sparkles } from "lucide-react";
import SettingsShell from "../../components/settings/SettingsShell";
import UpgradePlanModal from "../../components/settings/UpgradePlanModal";
import UsageModal from "../../components/settings/UsageModal";
import CancelPlanModal from "../../components/settings/CancelPlanModal";
import { useSettings } from "../../context/SettingsContext";
import {
  INVOICES,
  PLANS,
  formatNaira,
  formatSettingsDate,
} from "../../components/settings/settings-data";
import "./index.css";

/**
 * Plan & Billing. AI credits get their own card next to the plan rather than
 * being buried under Preferences — for an AI-assisted product, "how many
 * credits are left" is a billing question the user asks often, and it belongs
 * where they already come to check what they're paying for.
 *
 * All three actions (change plan, view usage, cancel) open modals so this
 * stays a single route.
 */

function SettingsBilling() {
  const { subscription, credits, changePlan, cancelPlan, resumePlan, flash } = useSettings();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const plan = PLANS.find((p) => p.id === subscription.planId) ?? PLANS[0];
  const remaining = credits.total - credits.used;
  const usedPct = (credits.used / credits.total) * 100;

  return (
    <SettingsShell
      title="Plan & Billing"
      subtitle="Your subscription, AI credits and payment history."
    >
      <div className="billing-top">
        <section className="panel-card billing-plan">
          <div className="panel-card-head">
            <div>
              <h2>Current plan</h2>
              <p>What your pharmacy is subscribed to.</p>
            </div>
            <span className="billing-plan-icon">
              <CreditCard />
            </span>
          </div>

          <div className="panel-card-body">
            <div className="billing-plan-name">
              <strong>{plan.name}</strong>
              {subscription.cancelled && <span className="panel-pill panel-pill--off">Cancelling</span>}
            </div>

            <p className="billing-price">
              {formatNaira(plan.price)}
              <small>/month</small>
            </p>

            <p className="billing-next">
              {subscription.cancelled ? "Access ends " : "Next payment "}
              <strong>{formatSettingsDate(subscription.nextPaymentAt)}</strong>
            </p>

            {subscription.cancelled ? (
              <button
                type="button"
                className="panel-btn panel-btn--primary"
                onClick={() => {
                  resumePlan();
                  flash("Subscription resumed");
                }}
              >
                Resume plan
              </button>
            ) : (
              <button
                type="button"
                className="panel-btn panel-btn--primary"
                onClick={() => setUpgradeOpen(true)}
              >
                Upgrade plan
              </button>
            )}
          </div>
        </section>

        <section className="panel-card billing-credits">
          <div className="panel-card-head">
            <div>
              <h2>AI credits</h2>
              <p>Used for AI-assisted customer calls and other AI services.</p>
            </div>
            <span className="billing-credits-icon">
              <Sparkles />
            </span>
          </div>

          <div className="panel-card-body">
            <p className="billing-credits-count">
              <strong>{remaining.toLocaleString()}</strong>
              <span>
                / {credits.total.toLocaleString()} credits remaining
              </span>
            </p>

            <div className="panel-meter">
              <div className="panel-meter-fill" style={{ width: usedPct + "%" }} />
            </div>

            <p className="billing-credits-note">
              {credits.used.toLocaleString()} used this billing period. Credits reset when
              your plan renews.
            </p>

            <button type="button" className="panel-btn" onClick={() => setUsageOpen(true)}>
              View usage
            </button>
          </div>
        </section>
      </div>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Billing history</h2>
            <p>Every charge on this account.</p>
          </div>
        </div>

        <div className="billing-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="panel-num">Amount</th>
                <th>Status</th>
                <th aria-label="Invoice" />
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="billing-date">{formatSettingsDate(invoice.date)}</td>
                  <td>{invoice.description}</td>
                  <td className="panel-num">{formatNaira(invoice.amount)}</td>
                  <td>
                    <span
                      className={
                        "panel-pill " +
                        (invoice.status === "Paid" ? "panel-pill--on" : "panel-pill--off")
                      }
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="billing-invoice-cell">
                    <button
                      type="button"
                      className="panel-btn panel-btn--sm panel-btn--ghost"
                      onClick={() => flash("Invoice " + invoice.id + " is not available yet")}
                    >
                      <Download />
                      View invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!subscription.cancelled && (
        <section className="panel-card billing-danger">
          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Cancel plan</strong>
              <small>
                Your pharmacy keeps working until{" "}
                {formatSettingsDate(subscription.nextPaymentAt)}. You can resubscribe at any
                time.
              </small>
            </span>
            <button
              type="button"
              className="panel-btn panel-btn--sm panel-btn--danger"
              onClick={() => setCancelOpen(true)}
            >
              Cancel plan
            </button>
          </div>
        </section>
      )}

      {upgradeOpen && (
        <UpgradePlanModal
          currentPlanId={subscription.planId}
          onClose={() => setUpgradeOpen(false)}
          onChoose={(planId) => {
            changePlan(planId);
            const next = PLANS.find((p) => p.id === planId);
            flash("Switched to " + (next?.name ?? "new plan"));
          }}
        />
      )}

      {usageOpen && <UsageModal credits={credits} onClose={() => setUsageOpen(false)} />}

      {cancelOpen && (
        <CancelPlanModal
          planName={plan.name}
          endsAt={subscription.nextPaymentAt}
          onClose={() => setCancelOpen(false)}
          onConfirm={() => {
            cancelPlan();
            flash("Plan cancelled — access continues until renewal");
          }}
        />
      )}
    </SettingsShell>
  );
}

export default SettingsBilling;
