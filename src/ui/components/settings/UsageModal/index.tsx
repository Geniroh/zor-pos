import { Sparkles } from "lucide-react";
import Modal from "../../common/Modal";
import type { AiCredits } from "../settings-data";
import "./index.css";

/**
 * Where the AI credits went. A breakdown by service rather than a running log:
 * the question this answers is "what is eating my credits", not "what happened
 * at 14:32". Bars are sized against the largest line so the smallest service
 * is still visible, which a share-of-total scale would flatten to nothing.
 */

interface UsageModalProps {
  credits: AiCredits;
  onClose: () => void;
}

function UsageModal({ credits, onClose }: UsageModalProps) {
  const remaining = credits.total - credits.used;
  const peak = Math.max(...credits.breakdown.map((b) => b.credits), 1);

  return (
    <Modal
      icon={<Sparkles />}
      title="AI credit usage"
      subtitle={"This billing period · resets on renewal"}
      onClose={onClose}
      footer={
        <button type="button" className="panel-btn panel-btn--primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="usage-summary">
        <div className="usage-summary-figures">
          <span className="usage-figure">
            <strong>{remaining.toLocaleString()}</strong>
            <small>remaining</small>
          </span>
          <span className="usage-figure usage-figure--muted">
            <strong>{credits.used.toLocaleString()}</strong>
            <small>used</small>
          </span>
          <span className="usage-figure usage-figure--muted">
            <strong>{credits.total.toLocaleString()}</strong>
            <small>included</small>
          </span>
        </div>

        <div className="panel-meter">
          <div
            className="panel-meter-fill"
            style={{ width: (credits.used / credits.total) * 100 + "%" }}
          />
        </div>
      </div>

      <div className="usage-breakdown">
        {credits.breakdown.map((row) => (
          <div key={row.label} className="usage-row">
            <span className="usage-row-head">
              <span>{row.label}</span>
              <strong>{row.credits}</strong>
            </span>
            <span className="usage-bar">
              <span className="usage-bar-fill" style={{ width: (row.credits / peak) * 100 + "%" }} />
            </span>
          </div>
        ))}
      </div>

      <p className="modal-note">
        Credits are consumed by AI-assisted customer calls, drug interaction
        explanations and report insights. Unused credits don't roll over.
      </p>
    </Modal>
  );
}

export default UsageModal;
