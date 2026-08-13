import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { STAFF } from "../../pos/pos-data";
import type { AllergySeverity, ContactChannel } from "../care-data";
import "./index.css";

/**
 * The lighter Quick Actions — scheduling, allergies, medications. They share
 * the same shell and differ only in which fields show, so three near-identical
 * modal files would have been copy-paste.
 *
 * Consultations deliberately do NOT live here: they're a structured six-part
 * note with its own rules (a "Follow-up" visit must close a scheduled one), so
 * they get ConsultationModal instead.
 *
 * Conditionally rendered by its parent rather than taking an `open` prop —
 * the draft state below is seeded on mount, and a fresh mount is the only way
 * to reset it without setState-in-effect. Same reasoning as DiscountModal.
 */

export type CareActionKind = "follow-up" | "allergy" | "medication";

export interface CareActionDraft {
  kind: CareActionKind;
  /** Follow-up */
  summary: string;
  by: string;
  dueAt: number;
  channel: ContactChannel;
  /** Allergy */
  substance: string;
  reaction: string;
  severity: AllergySeverity;
  /** Medication */
  drug: string;
  schedule: string;
}

interface CareActionModalProps {
  kind: CareActionKind;
  customerName: string;
  onClose: () => void;
  onSubmit: (draft: CareActionDraft) => void;
}

const TITLES: Record<CareActionKind, string> = {
  "follow-up": "Schedule follow-up",
  allergy: "Record allergy",
  medication: "Add medication",
};

const SUBMIT_LABELS: Record<CareActionKind, string> = {
  "follow-up": "Schedule",
  allergy: "Record allergy",
  medication: "Add medication",
};

const SEVERITIES: AllergySeverity[] = ["Mild", "Moderate", "Severe"];
const CHANNELS: ContactChannel[] = ["Phone call", "In-person", "SMS"];

/** <input type="date"> wants yyyy-mm-dd, not a timestamp. */
function toDateInput(ts: number): string {
  const d = new Date(ts);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/** Passed to useState by reference, not called during render — Date.now() is impure. */
function defaultDueDate(): string {
  return toDateInput(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

function CareActionModal({ kind, customerName, onClose, onSubmit }: CareActionModalProps) {
  const [summary, setSummary] = useState("");
  const [by, setBy] = useState(STAFF[0]);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [channel, setChannel] = useState<ContactChannel>("Phone call");
  const [substance, setSubstance] = useState("");
  const [reaction, setReaction] = useState("");
  const [severity, setSeverity] = useState<AllergySeverity>("Moderate");
  const [drug, setDrug] = useState("");
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit =
    kind === "follow-up"
      ? summary.trim().length > 0 && dueDate !== ""
      : kind === "allergy"
        ? substance.trim().length > 0 && reaction.trim().length > 0
        : drug.trim().length > 0 && schedule.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      kind,
      summary: summary.trim(),
      by,
      dueAt: new Date(dueDate + "T09:00").getTime(),
      channel,
      substance: substance.trim(),
      reaction: reaction.trim(),
      severity,
      drug: drug.trim(),
      schedule: schedule.trim(),
    });
    onClose();
  }

  return (
    <div className="care-modal-backdrop" onClick={onClose}>
      <div className="care-modal" onClick={(e) => e.stopPropagation()}>
        <div className="care-modal-header">
          <span className="care-modal-title">
            {TITLES[kind]}
            <span className="care-modal-for">for {customerName}</span>
          </span>
          <button type="button" className="care-modal-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="care-modal-body">
          {kind === "follow-up" && (
            <>
              <label className="care-modal-field">
                <span className="care-modal-label">Reason</span>
                <input
                  className="care-modal-input"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Blood pressure re-check"
                  autoFocus
                />
              </label>
              <div className="care-modal-row">
                <label className="care-modal-field">
                  <span className="care-modal-label">Due date</span>
                  <input
                    type="date"
                    className="care-modal-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </label>
                <label className="care-modal-field">
                  <span className="care-modal-label">Channel</span>
                  <select
                    className="care-modal-input"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as ContactChannel)}
                  >
                    {CHANNELS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="care-modal-field">
                <span className="care-modal-label">Assigned to</span>
                <select className="care-modal-input" value={by} onChange={(e) => setBy(e.target.value)}>
                  {STAFF.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          {kind === "allergy" && (
            <>
              <label className="care-modal-field">
                <span className="care-modal-label">Substance</span>
                <input
                  className="care-modal-input"
                  value={substance}
                  onChange={(e) => setSubstance(e.target.value)}
                  placeholder="Penicillin"
                  autoFocus
                />
              </label>
              <div className="care-modal-row">
                <label className="care-modal-field">
                  <span className="care-modal-label">Reaction</span>
                  <input
                    className="care-modal-input"
                    value={reaction}
                    onChange={(e) => setReaction(e.target.value)}
                    placeholder="Rash"
                  />
                </label>
                <label className="care-modal-field">
                  <span className="care-modal-label">Severity</span>
                  <select
                    className="care-modal-input"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as AllergySeverity)}
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          {kind === "medication" && (
            <>
              <label className="care-modal-field">
                <span className="care-modal-label">Medication</span>
                <input
                  className="care-modal-input"
                  value={drug}
                  onChange={(e) => setDrug(e.target.value)}
                  placeholder="Lisinopril 10mg"
                  autoFocus
                />
              </label>
              <div className="care-modal-row">
                <label className="care-modal-field">
                  <span className="care-modal-label">Schedule</span>
                  <input
                    className="care-modal-input"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="1 tab daily"
                  />
                </label>
                <label className="care-modal-field">
                  <span className="care-modal-label">Prescriber</span>
                  <select className="care-modal-input" value={by} onChange={(e) => setBy(e.target.value)}>
                    {STAFF.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
        </div>

        <div className="care-modal-footer">
          <button type="button" className="care-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="care-modal-submit" disabled={!canSubmit} onClick={handleSubmit}>
            {SUBMIT_LABELS[kind]}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CareActionModal;
