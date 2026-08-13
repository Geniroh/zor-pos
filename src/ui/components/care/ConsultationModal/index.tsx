import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  CARE_CUSTOMERS,
  CLINICIANS,
  OUTCOMES,
  VISIT_REASONS,
  allergiesFor,
  findCustomer,
  followUpsFor,
  formatDate,
  medicationsFor,
  relativeDays,
  type ContactChannel,
  type VisitReason,
} from "../care-data";
import "./index.css";

/**
 * The structured consultation note. Six short sections rather than a hospital
 * chart — enough to be useful care documentation, not so much that it doesn't
 * get filled in.
 *
 * Conditionally rendered by its parent (no `open` prop), like DiscountModal.
 */

export interface ConsultationDraft {
  customerId: string;
  by: string;
  reason: VisitReason;
  concern: string;
  assessment: string;
  intervention: string;
  medication: string;
  outcome: string;
  /** Set when reason is "Follow-up" — the scheduled intent being closed. */
  closesFollowUpId?: string;
  followUp: { dueAt: number; reason: string; channel: ContactChannel } | null;
}

interface ConsultationModalProps {
  /** Omitted when opened from a branch-wide screen — the form asks who it's for. */
  customerId?: string;
  /** Preselects "Follow-up" and locks the record it closes. */
  closesFollowUpId?: string;
  onClose: () => void;
  onSubmit: (draft: ConsultationDraft) => void;
}

const CHANNELS: ContactChannel[] = ["Phone call", "In-person", "SMS"];

function toDateInput(ts: number): string {
  const d = new Date(ts);
  return (
    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
  );
}

function defaultFollowUpDate(): string {
  return toDateInput(Date.now() + 14 * 24 * 60 * 60 * 1000);
}

function ConsultationModal({
  customerId,
  closesFollowUpId,
  onClose,
  onSubmit,
}: ConsultationModalProps) {
  const [patientId, setPatientId] = useState(customerId ?? "");
  const [by, setBy] = useState(CLINICIANS[0]);
  const [reason, setReason] = useState<VisitReason>(closesFollowUpId ? "Follow-up" : "Medication review");
  const [closes, setCloses] = useState(closesFollowUpId ?? "");
  const [concern, setConcern] = useState("");
  const [assessment, setAssessment] = useState("");
  const [intervention, setIntervention] = useState("");
  const [medication, setMedication] = useState("");
  const [outcome, setOutcome] = useState(OUTCOMES[1]);
  const [wantsFollowUp, setWantsFollowUp] = useState(false);
  const [followUpReason, setFollowUpReason] = useState("");
  const [followUpDate, setFollowUpDate] = useState(defaultFollowUpDate);
  const [followUpChannel, setFollowUpChannel] = useState<ContactChannel>("Phone call");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open follow-ups for this patient — a "Follow-up" visit must close one of
  // these, which is what stops follow-up records floating free.
  const openFollowUps = useMemo(
    () => (patientId ? followUpsFor(patientId).filter((f) => f.status !== "Completed") : []),
    [patientId],
  );

  const allergies = useMemo(() => (patientId ? allergiesFor(patientId) : []), [patientId]);
  const currentMeds = useMemo(() => (patientId ? medicationsFor(patientId) : []), [patientId]);

  // Warn if the medication being written up names something they react to.
  const allergyClash = useMemo(() => {
    const text = medication.toLowerCase();
    if (!text) return [];
    return allergies.filter((a) => text.includes(a.substance.toLowerCase().split(" ")[0]));
  }, [medication, allergies]);

  const canSubmit =
    patientId !== "" &&
    concern.trim().length > 0 &&
    assessment.trim().length > 0 &&
    (reason !== "Follow-up" || closes !== "");

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      customerId: patientId,
      by,
      reason,
      concern: concern.trim(),
      assessment: assessment.trim(),
      intervention: intervention.trim(),
      medication: medication.trim() || "None",
      outcome,
      closesFollowUpId: reason === "Follow-up" ? closes : undefined,
      followUp: wantsFollowUp
        ? {
            dueAt: new Date(followUpDate + "T09:00").getTime(),
            reason: followUpReason.trim() || "Review",
            channel: followUpChannel,
          }
        : null,
    });
    onClose();
  }

  return (
    <div className="cons-backdrop" onClick={onClose}>
      <div className="cons-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cons-header">
          <span className="cons-title">
            Consultation
            <span className="cons-sub">Structured note — only the first two sections are required</span>
          </span>
          <button type="button" className="cons-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="cons-body">
          <div className="cons-row">
            <label className="cons-field">
              <span className="cons-label">Patient</span>
              {customerId ? (
                // Not restricted to PATIENTS — a consultation is how a plain
                // customer gets a clinical file in the first place.
                <input className="cons-input" value={findCustomer(customerId)?.name ?? ""} disabled />
              ) : (
                <select
                  className="cons-input"
                  value={patientId}
                  onChange={(e) => {
                    setPatientId(e.target.value);
                    setCloses("");
                  }}
                >
                  <option value="">Select a patient…</option>
                  {CARE_CUSTOMERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.phone}
                      {p.isPatient ? "" : " (no file yet)"}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label className="cons-field">
              <span className="cons-label">Seen by</span>
              <select className="cons-input" value={by} onChange={(e) => setBy(e.target.value)}>
                {CLINICIANS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="cons-field">
            <span className="cons-label">Reason for visit</span>
            <div className="cons-reasons">
              {VISIT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={"cons-reason" + (reason === r ? " cons-reason-active" : "")}
                  onClick={() => setReason(r)}
                  disabled={Boolean(closesFollowUpId) && r !== "Follow-up"}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {reason === "Follow-up" && (
            <label className="cons-field">
              <span className="cons-label">Which follow-up does this close?</span>
              {openFollowUps.length === 0 ? (
                <span className="cons-hint cons-hint-warn">
                  This patient has no open follow-up. Pick another reason, or schedule one first.
                </span>
              ) : (
                <select
                  className="cons-input"
                  value={closes}
                  onChange={(e) => setCloses(e.target.value)}
                  disabled={Boolean(closesFollowUpId)}
                >
                  <option value="">Select…</option>
                  {openFollowUps.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.reason} · due {formatDate(f.dueAt)} ({relativeDays(f.dueAt)})
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}

          <label className="cons-field">
            <span className="cons-label">
              Patient concern <em>in their words</em>
            </span>
            <textarea
              className="cons-input cons-textarea"
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="Persistent dry cough for 5 days, worse at night"
            />
          </label>

          <label className="cons-field">
            <span className="cons-label">
              Assessment / findings <em>what did you identify?</em>
            </span>
            <textarea
              className="cons-input cons-textarea"
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Cough began 3 weeks after starting lisinopril — likely ACE-inhibitor cough"
            />
          </label>

          <label className="cons-field">
            <span className="cons-label">
              Intervention / advice <em>what did you do?</em>
            </span>
            <textarea
              className="cons-input cons-textarea"
              value={intervention}
              onChange={(e) => setIntervention(e.target.value)}
              placeholder="Referred back to prescriber to consider an ARB; advised not to stop abruptly"
            />
          </label>

          <label className="cons-field">
            <span className="cons-label">
              Medication <em>recommended, dispensed or existing</em>
            </span>
            <input
              className="cons-input"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="Paracetamol 500mg (recommended)"
            />
            {currentMeds.length > 0 && (
              <div className="cons-chips">
                {currentMeds.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="cons-chip"
                    onClick={() =>
                      setMedication((prev) => (prev ? prev + ", " : "") + m.name + " (existing)")
                    }
                  >
                    + {m.name}
                  </button>
                ))}
              </div>
            )}
            {allergyClash.length > 0 && (
              <span className="cons-alert">
                <AlertTriangle className="cons-alert-icon" />
                Recorded allergy to {allergyClash.map((a) => a.substance).join(", ")} —{" "}
                {allergyClash[0].reaction.toLowerCase()}
              </span>
            )}
          </label>

          <div className="cons-field">
            <span className="cons-label">Outcome</span>
            <div className="cons-reasons">
              {OUTCOMES.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={"cons-reason" + (outcome === o ? " cons-reason-active" : "")}
                  onClick={() => setOutcome(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div className="cons-followup">
            <label className="cons-check">
              <input
                type="checkbox"
                checked={wantsFollowUp}
                onChange={(e) => setWantsFollowUp(e.target.checked)}
              />
              Schedule a follow-up
            </label>

            {wantsFollowUp && (
              <div className="cons-followup-fields">
                <label className="cons-field">
                  <span className="cons-label">Reason</span>
                  <input
                    className="cons-input"
                    value={followUpReason}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    placeholder="Blood pressure re-check"
                  />
                </label>
                <label className="cons-field">
                  <span className="cons-label">Due</span>
                  <input
                    type="date"
                    className="cons-input"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </label>
                <label className="cons-field">
                  <span className="cons-label">Channel</span>
                  <select
                    className="cons-input"
                    value={followUpChannel}
                    onChange={(e) => setFollowUpChannel(e.target.value as ContactChannel)}
                  >
                    {CHANNELS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="cons-footer">
          <button type="button" className="cons-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cons-submit" disabled={!canSubmit} onClick={handleSubmit}>
            Save consultation
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConsultationModal;
