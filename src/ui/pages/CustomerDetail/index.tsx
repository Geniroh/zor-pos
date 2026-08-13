import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  MessageSquare,
  Phone,
  Pill,
  Plus,
  Stethoscope,
  User,
  Activity,
  Droplet,
  Ruler,
  Scale,
  MoreVertical,
} from "lucide-react";
import { formatNaira } from "../../components/pos/pos-data";
import Pagination from "../../components/common/Pagination";
import CareActionModal, {
  type CareActionDraft,
  type CareActionKind,
} from "../../components/care/CareActionModal";
import ConsultationModal, {
  type ConsultationDraft,
} from "../../components/care/ConsultationModal";
import {
  ageOf,
  allergiesFor,
  activitiesFor,
  contactsFor,
  findCustomer,
  followUpsFor,
  formatDate,
  medicationsFor,
  purchasesFor,
  relativeDays,
  saveConsultation,
  scheduleFollowUp,
  type Allergy,
  type CareActivity,
  type CareCustomer,
  type FollowUp,
  type Medication,
  type VisitReason,
} from "../../components/care/care-data";
import "./index.css";

const TABS = ["Overview", "Purchases", "Patient Profile", "Follow-ups", "Care Notes"] as const;
type Tab = (typeof TABS)[number];

const ACTIVITY_ICONS: Record<VisitReason, typeof MessageSquare> = {
  "Medication review": FileText,
  "New symptom": Activity,
  "OTC request": MessageSquare,
  "Medication counselling": Stethoscope,
  "Follow-up": Phone,
  Other: MessageSquare,
};

/** One class per reason, so the icon tint matches the kind of visit. */
const ACTIVITY_TONES: Record<VisitReason, string> = {
  "Medication review": "review",
  "New symptom": "symptom",
  "OTC request": "otc",
  "Medication counselling": "counselling",
  "Follow-up": "followup",
  Other: "other",
};

function CustomerDetail() {
  const { customerId = "" } = useParams();
  const customer = findCustomer(customerId);

  if (!customer) {
    return (
      <div className="cust-page">
        <div className="cust-missing">
          <p>That customer no longer exists.</p>
          <Link to="/dashboard/customers/directory">Back to customer profile</Link>
        </div>
      </div>
    );
  }

  // Keyed so switching customers remounts the view and re-seeds all the
  // local record state below from the new customer's data.
  return <CustomerDetailView key={customer.id} customer={customer} />;
}

function CustomerDetailView({ customer }: { customer: CareCustomer }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState<CareActionKind | null>(null);
  const [consultOpen, setConsultOpen] = useState(false);
  const [purchaseFilter, setPurchaseFilter] = useState<"all" | "Medication" | "General">("all");
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchasePageSize, setPurchasePageSize] = useState(10);

  // Records start from the dummy dataset and accept additions for this
  // session only — nothing here persists, same as the rest of the app.
  const [isPatient, setIsPatient] = useState(customer.isPatient);
  const [allergies, setAllergies] = useState<Allergy[]>(() => allergiesFor(customer.id));
  const [medications, setMedications] = useState<Medication[]>(() => medicationsFor(customer.id));
  const [activities, setActivities] = useState<CareActivity[]>(() => activitiesFor(customer.id));
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => followUpsFor(customer.id));

  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2400);
  }

  const purchases = useMemo(() => purchasesFor(customer.id), [customer.id]);

  const totalSpend = useMemo(() => purchases.reduce((sum, p) => sum + p.total, 0), [purchases]);

  const contacts = useMemo(() => contactsFor(customer.id), [customer.id]);

  const lastConsult = useMemo(
    () => [...activities].sort((a, b) => b.date - a.date)[0],
    [activities],
  );

  const nextFollowUp = useMemo(
    () =>
      followUps
        .filter((f) => f.status === "Scheduled")
        .sort((a, b) => a.dueAt - b.dueAt)[0],
    [followUps],
  );

  const filteredPurchases = useMemo(
    () => (purchaseFilter === "all" ? purchases : purchases.filter((p) => p.type === purchaseFilter)),
    [purchases, purchaseFilter],
  );

  const purchasePageCount = Math.max(1, Math.ceil(filteredPurchases.length / purchasePageSize));
  const currentPurchasePage = Math.min(purchasePage, purchasePageCount);
  const pagedPurchases = useMemo(
    () =>
      filteredPurchases.slice(
        (currentPurchasePage - 1) * purchasePageSize,
        currentPurchasePage * purchasePageSize,
      ),
    [filteredPurchases, currentPurchasePage, purchasePageSize],
  );

  function handleAction(draft: CareActionDraft) {
    // Any clinical record makes this customer a patient, file or not.
    setIsPatient(true);

    switch (draft.kind) {
      case "follow-up": {
        const created = scheduleFollowUp({
          customerId: customer.id,
          dueAt: draft.dueAt,
          reason: draft.summary,
          channel: draft.channel,
          status: "Scheduled",
          by: draft.by,
        });
        setFollowUps((prev) => [created, ...prev]);
        flash("Follow-up scheduled · " + formatDate(draft.dueAt));
        break;
      }
      case "allergy": {
        setAllergies((prev) => [
          ...prev,
          {
            id: "ALG-new-" + prev.length,
            customerId: customer.id,
            substance: draft.substance,
            reaction: draft.reaction,
            severity: draft.severity,
            recordedAt: Date.now(),
          },
        ]);
        flash("Allergy recorded · " + draft.substance);
        break;
      }
      case "medication": {
        setMedications((prev) => [
          ...prev,
          {
            id: "MED-new-" + prev.length,
            customerId: customer.id,
            name: draft.drug,
            schedule: draft.schedule,
            startedAt: Date.now(),
            prescriber: draft.by,
            // Dispensed today, so a refill falls due one standard cycle out.
            supplyDays: 30,
            lastRefillAt: Date.now(),
          },
        ]);
        flash("Medication added · " + draft.drug);
        break;
      }
    }
  }

  function handleConsultation(draft: ConsultationDraft) {
    setIsPatient(true);

    const activity = saveConsultation({
      customerId: customer.id,
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
        customerId: customer.id,
        dueAt: draft.followUp.dueAt,
        reason: draft.followUp.reason,
        channel: draft.followUp.channel,
        status: "Scheduled",
        by: draft.by,
      });
      activity.producedFollowUpId = created.id;
    }

    setActivities((prev) => [activity, ...prev]);
    setFollowUps((prev) => {
      // A "Follow-up" visit closes the intent it was booked against.
      const next = draft.closesFollowUpId
        ? prev.map((f) =>
            f.id === draft.closesFollowUpId
              ? { ...f, status: "Completed" as const, outcomeActivityId: activity.id }
              : f,
          )
        : prev;
      return created ? [created, ...next] : next;
    });

    flash("Consultation saved" + (created ? " · follow-up scheduled" : ""));
  }

  return (
    <div className="cust-page" onClick={() => menuOpen && setMenuOpen(false)}>
      <nav className="cust-breadcrumb">
        <Link to="/dashboard/customers/directory">Customers</Link>
        <ChevronRight className="cust-crumb-icon" />
        <span>{customer.name}</span>
      </nav>

      <header className="cust-header">
        <div className="cust-identity">
          <h1>
            {customer.name}
            {isPatient && <span className="cust-badge">Patient</span>}
          </h1>
          <div className="cust-meta">
            <span>
              <Phone className="cust-meta-icon" />
              {customer.phone}
            </span>
            <i />
            <span>
              <CalendarDays className="cust-meta-icon" />
              {ageOf(customer)}
            </span>
            <i />
            <span>
              <User className="cust-meta-icon" />
              {customer.gender}
            </span>
          </div>
        </div>

        <div className="cust-header-actions">
          <button type="button" className="cust-btn-outline" onClick={() => flash("Editing isn't wired up yet")}>
            Edit Customer
          </button>
          <button
            type="button"
            className="cust-btn-primary"
            onClick={() => navigate("/dashboard", { state: { customerName: customer.name } })}
          >
            New Sale
          </button>
          <div className="cust-menu-wrap">
            <button
              type="button"
              className="cust-icon-btn"
              aria-label="More actions"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
            >
              <MoreVertical className="cust-icon" />
            </button>
            {menuOpen && (
              <div className="cust-menu" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => { setMenuOpen(false); flash("Statement export isn't wired up yet"); }}>
                  Export statement
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); flash("Merge isn't wired up yet"); }}>
                  Merge duplicate
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); flash("Archiving isn't wired up yet"); }}>
                  Archive customer
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="cust-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={"cust-tab" + (t === tab ? " cust-tab-active" : "")}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="cust-overview">
          <div className="cust-main">
            <div className="cust-alerts">
              <div className="cust-alert cust-alert-red">
                <span className="cust-alert-head">
                  Allergies
                  <span className="cust-alert-count">{allergies.length}</span>
                </span>
                <div className="cust-alert-body">
                  <div className="cust-alert-text">
                    {allergies.length === 0 ? (
                      <strong className="cust-alert-none">None recorded</strong>
                    ) : (
                      allergies.slice(0, 2).map((a) => (
                        <span key={a.id}>
                          <strong>{a.substance}</strong>
                          <em>{a.reaction}</em>
                        </span>
                      ))
                    )}
                  </div>
                  <AlertTriangle className="cust-alert-icon" />
                </div>
              </div>

              <div className="cust-alert cust-alert-blue">
                <span className="cust-alert-head">
                  Current Medications
                  <span className="cust-alert-count">{medications.length}</span>
                </span>
                <div className="cust-alert-body">
                  <div className="cust-alert-text">
                    {medications.length === 0 ? (
                      <strong className="cust-alert-none">None recorded</strong>
                    ) : (
                      medications.slice(0, 2).map((m) => <strong key={m.id}>{m.name}</strong>)
                    )}
                  </div>
                  <Pill className="cust-alert-icon" />
                </div>
              </div>

              <div className="cust-alert cust-alert-amber">
                <span className="cust-alert-head">Last Consultation</span>
                <div className="cust-alert-body">
                  <div className="cust-alert-text">
                    {lastConsult ? (
                      <>
                        <strong>{formatDate(lastConsult.date)}</strong>
                        <em>By {lastConsult.by}</em>
                      </>
                    ) : (
                      <strong className="cust-alert-none">No consultation yet</strong>
                    )}
                  </div>
                  <CalendarDays className="cust-alert-icon" />
                </div>
              </div>

              <div className="cust-alert cust-alert-green">
                <span className="cust-alert-head">Upcoming Follow-up</span>
                <div className="cust-alert-body">
                  <div className="cust-alert-text">
                    {nextFollowUp ? (
                      <>
                        <strong>{formatDate(nextFollowUp.dueAt)}</strong>
                        <em>{relativeDays(nextFollowUp.dueAt)}</em>
                      </>
                    ) : (
                      <strong className="cust-alert-none">None scheduled</strong>
                    )}
                  </div>
                  <Bell className="cust-alert-icon" />
                </div>
              </div>
            </div>

            <section className="cust-card">
              <div className="cust-card-head">
                <h2>Recent Purchases</h2>
                <span className="cust-card-sub">
                  {purchases.length} orders · {formatNaira(totalSpend)} lifetime
                </span>
              </div>
              <table className="cust-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Type</th>
                    <th className="cust-align-right">Total</th>
                    <th>For</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.slice(0, 4).map((p) => (
                    <tr key={p.id}>
                      <td className="cust-nowrap">{formatDate(p.date)}</td>
                      <td>
                        {p.items.map((it) => (
                          <span key={it.name} className="cust-item-line">
                            {it.name} ({it.qty} {it.unit})
                          </span>
                        ))}
                      </td>
                      <td>
                        <span className={"cust-pill cust-pill-" + p.type.toLowerCase()}>{p.type}</span>
                      </td>
                      <td className="cust-align-right cust-mono">{formatNaira(p.total)}</td>
                      <td>{p.boughtFor}</td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="cust-empty">
                        No purchases recorded for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {purchases.length > 4 && (
                <button type="button" className="cust-card-link" onClick={() => setTab("Purchases")}>
                  View all purchases
                </button>
              )}
            </section>

            <section className="cust-card">
              <div className="cust-card-head">
                <h2>
                  Care Activities <span className="cust-card-sub">(Recent)</span>
                </h2>
              </div>
              <ul className="cust-activities">
                {activities.slice(0, 3).map((a) => {
                  const Icon = ACTIVITY_ICONS[a.reason];
                  return (
                    <li key={a.id}>
                      <span className={"cust-activity-icon cust-activity-" + ACTIVITY_TONES[a.reason]}>
                        <Icon className="cust-icon" />
                      </span>
                      <span className="cust-activity-text">
                        <strong>{a.reason}</strong>
                        <span>
                          {formatDate(a.date)} · By {a.by}
                        </span>
                      </span>
                      <span className="cust-activity-outcome">{a.concern}</span>
                      <ChevronRight className="cust-activity-chevron" />
                    </li>
                  );
                })}
                {activities.length === 0 && (
                  <li className="cust-empty-row">
                    No care activity recorded yet.
                  </li>
                )}
              </ul>
              {activities.length > 3 && (
                <button type="button" className="cust-card-link" onClick={() => setTab("Care Notes")}>
                  View all care activities
                </button>
              )}
            </section>
          </div>

          <aside className="cust-rail">
            <section className="cust-card">
              <div className="cust-card-head">
                <h2>Patient Profile Summary</h2>
              </div>
              <ul className="cust-summary">
                <li>
                  <CalendarDays className="cust-summary-icon" />
                  <span>Date of Birth</span>
                  <strong>{customer.dob ? formatDate(customer.dob) : "—"}</strong>
                </li>
                <li>
                  <Droplet className="cust-summary-icon" />
                  <span>Blood Group</span>
                  <strong>{customer.bloodGroup}</strong>
                </li>
                <li>
                  <Ruler className="cust-summary-icon" />
                  <span>Height</span>
                  <strong>{customer.height}</strong>
                </li>
                <li>
                  <Scale className="cust-summary-icon" />
                  <span>Weight</span>
                  <strong>{customer.weight}</strong>
                </li>
              </ul>
              <div className="cust-summary-notes">
                <span>
                  <ClipboardList className="cust-summary-icon" />
                  Notes
                </span>
                <p>{customer.notes}</p>
              </div>
            </section>

            <section className="cust-card">
              <div className="cust-card-head">
                <h2>
                  Allergies <span className="cust-count-chip">{allergies.length}</span>
                </h2>
                <button type="button" className="cust-add-link" onClick={() => setAction("allergy")}>
                  <Plus className="cust-add-icon" />
                  Add
                </button>
              </div>
              <ul className="cust-record-list">
                {allergies.map((a) => (
                  <li key={a.id} className={"cust-record cust-record-severity-" + a.severity.toLowerCase()}>
                    <span className="cust-record-text">
                      <strong>{a.substance}</strong>
                      <em>{a.reaction}</em>
                    </span>
                    <ChevronRight className="cust-record-chevron" />
                  </li>
                ))}
                {allergies.length === 0 && <li className="cust-empty-row">No known allergies.</li>}
              </ul>
            </section>

            <section className="cust-card">
              <div className="cust-card-head">
                <h2>Current Medications</h2>
                <button type="button" className="cust-add-link" onClick={() => setAction("medication")}>
                  <Plus className="cust-add-icon" />
                  Add
                </button>
              </div>
              <ul className="cust-record-list">
                {medications.map((m) => (
                  <li key={m.id} className="cust-record">
                    <span className="cust-record-text">
                      <strong>{m.name}</strong>
                      <em>{m.schedule}</em>
                    </span>
                    <ChevronRight className="cust-record-chevron" />
                  </li>
                ))}
                {medications.length === 0 && <li className="cust-empty-row">No active medications.</li>}
              </ul>
            </section>

            <section className="cust-card">
              <div className="cust-card-head">
                <h2>Quick Actions</h2>
              </div>
              <div className="cust-quick">
                <button type="button" onClick={() => setConsultOpen(true)}>
                  <FileText className="cust-quick-icon" />
                  New Consultation / Care Note
                </button>
                <button type="button" onClick={() => setAction("follow-up")}>
                  <CalendarDays className="cust-quick-icon" />
                  Schedule Follow-up
                </button>
                <button type="button" onClick={() => setAction("allergy")}>
                  <AlertTriangle className="cust-quick-icon" />
                  Record Allergy
                </button>
                <button type="button" onClick={() => setAction("medication")}>
                  <Stethoscope className="cust-quick-icon" />
                  Add Medication
                </button>
              </div>
            </section>
          </aside>
        </div>
      )}

      {tab === "Purchases" && (
        <section className="cust-card">
          <div className="cust-card-head">
            <h2>All Purchases</h2>
            <div className="cust-chip-filters">
              {(["all", "Medication", "General"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={"cust-chip" + (purchaseFilter === f ? " cust-chip-active" : "")}
                  onClick={() => {
                    setPurchaseFilter(f);
                    setPurchasePage(1);
                  }}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </div>
          <table className="cust-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Items</th>
                <th>Type</th>
                <th>Served by</th>
                <th className="cust-align-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {pagedPurchases.map((p) => (
                <tr key={p.id}>
                  <td className="cust-mono cust-nowrap">{p.id}</td>
                  <td className="cust-nowrap">{formatDate(p.date)}</td>
                  <td>
                    {p.items.map((it) => (
                      <span key={it.name} className="cust-item-line">
                        {it.name} ({it.qty} {it.unit})
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className={"cust-pill cust-pill-" + p.type.toLowerCase()}>{p.type}</span>
                  </td>
                  <td>{p.servedBy}</td>
                  <td className="cust-align-right cust-mono">{formatNaira(p.total)}</td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="cust-empty">
                    Nothing to show for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            page={currentPurchasePage}
            pageSize={purchasePageSize}
            total={filteredPurchases.length}
            onPageChange={setPurchasePage}
            onPageSizeChange={setPurchasePageSize}
            noun="purchases"
          />
        </section>
      )}

      {tab === "Patient Profile" && (
        <div className="cust-profile">
          <section className="cust-card">
            <div className="cust-card-head">
              <h2>Personal details</h2>
            </div>
            <dl className="cust-details">
              <div>
                <dt>Full name</dt>
                <dd>{customer.name}</dd>
              </div>
              <div>
                <dt>Customer ID</dt>
                <dd className="cust-mono">{customer.id}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd className="cust-mono">{customer.phone}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{customer.email}</dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd>{customer.gender}</dd>
              </div>
              <div>
                <dt>Date of birth</dt>
                <dd>{customer.dob ? formatDate(customer.dob) : "—"}</dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd>{ageOf(customer)}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{customer.address}</dd>
              </div>
              <div>
                <dt>Customer since</dt>
                <dd>{formatDate(customer.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="cust-card">
            <div className="cust-card-head">
              <h2>Clinical details</h2>
            </div>
            <dl className="cust-details">
              <div>
                <dt>Blood group</dt>
                <dd>{customer.bloodGroup}</dd>
              </div>
              <div>
                <dt>Height</dt>
                <dd>{customer.height}</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>{customer.weight}</dd>
              </div>
              <div>
                <dt>Allergies</dt>
                <dd>{allergies.length ? allergies.map((a) => a.substance).join(", ") : "None known"}</dd>
              </div>
              <div>
                <dt>Active medications</dt>
                <dd>{medications.length ? medications.map((m) => m.name).join(", ") : "None"}</dd>
              </div>
              <div className="cust-details-wide">
                <dt>Standing notes</dt>
                <dd>{customer.notes}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {tab === "Follow-ups" && (
        <section className="cust-card">
          <div className="cust-card-head">
            <h2>Follow-ups &amp; Engagements</h2>
            <button type="button" className="cust-add-link" onClick={() => setAction("follow-up")}>
              <Plus className="cust-add-icon" />
              Schedule follow-up
            </button>
          </div>
          <table className="cust-table">
            <thead>
              <tr>
                <th>Due</th>
                <th>Reason</th>
                <th>Channel</th>
                <th>Assigned to</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map((f) => (
                <tr key={f.id}>
                  <td className="cust-nowrap">
                    {formatDate(f.dueAt)}
                    <span className="cust-relative">{relativeDays(f.dueAt)}</span>
                  </td>
                  <td>{f.reason}</td>
                  <td>{f.channel}</td>
                  <td>{f.by}</td>
                  <td>
                    <span className={"cust-status cust-status-" + f.status.toLowerCase()}>{f.status}</span>
                  </td>
                </tr>
              ))}
              {followUps.length === 0 && (
                <tr>
                  <td colSpan={5} className="cust-empty">
                    No follow-ups for this customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Written by the Outreach tab's simulated SMS and calls. */}
          <div className="cust-contact-log">
            <h3>Contact history</h3>
            {contacts.length === 0 ? (
              <p className="cust-empty-row">No SMS or calls logged yet.</p>
            ) : (
              <ul>
                {contacts.map((c) => (
                  <li key={c.id}>
                    <span className={"cust-contact-channel cust-contact-" + (c.channel === "SMS" ? "sms" : "call")}>
                      {c.channel === "SMS" ? (
                        <MessageSquare className="cust-icon" />
                      ) : (
                        <Phone className="cust-icon" />
                      )}
                    </span>
                    <span className="cust-contact-body">
                      <span className="cust-contact-head">
                        {formatDate(c.at)} · {c.by}
                        {c.outcome && <em>{c.outcome}</em>}
                      </span>
                      <p>{c.message}</p>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {tab === "Care Notes" && (
        <section className="cust-card">
          <div className="cust-card-head">
            <h2>Care Notes</h2>
            <button type="button" className="cust-add-link" onClick={() => setConsultOpen(true)}>
              <Plus className="cust-add-icon" />
              New note
            </button>
          </div>
          <ul className="cust-notes">
            {activities.map((a) => {
              const Icon = ACTIVITY_ICONS[a.reason];
              return (
                <li key={a.id}>
                  <span className={"cust-activity-icon cust-activity-" + ACTIVITY_TONES[a.reason]}>
                    <Icon className="cust-icon" />
                  </span>
                  <div className="cust-note-body">
                    <div className="cust-note-head">
                      <strong>{a.reason}</strong>
                      <span>
                        {formatDate(a.date)} · {a.by}
                      </span>
                    </div>
                    <dl className="cust-note-fields">
                      <div>
                        <dt>Concern</dt>
                        <dd>{a.concern}</dd>
                      </div>
                      <div>
                        <dt>Assessment</dt>
                        <dd>{a.assessment}</dd>
                      </div>
                      <div>
                        <dt>Intervention</dt>
                        <dd>{a.intervention}</dd>
                      </div>
                      <div>
                        <dt>Medication</dt>
                        <dd>{a.medication}</dd>
                      </div>
                    </dl>
                    <span className="cust-note-outcome">Outcome: {a.outcome}</span>
                  </div>
                </li>
              );
            })}
            {activities.length === 0 && <li className="cust-empty-row">No care notes yet.</li>}
          </ul>
        </section>
      )}

      {action && (
        <CareActionModal
          kind={action}
          customerName={customer.name}
          onClose={() => setAction(null)}
          onSubmit={handleAction}
        />
      )}

      {consultOpen && (
        <ConsultationModal
          customerId={customer.id}
          onClose={() => setConsultOpen(false)}
          onSubmit={handleConsultation}
        />
      )}

      {toast && <div className="cust-toast">{toast}</div>}
    </div>
  );
}

export default CustomerDetail;
