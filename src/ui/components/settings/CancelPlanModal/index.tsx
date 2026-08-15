import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "../../common/Modal";
import { formatSettingsDate } from "../settings-data";
import "./index.css";

/**
 * Cancelling is the one irreversible-feeling action in Settings, so it is the
 * one place that breaks the section's instant-save rule: it states what is
 * lost, when access actually ends, and requires typing CANCEL before the
 * button arms. Everything else here saves on click precisely because it is
 * cheap to undo — this isn't.
 */

const CONFIRM_WORD = "CANCEL";

interface CancelPlanModalProps {
  planName: string;
  endsAt: number;
  onClose: () => void;
  onConfirm: () => void;
}

function CancelPlanModal({ planName, endsAt, onClose, onConfirm }: CancelPlanModalProps) {
  const [typed, setTyped] = useState("");
  const armed = typed.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <Modal
      icon={<AlertTriangle />}
      title={"Cancel " + planName + "?"}
      subtitle={"Access continues until " + formatSettingsDate(endsAt)}
      onClose={onClose}
      danger
      footer={
        <>
          <button type="button" className="panel-btn" onClick={onClose}>
            Keep my plan
          </button>
          <button
            type="button"
            className="cancel-plan-confirm"
            disabled={!armed}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Cancel plan
          </button>
        </>
      }
    >
      <p className="cancel-plan-lead">
        Your pharmacy keeps working until <strong>{formatSettingsDate(endsAt)}</strong>.
        After that:
      </p>

      <ul className="cancel-plan-list">
        <li>Staff can't record sales or receive stock</li>
        <li>Reports and customer care become read-only</li>
        <li>Remaining AI credits are forfeited</li>
        <li>Your data is kept for 90 days, so you can resubscribe and pick up where you left off</li>
      </ul>

      <label className="panel-field">
        <span className="panel-label">
          Type <em>{CONFIRM_WORD}</em> to confirm
        </span>
        <input
          className="panel-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={CONFIRM_WORD}
          autoFocus
        />
      </label>
    </Modal>
  );
}

export default CancelPlanModal;
