import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import Modal from "../../common/Modal";
import { PLANS, formatNaira } from "../settings-data";
import "./index.css";

/**
 * Plan comparison. Opens with the current plan selected, so "Upgrade" is
 * really "change plan" — moving down a tier is as legitimate as moving up, and
 * hiding the cheaper options would be a dark pattern.
 */

interface UpgradePlanModalProps {
  currentPlanId: string;
  onClose: () => void;
  onChoose: (planId: string) => void;
}

function UpgradePlanModal({ currentPlanId, onClose, onChoose }: UpgradePlanModalProps) {
  const [selected, setSelected] = useState(currentPlanId);

  const current = PLANS.find((p) => p.id === currentPlanId);
  const chosen = PLANS.find((p) => p.id === selected);
  const unchanged = selected === currentPlanId;

  // Tells the user which direction they're moving, since the button label
  // shouldn't say "Upgrade" when they've picked a cheaper tier.
  const direction =
    !current || !chosen || unchanged
      ? null
      : chosen.price > current.price
        ? "Upgrade"
        : "Downgrade";

  return (
    <Modal
      icon={<Sparkles />}
      title="Change plan"
      subtitle="Billing updates on your next payment date"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="panel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="panel-btn panel-btn--primary"
            disabled={unchanged}
            onClick={() => {
              onChoose(selected);
              onClose();
            }}
          >
            {unchanged ? "Current plan" : direction + " to " + chosen?.name}
          </button>
        </>
      }
    >
      <div className="plans-grid">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isSelected = plan.id === selected;

          return (
            <button
              key={plan.id}
              type="button"
              className={"plan-card" + (isSelected ? " plan-card--selected" : "")}
              aria-pressed={isSelected}
              onClick={() => setSelected(plan.id)}
            >
              <span className="plan-card-head">
                <strong>{plan.name}</strong>
                {isCurrent && <span className="panel-pill">Current</span>}
              </span>

              <span className="plan-card-price">
                {formatNaira(plan.price)}
                <small>/month</small>
              </span>

              <span className="plan-card-blurb">{plan.blurb}</span>

              <span className="plan-card-features">
                {plan.features.map((feature) => (
                  <span key={feature} className="plan-card-feature">
                    <Check className="plan-card-check" />
                    {feature}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <p className="modal-note">
        Changing plan takes effect on your next payment date. Nothing is charged today,
        and your AI credit balance carries over.
      </p>
    </Modal>
  );
}

export default UpgradePlanModal;
