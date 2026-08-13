import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarClock, MessageSquareQuote, Stethoscope, X } from "lucide-react";
import {
  FOLLOW_UPS,
  findCustomer,
  formatDate,
  relativeDays,
  type CareActivity,
} from "../care-data";
import "./index.css";

/**
 * Read view of one consultation. A drawer rather than a route so the log stays
 * visible behind it — same call SupplierDetailDrawer made.
 */

interface ConsultationDrawerProps {
  activity: CareActivity;
  onClose: () => void;
}

const SECTIONS: { key: keyof CareActivity; label: string; hint: string }[] = [
  { key: "concern", label: "Patient concern", hint: "In their words" },
  { key: "assessment", label: "Assessment / findings", hint: "What the pharmacist identified" },
  { key: "intervention", label: "Intervention / advice", hint: "What the pharmacist did" },
  { key: "medication", label: "Medication", hint: "Recommended, dispensed or existing" },
];

function ConsultationDrawer({ activity, onClose }: ConsultationDrawerProps) {
  const customer = findCustomer(activity.customerId);
  const closed = activity.closesFollowUpId
    ? FOLLOW_UPS.find((f) => f.id === activity.closesFollowUpId)
    : undefined;
  const produced = activity.producedFollowUpId
    ? FOLLOW_UPS.find((f) => f.id === activity.producedFollowUpId)
    : undefined;

  return (
    <div className="cdw-backdrop" onClick={onClose}>
      <aside className="cdw-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cdw-header">
          <div className="cdw-heading">
            <span className="cdw-reason">{activity.reason}</span>
            <h2>{customer?.name ?? activity.customerId}</h2>
            <span className="cdw-meta">
              {formatDate(activity.date)} · {activity.by}
            </span>
          </div>
          <button type="button" className="cdw-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="cdw-body">
          {closed && (
            <div className="cdw-link cdw-link-closed">
              <CalendarClock className="cdw-link-icon" />
              <span>
                Closed the follow-up <strong>{closed.reason}</strong>, due {formatDate(closed.dueAt)}
              </span>
            </div>
          )}

          {SECTIONS.map(({ key, label, hint }) => (
            <section key={key} className="cdw-section">
              <span className="cdw-section-label">
                {label}
                <em>{hint}</em>
              </span>
              <p>{String(activity[key] ?? "—") || "—"}</p>
            </section>
          ))}

          <section className="cdw-section">
            <span className="cdw-section-label">Outcome</span>
            <span className="cdw-outcome">{activity.outcome}</span>
          </section>

          {produced && (
            <div className="cdw-link cdw-link-produced">
              <CalendarClock className="cdw-link-icon" />
              <span>
                Scheduled a follow-up · <strong>{produced.reason}</strong> {formatDate(produced.dueAt)} (
                {relativeDays(produced.dueAt)})
              </span>
            </div>
          )}

          {!produced && !closed && (
            <div className="cdw-link cdw-link-none">
              <MessageSquareQuote className="cdw-link-icon" />
              <span>Standalone consultation — no follow-up either side of it.</span>
            </div>
          )}
        </div>

        <div className="cdw-footer">
          <Link to={"/dashboard/customers/" + activity.customerId} className="cdw-open">
            <Stethoscope className="cdw-open-icon" />
            Open patient folder
            <ArrowUpRight className="cdw-open-icon" />
          </Link>
        </div>
      </aside>
    </div>
  );
}

export default ConsultationDrawer;
