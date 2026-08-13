import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  CalendarClock,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Gift,
  MessageSquare,
  Phone,
  PhoneOff,
  RotateCcw,
  Search,
  Send,
  Users,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import LogOutcomeModal, { type OutcomeDraft } from "../../components/care/LogOutcomeModal";
import ConsultationModal, { type ConsultationDraft } from "../../components/care/ConsultationModal";
import ContactModal, { type ContactResult, type Recipient } from "../../components/care/ContactModal";
import {
  CLINICIANS,
  FOLLOW_UPS,
  birthdayList,
  completeFollowUp,
  findCustomer,
  formatDate,
  lapsedList,
  logContact,
  missedFollowUpList,
  refillDueList,
  relativeDays,
  rescheduleFollowUp,
  saveConsultation,
  scheduleFollowUp,
  type ContactChannel,
  type FollowUp,
  type OutreachEntry,
} from "../../components/care/care-data";
import "./index.css";

const DAY = 24 * 60 * 60 * 1000;
/** Read once at module load — Date.now() can't be called during render. */
const now = Date.now();

type Tab = "queue" | "outreach";
type StatusFilter = "open" | "Scheduled" | "Missed" | "Completed";
type ListKey = "refill" | "lapsed" | "missed" | "birthday";

const CHANNELS: (ContactChannel | "all")[] = ["all", "Phone call", "In-person", "SMS"];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "Missed", label: "Missed" },
  { value: "Completed", label: "Completed" },
];

const OUTREACH_LISTS: { key: ListKey; label: string; icon: typeof Users; blurb: string; template: string }[] = [
  {
    key: "refill",
    label: "Refill due",
    icon: RotateCcw,
    blurb: "On a chronic medicine and the last supply collected has run out.",
    template: "Hello {name}, your refill at Zorpill Pharmacy is due. Reply or call us to arrange collection.",
  },
  {
    key: "lapsed",
    label: "Lapsed customers",
    icon: Clock,
    blurb: "Bought regularly before, nothing in the last 90 days.",
    template: "Hi {name}, we haven't seen you in a while. Your pharmacist at Zorpill is here if you need anything.",
  },
  {
    key: "missed",
    label: "Missed follow-ups",
    icon: PhoneOff,
    blurb: "Went past the due date without being worked. Needs re-contact.",
    template: "Hello {name}, this is a reminder about your review at Zorpill Pharmacy. Please call us to confirm a time.",
  },
  {
    key: "birthday",
    label: "Birthdays",
    icon: Gift,
    blurb: "Birthday this month — goodwill, not clinical care.",
    template: "Happy birthday {name}! From all of us at Zorpill Pharmacy — wishing you a healthy year ahead.",
  },
];

interface Bucket {
  key: string;
  label: string;
  rows: FollowUp[];
  tone: "red" | "amber" | "green" | "grey";
}

function toDateInput(ts: number): string {
  const d = new Date(ts);
  return (
    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
  );
}

function FollowUpsOutreach() {
  const [tab, setTab] = useState<Tab>("queue");

  /* ---------------- Queue state ---------------- */
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => [...FOLLOW_UPS]);
  const [query, setQuery] = useState("");
  const [staff, setStaff] = useState("all");
  const [channel, setChannel] = useState<ContactChannel | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("open");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ later: true });

  const [outcomeTarget, setOutcomeTarget] = useState<FollowUp | null>(null);
  const [consultTarget, setConsultTarget] = useState<FollowUp | null>(null);
  const [rescheduling, setRescheduling] = useState<{ id: string; date: string } | null>(null);

  /* ---------------- Outreach state ---------------- */
  const [activeList, setActiveList] = useState<ListKey>("refill");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [contact, setContact] = useState<{
    channel: "SMS" | "Phone call";
    recipients: Recipient[];
    template?: string;
  } | null>(null);
  // Bumped after a contact is logged, to recompute the "last contacted" column.
  const [contactVersion, setContactVersion] = useState(0);

  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2600);
  }

  /* ---------------- Queue derivation ---------------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return followUps.filter((f) => {
      if (status === "open" ? f.status === "Completed" : f.status !== status) return false;
      if (staff !== "all" && f.by !== staff) return false;
      if (channel !== "all" && f.channel !== channel) return false;
      if (!q) return true;
      const name = findCustomer(f.customerId)?.name.toLowerCase() ?? "";
      return name.includes(q) || f.reason.toLowerCase().includes(q);
    });
  }, [followUps, query, staff, channel, status]);

  const buckets = useMemo<Bucket[]>(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = startOfToday.getTime() + DAY;
    const endOfWeek = startOfToday.getTime() + 7 * DAY;

    const overdue: FollowUp[] = [];
    const today: FollowUp[] = [];
    const week: FollowUp[] = [];
    const later: FollowUp[] = [];

    for (const f of filtered) {
      // Missed always reads as overdue, whatever its date says.
      if (f.status === "Missed" || f.dueAt < startOfToday.getTime()) overdue.push(f);
      else if (f.dueAt < endOfToday) today.push(f);
      else if (f.dueAt < endOfWeek) week.push(f);
      else later.push(f);
    }

    const bySoonest = (a: FollowUp, b: FollowUp) => a.dueAt - b.dueAt;
    return [
      { key: "overdue", label: "Overdue", rows: overdue.sort(bySoonest), tone: "red" },
      { key: "today", label: "Today", rows: today.sort(bySoonest), tone: "amber" },
      { key: "week", label: "This week", rows: week.sort(bySoonest), tone: "green" },
      { key: "later", label: "Later", rows: later.sort(bySoonest), tone: "grey" },
    ];
  }, [filtered]);

  const counts = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const open = followUps.filter((f) => f.status !== "Completed");
    return {
      overdue: open.filter((f) => f.status === "Missed" || f.dueAt < startOfToday.getTime()).length,
      today: open.filter(
        (f) =>
          f.status === "Scheduled" &&
          f.dueAt >= startOfToday.getTime() &&
          f.dueAt < startOfToday.getTime() + DAY,
      ).length,
      week: open.filter(
        (f) =>
          f.status === "Scheduled" &&
          f.dueAt >= startOfToday.getTime() &&
          f.dueAt < startOfToday.getTime() + 7 * DAY,
      ).length,
      missed: followUps.filter((f) => f.status === "Missed").length,
    };
  }, [followUps]);

  /* ---------------- Queue actions ---------------- */

  function applyOutcome(followUp: FollowUp, draft: OutcomeDraft) {
    const { activity } = completeFollowUp(followUp.id, {
      customerId: followUp.customerId,
      date: Date.now(),
      by: draft.by,
      concern: followUp.reason,
      assessment: draft.notes,
      intervention: draft.notes,
      medication: "None",
      outcome: draft.outcome,
    });

    let created: FollowUp | undefined;
    if (draft.nextDueAt) {
      created = scheduleFollowUp({
        customerId: followUp.customerId,
        dueAt: draft.nextDueAt,
        reason: followUp.reason,
        channel: followUp.channel,
        status: "Scheduled",
        by: draft.by,
      });
      activity.producedFollowUpId = created.id;
    }

    setFollowUps((prev) => {
      const next = prev.map((f) =>
        f.id === followUp.id ? { ...f, status: "Completed" as const, outcomeActivityId: activity.id } : f,
      );
      return created ? [...next, created] : next;
    });

    const name = findCustomer(followUp.customerId)?.name ?? "patient";
    flash(
      "Outcome logged · " + name + (created ? " · next follow-up " + formatDate(created.dueAt) : ""),
    );
  }

  function applyConsultation(followUp: FollowUp | null, draft: ConsultationDraft) {
    const activity = saveConsultation({
      customerId: draft.customerId,
      date: Date.now(),
      by: draft.by,
      reason: draft.reason,
      concern: draft.concern,
      assessment: draft.assessment,
      intervention: draft.intervention,
      medication: draft.medication,
      outcome: draft.outcome,
      closesFollowUpId: draft.closesFollowUpId,
    });

    let created: FollowUp | undefined;
    if (draft.followUp) {
      created = scheduleFollowUp({
        customerId: draft.customerId,
        dueAt: draft.followUp.dueAt,
        reason: draft.followUp.reason,
        channel: draft.followUp.channel,
        status: "Scheduled",
        by: draft.by,
      });
      activity.producedFollowUpId = created.id;
    }

    const closedId = draft.closesFollowUpId ?? followUp?.id;
    setFollowUps((prev) => {
      const next = prev.map((f) =>
        f.id === closedId ? { ...f, status: "Completed" as const, outcomeActivityId: activity.id } : f,
      );
      return created ? [...next, created] : next;
    });

    flash("Consultation saved · " + (findCustomer(draft.customerId)?.name ?? ""));
  }

  function applyReschedule(id: string, date: string) {
    const dueAt = new Date(date + "T09:00").getTime();
    rescheduleFollowUp(id, dueAt);
    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, dueAt, status: "Scheduled" as const } : f)),
    );
    setRescheduling(null);
    flash("Rescheduled to " + formatDate(dueAt));
  }

  function openContact(followUp: FollowUp, via: "SMS" | "Phone call") {
    const customer = findCustomer(followUp.customerId);
    if (!customer) return;
    setContact({
      channel: via,
      recipients: [{ customerId: customer.id, name: customer.name, phone: customer.phone }],
      template: OUTREACH_LISTS[2].template,
    });
  }

  /* ---------------- Outreach derivation ---------------- */

  const entries = useMemo<OutreachEntry[]>(() => {
    // contactVersion is a dependency on purpose: logging a contact changes the
    // "last contacted" column these lists read.
    void contactVersion;
    switch (activeList) {
      case "refill":
        return refillDueList();
      case "lapsed":
        return lapsedList();
      case "missed":
        return missedFollowUpList();
      default:
        return birthdayList();
    }
  }, [activeList, contactVersion]);

  const listCounts = useMemo(() => {
    void contactVersion;
    return {
      refill: refillDueList().length,
      lapsed: lapsedList().length,
      missed: missedFollowUpList().length,
      birthday: birthdayList().length,
    };
  }, [contactVersion]);

  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedEntries = useMemo(
    () => entries.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [entries, currentPage, pageSize],
  );

  const activeMeta = OUTREACH_LISTS.find((l) => l.key === activeList)!;

  function toggleSelected(customerId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  }

  function handleContactResult(result: ContactResult) {
    if (!contact) return;
    for (const r of contact.recipients) {
      logContact({
        customerId: r.customerId,
        channel: contact.channel,
        at: Date.now(),
        by: result.by,
        message: result.message.replace(/\{name\}/g, r.name.split(" ")[0]),
        outcome: result.outcome,
      });
    }
    setContactVersion((v) => v + 1);
    setSelected(new Set());
    flash(
      contact.channel === "SMS"
        ? "SMS sent to " + contact.recipients.length + (contact.recipients.length === 1 ? " patient" : " patients")
        : "Call logged · " + result.outcome,
    );
  }

  const selectedRecipients: Recipient[] = entries
    .filter((e) => selected.has(e.customerId))
    .map((e) => ({ customerId: e.customerId, name: e.name, phone: e.phone }));

  return (
    <div className="fu-page">
      <nav className="fu-breadcrumb">
        <Link to="/dashboard/customers">Customers &amp; Care</Link>
        <ChevronRight className="fu-crumb-icon" />
        <span>Follow-ups &amp; Outreach</span>
      </nav>

      <div className="fu-header">
        <div>
          <h1>Follow-ups &amp; Outreach</h1>
          <p>Work the care queue, then reach the patients who haven't come back.</p>
        </div>
      </div>

      <div className="fu-tabs">
        <button
          type="button"
          className={"fu-tab" + (tab === "queue" ? " fu-tab-active" : "")}
          onClick={() => setTab("queue")}
        >
          <CalendarClock className="fu-tab-icon" />
          Follow-up queue
          {counts.overdue > 0 && <span className="fu-tab-badge">{counts.overdue}</span>}
        </button>
        <button
          type="button"
          className={"fu-tab" + (tab === "outreach" ? " fu-tab-active" : "")}
          onClick={() => setTab("outreach")}
        >
          <Send className="fu-tab-icon" />
          Outreach
        </button>
      </div>

      {tab === "queue" ? (
        <>
          <div className="fu-counters">
            <div className="fu-counter fu-counter-red">
              <AlertOctagon className="fu-counter-icon" />
              <span>
                <strong>{counts.overdue}</strong>
                Overdue
              </span>
            </div>
            <div className="fu-counter fu-counter-amber">
              <Clock className="fu-counter-icon" />
              <span>
                <strong>{counts.today}</strong>
                Due today
              </span>
            </div>
            <div className="fu-counter fu-counter-green">
              <CalendarClock className="fu-counter-icon" />
              <span>
                <strong>{counts.week}</strong>
                Next 7 days
              </span>
            </div>
            <div className="fu-counter fu-counter-grey">
              <PhoneOff className="fu-counter-icon" />
              <span>
                <strong>{counts.missed}</strong>
                Missed
              </span>
            </div>
          </div>

          <div className="fu-filters">
            <div className="fu-search">
              <Search className="fu-search-icon" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient or reason"
              />
            </div>

            <div className="fu-chips">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={"fu-chip" + (status === s.value ? " fu-chip-active" : "")}
                  onClick={() => setStatus(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <label className="fu-select">
              <span>Assigned</span>
              <select value={staff} onChange={(e) => setStaff(e.target.value)}>
                <option value="all">Anyone</option>
                {CLINICIANS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="fu-select">
              <span>Channel</span>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ContactChannel | "all")}
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "Any" : c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="fu-buckets">
            {buckets.map((bucket) => {
              const isCollapsed = collapsed[bucket.key];
              return (
                <section key={bucket.key} className={"fu-bucket fu-bucket-" + bucket.tone}>
                  <button
                    type="button"
                    className="fu-bucket-head"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [bucket.key]: !prev[bucket.key] }))}
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? (
                      <ChevronDown className="fu-bucket-chevron" />
                    ) : (
                      <ChevronUp className="fu-bucket-chevron" />
                    )}
                    <span className="fu-bucket-label">{bucket.label}</span>
                    <span className="fu-bucket-count">{bucket.rows.length}</span>
                  </button>

                  {!isCollapsed &&
                    (bucket.rows.length === 0 ? (
                      <p className="fu-bucket-empty">
                        {bucket.key === "overdue" ? "Nothing overdue — nice." : "Nothing here."}
                      </p>
                    ) : (
                      <ul className="fu-rows">
                        {bucket.rows.map((f) => {
                          const customer = findCustomer(f.customerId);
                          const isRescheduling = rescheduling?.id === f.id;
                          return (
                            <li key={f.id} className="fu-row">
                              <div className="fu-row-main">
                                <Link
                                  to={"/dashboard/customers/" + f.customerId}
                                  className="fu-row-patient"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="fu-avatar">{customer?.name.charAt(0) ?? "?"}</span>
                                  <span className="fu-row-name">
                                    <strong>{customer?.name ?? f.customerId}</strong>
                                    <span>{customer?.phone}</span>
                                  </span>
                                </Link>

                                <span className="fu-row-reason">
                                  {f.reason}
                                  {f.status === "Missed" && <span className="fu-missed">Missed</span>}
                                </span>

                                <span className="fu-row-channel">{f.channel}</span>
                                <span className="fu-row-by">{f.by}</span>

                                <span className="fu-row-due">
                                  {formatDate(f.dueAt)}
                                  <span className={f.dueAt < now ? "fu-late" : ""}>
                                    {relativeDays(f.dueAt)}
                                  </span>
                                </span>

                                <span className="fu-row-actions">
                                  <button
                                    type="button"
                                    className="fu-primary"
                                    onClick={() => setOutcomeTarget(f)}
                                  >
                                    <Check className="fu-action-icon" />
                                    Log outcome
                                  </button>
                                  <button
                                    type="button"
                                    className="fu-ghost"
                                    onClick={() =>
                                      setRescheduling(
                                        isRescheduling ? null : { id: f.id, date: toDateInput(f.dueAt) },
                                      )
                                    }
                                    title="Reschedule"
                                  >
                                    <CalendarPlus className="fu-action-icon" />
                                  </button>
                                  <button
                                    type="button"
                                    className="fu-ghost"
                                    onClick={() => openContact(f, "Phone call")}
                                    title="Call"
                                  >
                                    <Phone className="fu-action-icon" />
                                  </button>
                                  <button
                                    type="button"
                                    className="fu-ghost"
                                    onClick={() => openContact(f, "SMS")}
                                    title="Send SMS"
                                  >
                                    <MessageSquare className="fu-action-icon" />
                                  </button>
                                </span>
                              </div>

                              {isRescheduling && (
                                <div className="fu-reschedule">
                                  <span>Move to</span>
                                  <input
                                    type="date"
                                    value={rescheduling.date}
                                    onChange={(e) =>
                                      setRescheduling({ id: f.id, date: e.target.value })
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="fu-primary"
                                    onClick={() => applyReschedule(f.id, rescheduling.date)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    className="fu-ghost-text"
                                    onClick={() => setRescheduling(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ))}
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="fu-lists">
            {OUTREACH_LISTS.map(({ key, label, icon: Icon, blurb }) => (
              <button
                key={key}
                type="button"
                className={"fu-list" + (activeList === key ? " fu-list-active" : "")}
                onClick={() => {
                  setActiveList(key);
                  setSelected(new Set());
                  setPage(1);
                }}
              >
                <span className="fu-list-top">
                  <Icon className="fu-list-icon" />
                  <strong>{listCounts[key]}</strong>
                </span>
                <span className="fu-list-label">{label}</span>
                <span className="fu-list-blurb">{blurb}</span>
              </button>
            ))}
          </div>

          <div className="fu-card">
            <div className="fu-card-head">
              <div>
                <h2>{activeMeta.label}</h2>
                <p>{activeMeta.blurb}</p>
              </div>
              <div className="fu-bulk">
                {selected.size > 0 && <span className="fu-bulk-count">{selected.size} selected</span>}
                <button
                  type="button"
                  className="fu-primary"
                  disabled={selected.size === 0}
                  onClick={() =>
                    setContact({
                      channel: "SMS",
                      recipients: selectedRecipients,
                      template: activeMeta.template,
                    })
                  }
                >
                  <Send className="fu-action-icon" />
                  Send SMS
                </button>
              </div>
            </div>

            <div className="fu-table-wrap">
              <table className="fu-table">
                <thead>
                  <tr>
                    <th className="fu-check-col">
                      <input
                        type="checkbox"
                        checked={pagedEntries.length > 0 && pagedEntries.every((e) => selected.has(e.customerId))}
                        onChange={(e) => {
                          const next = new Set(selected);
                          for (const entry of pagedEntries) {
                            if (e.target.checked) next.add(entry.customerId);
                            else next.delete(entry.customerId);
                          }
                          setSelected(next);
                        }}
                        aria-label="Select all on this page"
                      />
                    </th>
                    <th>Patient</th>
                    <th>Why they're here</th>
                    <th>{activeList === "birthday" ? "When" : "Overdue by"}</th>
                    <th>Last contacted</th>
                    <th className="fu-align-right">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEntries.map((e) => (
                    <tr key={e.customerId + e.detail}>
                      <td className="fu-check-col">
                        <input
                          type="checkbox"
                          checked={selected.has(e.customerId)}
                          onChange={() => toggleSelected(e.customerId)}
                          aria-label={"Select " + e.name}
                        />
                      </td>
                      <td>
                        <Link to={"/dashboard/customers/" + e.customerId} className="fu-row-patient">
                          <span className="fu-avatar">{e.name.charAt(0)}</span>
                          <span className="fu-row-name">
                            <strong>{e.name}</strong>
                            <span>{e.phone}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="fu-detail">{e.detail}</td>
                      <td>
                        <span className={"fu-days" + (e.days > 30 ? " fu-days-hot" : "")}>
                          {activeList === "birthday"
                            ? e.days === 0
                              ? "Today"
                              : e.days > 0
                                ? "In " + e.days + " days"
                                : Math.abs(e.days) + " days ago"
                            : e.days + " days"}
                        </span>
                      </td>
                      <td className="fu-muted">
                        {e.lastContactedAt ? formatDate(e.lastContactedAt) : "Never"}
                      </td>
                      <td className="fu-align-right">
                        <span className="fu-row-actions">
                          <button
                            type="button"
                            className="fu-ghost"
                            title="Call"
                            onClick={() =>
                              setContact({
                                channel: "Phone call",
                                recipients: [
                                  { customerId: e.customerId, name: e.name, phone: e.phone },
                                ],
                              })
                            }
                          >
                            <Phone className="fu-action-icon" />
                          </button>
                          <button
                            type="button"
                            className="fu-ghost"
                            title="Send SMS"
                            onClick={() =>
                              setContact({
                                channel: "SMS",
                                recipients: [
                                  { customerId: e.customerId, name: e.name, phone: e.phone },
                                ],
                                template: activeMeta.template,
                              })
                            }
                          >
                            <MessageSquare className="fu-action-icon" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="fu-empty">
                        Nobody on this list right now.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={entries.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              noun="patients"
            />
          </div>
        </>
      )}

      {outcomeTarget && (
        <LogOutcomeModal
          followUp={outcomeTarget}
          patientName={findCustomer(outcomeTarget.customerId)?.name ?? ""}
          onClose={() => setOutcomeTarget(null)}
          onSubmit={(draft) => applyOutcome(outcomeTarget, draft)}
          onNeedsConsultation={() => {
            setConsultTarget(outcomeTarget);
            setOutcomeTarget(null);
          }}
        />
      )}

      {consultTarget && (
        <ConsultationModal
          customerId={consultTarget.customerId}
          closesFollowUpId={consultTarget.id}
          onClose={() => setConsultTarget(null)}
          onSubmit={(draft) => applyConsultation(consultTarget, draft)}
        />
      )}

      {contact && (
        <ContactModal
          channel={contact.channel}
          recipients={contact.recipients}
          template={contact.template}
          onClose={() => setContact(null)}
          onSend={handleContactResult}
        />
      )}

      {toast && <div className="fu-toast">{toast}</div>}
    </div>
  );
}

export default FollowUpsOutreach;
