import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { CLINICIANS, OUTCOMES, formatDate, relativeDays, type FollowUp } from "../care-data";
import "./index.css";

/**
 * The primary action on a queued follow-up. Deliberately light — three fields,
 * so working the queue stays fast — but never "mark done" alone: an outcome
 * and a note are what make the record worth keeping. Anything more involved
 * escapes to the full consultation form via onNeedsConsultation.
 */

/** Read once at module load — Date.now() can't be called during render. */
const now = Date.now();

export interface OutcomeDraft {
  by: string;
  notes: string;
  outcome: string;
  /** Non-null when the pharmacist wants another follow-up after this one. */
  nextDueAt: number | null;
}

interface LogOutcomeModalProps {
  followUp: FollowUp;
  patientName: string;
  onClose: () => void;
  onSubmit: (draft: OutcomeDraft) => void;
  onNeedsConsultation: () => void;
}

function toDateInput(ts: number): string {
  const d = new Date(ts);
  return (
    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
  );
}

function defaultNextDate(): string {
  return toDateInput(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function LogOutcomeModal({
  followUp,
  patientName,
  onClose,
  onSubmit,
  onNeedsConsultation,
}: LogOutcomeModalProps) {
  const [by, setBy] = useState(followUp.by);
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [wantsNext, setWantsNext] = useState(false);
  const [nextDate, setNextDate] = useState(defaultNextDate);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = notes.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      by,
      notes: notes.trim(),
      outcome,
      nextDueAt: wantsNext ? new Date(nextDate + "T09:00").getTime() : null,
    });
    onClose();
  }

  return (
    <div className="out-backdrop" onClick={onClose}>
      <div className="out-modal" onClick={(e) => e.stopPropagation()}>
        <div className="out-header">
          <span className="out-title">
            Log outcome
            <span className="out-sub">
              {patientName} · {followUp.reason}
            </span>
          </span>
          <button type="button" className="out-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="out-context">
          <span>
            {followUp.channel} · due {formatDate(followUp.dueAt)}
          </span>
          <span className={followUp.dueAt < now ? "out-overdue" : ""}>
            {relativeDays(followUp.dueAt)}
          </span>
        </div>

        <div className="out-body">
          <label className="out-field">
            <span className="out-label">What happened</span>
            <textarea
              className="out-input out-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Called, reports home readings averaging 130/85"
              autoFocus
            />
          </label>

          <div className="out-field">
            <span className="out-label">Outcome</span>
            <div className="out-options">
              {OUTCOMES.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={"out-option" + (outcome === o ? " out-option-active" : "")}
                  onClick={() => setOutcome(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <label className="out-field">
            <span className="out-label">Logged by</span>
            <select className="out-input" value={by} onChange={(e) => setBy(e.target.value)}>
              {CLINICIANS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <div className="out-next">
            <label className="out-check">
              <input type="checkbox" checked={wantsNext} onChange={(e) => setWantsNext(e.target.checked)} />
              Schedule another follow-up
            </label>
            {wantsNext && (
              <input
                type="date"
                className="out-input out-date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
              />
            )}
          </div>

          <button type="button" className="out-escape" onClick={onNeedsConsultation}>
            Needs a full consultation instead
            <ArrowRight className="out-escape-icon" />
          </button>
        </div>

        <div className="out-footer">
          <button type="button" className="out-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="out-submit" disabled={!canSubmit} onClick={handleSubmit}>
            Log outcome
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogOutcomeModal;
