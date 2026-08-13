import { useEffect, useRef, useState } from "react";
import { Check, Loader, MessageSquare, Phone, X } from "lucide-react";
import { STAFF } from "../../pos/pos-data";
import type { CallOutcome } from "../care-data";
import "./index.css";

/**
 * Simulated SMS and calls. The whole UI is real — compose, recipient list,
 * per-call outcome — and only the send itself is faked, so wiring a messaging
 * backend later replaces one function rather than this screen.
 *
 * {name} in a message body is substituted with each recipient's first name.
 */

export interface Recipient {
  customerId: string;
  name: string;
  phone: string;
}

export interface ContactResult {
  message: string;
  by: string;
  outcome?: CallOutcome;
}

interface ContactModalProps {
  channel: "SMS" | "Phone call";
  recipients: Recipient[];
  template?: string;
  onClose: () => void;
  onSend: (result: ContactResult) => void;
}

const CALL_OUTCOMES: CallOutcome[] = ["Reached", "No answer", "Left message"];

const SMS_TEMPLATES = [
  {
    label: "Refill reminder",
    body: "Hello {name}, your refill at Zorpill Pharmacy is due. Reply or call us to arrange collection.",
  },
  {
    label: "Win-back",
    body: "Hi {name}, we haven't seen you in a while. Your pharmacist at Zorpill is here if you need anything.",
  },
  {
    label: "Follow-up reminder",
    body: "Hello {name}, this is a reminder about your review at Zorpill Pharmacy. Please call us to confirm a time.",
  },
  {
    label: "Birthday",
    body: "Happy birthday {name}! From all of us at Zorpill Pharmacy — wishing you a healthy year ahead.",
  },
];

function firstName(name: string): string {
  return name.split(" ")[0];
}

function ContactModal({ channel, recipients, template, onClose, onSend }: ContactModalProps) {
  const isSms = channel === "SMS";
  const [message, setMessage] = useState(template ?? SMS_TEMPLATES[0].body);
  const [by, setBy] = useState(STAFF[0]);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [phase, setPhase] = useState<"compose" | "sending" | "calling">("compose");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preview = recipients.length
    ? message.replace(/\{name\}/g, firstName(recipients[0].name))
    : message;
  const segments = Math.max(1, Math.ceil(preview.length / 160));

  function handleSend() {
    if (!message.trim()) return;
    // Stands in for the network round-trip a real gateway would take.
    setPhase("sending");
    timer.current = setTimeout(() => {
      onSend({ message: message.trim(), by });
      onClose();
    }, 750);
  }

  function handleLogCall() {
    if (!outcome) return;
    onSend({ message: note.trim() || outcome, by, outcome });
    onClose();
  }

  return (
    <div className="cm-backdrop" onClick={onClose}>
      <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cm-header">
          <span className="cm-title">
            <span className={"cm-title-icon" + (isSms ? " cm-title-sms" : " cm-title-call")}>
              {isSms ? <MessageSquare /> : <Phone />}
            </span>
            <span className="cm-title-text">
              {isSms ? "Send SMS" : "Call patient"}
              <span className="cm-sub">
                {recipients.length === 1
                  ? recipients[0].name + " · " + recipients[0].phone
                  : recipients.length + " recipients"}
              </span>
            </span>
          </span>
          <button type="button" className="cm-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="cm-body">
          {isSms ? (
            <>
              <div className="cm-field">
                <span className="cm-label">Template</span>
                <div className="cm-templates">
                  {SMS_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      className={"cm-template" + (message === t.body ? " cm-template-active" : "")}
                      onClick={() => setMessage(t.body)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="cm-field">
                <span className="cm-label">
                  Message <em>{"{name}"} becomes their first name</em>
                </span>
                <textarea
                  className="cm-input cm-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <span className="cm-meta">
                  {preview.length} characters · {segments} SMS {segments === 1 ? "segment" : "segments"}
                </span>
              </label>

              <div className="cm-preview">
                <span className="cm-preview-label">Preview</span>
                <p>{preview}</p>
              </div>

              {recipients.length > 1 && (
                <div className="cm-recipients">
                  <span className="cm-label">Sending to</span>
                  <div className="cm-recipient-list">
                    {recipients.slice(0, 6).map((r) => (
                      <span key={r.customerId} className="cm-recipient">
                        {r.name}
                      </span>
                    ))}
                    {recipients.length > 6 && (
                      <span className="cm-recipient cm-recipient-more">
                        +{recipients.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="cm-dial">
                <span className="cm-dial-number">{recipients[0]?.phone ?? "—"}</span>
                {phase === "calling" ? (
                  <span className="cm-dial-status">
                    <Loader className="cm-spin" />
                    Call in progress…
                  </span>
                ) : (
                  <button type="button" className="cm-dial-btn" onClick={() => setPhase("calling")}>
                    <Phone className="cm-dial-icon" />
                    Start call
                  </button>
                )}
              </div>

              <div className="cm-field">
                <span className="cm-label">How did it go?</span>
                <div className="cm-templates">
                  {CALL_OUTCOMES.map((o) => (
                    <button
                      key={o}
                      type="button"
                      className={"cm-template" + (outcome === o ? " cm-template-active" : "")}
                      onClick={() => setOutcome(o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <label className="cm-field">
                <span className="cm-label">
                  Note <em>optional</em>
                </span>
                <textarea
                  className="cm-input cm-textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Agreed to collect on Friday"
                />
              </label>
            </>
          )}

          <label className="cm-field">
            <span className="cm-label">Logged by</span>
            <select className="cm-input" value={by} onChange={(e) => setBy(e.target.value)}>
              {STAFF.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>

          <span className="cm-simulated">
            Simulated for now — nothing is actually {isSms ? "sent" : "dialled"} until the messaging
            backend is connected. The contact is still recorded on the patient.
          </span>
        </div>

        <div className="cm-footer">
          <button type="button" className="cm-cancel" onClick={onClose}>
            Cancel
          </button>
          {isSms ? (
            <button
              type="button"
              className="cm-submit"
              disabled={!message.trim() || phase === "sending"}
              onClick={handleSend}
            >
              {phase === "sending" ? (
                <>
                  <Loader className="cm-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Check className="cm-submit-icon" />
                  Send to {recipients.length} {recipients.length === 1 ? "patient" : "patients"}
                </>
              )}
            </button>
          ) : (
            <button type="button" className="cm-submit" disabled={!outcome} onClick={handleLogCall}>
              Log call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactModal;
