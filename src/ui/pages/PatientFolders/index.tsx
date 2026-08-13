import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  FolderHeart,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import NewPatientModal, { type NewPatientDraft } from "../../components/care/NewPatientModal";
import {
  ALLERGIES,
  CARE_ACTIVITIES,
  FOLLOW_UPS,
  MEDICATIONS,
  PATIENTS,
  ageOf,
  formatDate,
  registerCustomer,
  relativeDays,
  type CareCustomer,
} from "../../components/care/care-data";
import "./index.css";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

type Filter = "all" | "severe" | "due" | "missed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All patients" },
  { value: "severe", label: "Severe allergy" },
  { value: "due", label: "Follow-up due" },
  { value: "missed", label: "Missed follow-up" },
];

interface FolderRow {
  id: string;
  name: string;
  age: string;
  gender: string;
  allergens: string[];
  hasSevere: boolean;
  medicationCount: number;
  lastConsult: number | null;
  nextDue: number | null;
  missed: number;
}

/** Flattens one patient's clinical records into the single row the table shows. */
function toRow(c: CareCustomer): FolderRow {
  const allergies = ALLERGIES.filter((a) => a.customerId === c.id);
  const followUps = FOLLOW_UPS.filter((f) => f.customerId === c.id);
  const scheduled = followUps
    .filter((f) => f.status === "Scheduled")
    .sort((a, b) => a.dueAt - b.dueAt);
  const consults = CARE_ACTIVITIES.filter((a) => a.customerId === c.id);

  return {
    id: c.id,
    name: c.name,
    age: ageOf(c),
    gender: c.gender,
    allergens: allergies.map((a) => a.substance),
    hasSevere: allergies.some((a) => a.severity === "Severe"),
    medicationCount: MEDICATIONS.filter((m) => m.customerId === c.id).length,
    lastConsult: consults.length ? Math.max(...consults.map((a) => a.date)) : null,
    nextDue: scheduled.length ? scheduled[0].dueAt : null,
    missed: followUps.filter((f) => f.status === "Missed").length,
  };
}

function PatientFolders() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [newOpen, setNewOpen] = useState(false);
  const [folders, setFolders] = useState<FolderRow[]>(() => PATIENTS.map(toRow));

  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2400);
  }

  const stats = useMemo(
    () => ({
      patients: folders.length,
      severe: folders.filter((r) => r.hasSevere).length,
      dueSoon: folders.filter((r) => r.nextDue !== null && r.nextDue <= now + 7 * DAY).length,
      missed: folders.filter((r) => r.missed > 0).length,
    }),
    [folders],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return folders
      .filter((r) => {
        if (filter === "severe" && !r.hasSevere) return false;
        if (filter === "due" && (r.nextDue === null || r.nextDue > now + 7 * DAY)) return false;
        if (filter === "missed" && r.missed === 0) return false;
        if (!q) return true;
        return r.name.toLowerCase().includes(q) || r.allergens.some((a) => a.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        // Anyone with something outstanding floats to the top of the list.
        const urgency = (r: FolderRow) =>
          r.missed > 0 ? 0 : r.nextDue !== null && r.nextDue <= now + 7 * DAY ? 1 : 2;
        return urgency(a) - urgency(b) || a.name.localeCompare(b.name);
      });
  }, [folders, query, filter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize],
  );

  function handleNewPatient(draft: NewPatientDraft) {
    const customer = registerCustomer({
      name: draft.firstName + " " + draft.lastName,
      phone: draft.phone,
      email: draft.email,
      gender: draft.gender,
      dob: draft.dob,
      isPatient: true,
    });
    setFolders((prev) => [toRow(customer), ...prev]);
    setPage(1);
    flash("Patient folder opened · " + customer.name);
  }

  return (
    <div className="pf-page">
      <nav className="pf-breadcrumb">
        <Link to="/dashboard/customers">Customers &amp; Care</Link>
        <ChevronRight className="pf-crumb-icon" />
        <span>Patient Folders</span>
      </nav>

      <div className="pf-header">
        <div>
          <h1>Patient Folders</h1>
          <p>Customers with a clinical file — allergies, medications and care history.</p>
        </div>
        <button type="button" className="pf-new-btn" onClick={() => setNewOpen(true)}>
          <Plus className="pf-new-icon" />
          New Patient
        </button>
      </div>

      <div className="pf-stats">
        <div className="pf-stat">
          <span className="pf-stat-icon pf-stat-plum">
            <FolderHeart className="pf-icon" />
          </span>
          <span className="pf-stat-text">
            <strong>{stats.patients}</strong>
            <span>Open folders</span>
          </span>
        </div>
        <div className="pf-stat">
          <span className="pf-stat-icon pf-stat-red">
            <AlertTriangle className="pf-icon" />
          </span>
          <span className="pf-stat-text">
            <strong>{stats.severe}</strong>
            <span>With a severe allergy</span>
          </span>
        </div>
        <div className="pf-stat">
          <span className="pf-stat-icon pf-stat-green">
            <CalendarClock className="pf-icon" />
          </span>
          <span className="pf-stat-text">
            <strong>{stats.dueSoon}</strong>
            <span>Follow-up within 7 days</span>
          </span>
        </div>
        <div className="pf-stat">
          <span className="pf-stat-icon pf-stat-amber">
            <XCircle className="pf-icon" />
          </span>
          <span className="pf-stat-text">
            <strong>{stats.missed}</strong>
            <span>Missed a follow-up</span>
          </span>
        </div>
      </div>

      <div className="pf-card">
        <div className="pf-filters">
          <div className="pf-search">
            <Search className="pf-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by patient name or allergen"
            />
          </div>
          <div className="pf-chips">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={"pf-chip" + (filter === f.value ? " pf-chip-active" : "")}
                onClick={() => {
                  setFilter(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="pf-count">
            {rows.length} of {folders.length}
          </span>
        </div>

        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Allergies</th>
                <th className="pf-align-right">Meds</th>
                <th>Last consultation</th>
                <th>Next follow-up</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => (
                <tr key={r.id} className="pf-row" onClick={() => navigate("/dashboard/customers/" + r.id)}>
                  <td>
                    <span className="pf-name">
                      <span className="pf-avatar">{r.name.charAt(0)}</span>
                      <span className="pf-name-text">
                        <strong>{r.name}</strong>
                        <span>
                          {r.age} · {r.gender}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td>
                    {r.allergens.length === 0 ? (
                      <span className="pf-muted">None known</span>
                    ) : (
                      <span className="pf-allergens">
                        {r.allergens.map((a) => (
                          <span key={a} className={"pf-allergen" + (r.hasSevere ? " pf-allergen-severe" : "")}>
                            {a}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                  <td className="pf-align-right pf-mono">{r.medicationCount}</td>
                  <td>{r.lastConsult ? formatDate(r.lastConsult) : <span className="pf-muted">—</span>}</td>
                  <td>
                    {r.missed > 0 && <span className="pf-flag pf-flag-missed">{r.missed} missed</span>}
                    {r.nextDue !== null ? (
                      <span className="pf-due">
                        {formatDate(r.nextDue)}
                        <span>{relativeDays(r.nextDue)}</span>
                      </span>
                    ) : (
                      r.missed === 0 && <span className="pf-muted">None scheduled</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="pf-empty">
                    No patient folder matches that.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          noun="patients"
        />
      </div>

      {newOpen && <NewPatientModal onClose={() => setNewOpen(false)} onSubmit={handleNewPatient} />}

      {toast && <div className="pf-toast">{toast}</div>}
    </div>
  );
}

export default PatientFolders;
