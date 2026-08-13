import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus, Search, Stethoscope } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import consultImg from "../../../../images/h312.png";
import Pagination from "../../components/common/Pagination";
import ConsultationModal, { type ConsultationDraft } from "../../components/care/ConsultationModal";
import ConsultationDrawer from "../../components/care/ConsultationDrawer";
import {
  CARE_ACTIVITIES,
  CLINICIANS,
  VISIT_REASONS,
  findCustomer,
  formatDate,
  monthLabel,
  saveConsultation,
  scheduleFollowUp,
  type CareActivity,
  type VisitReason,
} from "../../components/care/care-data";
import "./index.css";

const DAY = 24 * 60 * 60 * 1000;

type DatePreset = "all" | "30" | "90";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: { name: string; value: number } }[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="con-tooltip">
      <span className="con-tooltip-title">{p.name}</span>
      <span className="con-tooltip-value">
        {p.value} {p.value === 1 ? "consultation" : "consultations"}
      </span>
    </div>
  );
}

function Consultations() {
  const [activities, setActivities] = useState<CareActivity[]>(() => [...CARE_ACTIVITIES]);
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState<VisitReason | "all">("all");
  const [clinician, setClinician] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [newOpen, setNewOpen] = useState(false);
  const [viewing, setViewing] = useState<CareActivity | null>(null);

  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2400);
  }

  /* ---------------- Insights ---------------- */

  const byMonth = useMemo(() => {
    const buckets: { name: string; value: number }[] = [];
    const index = new Map<string, number>();
    const today = new Date();
    for (let back = 5; back >= 0; back--) {
      const d = new Date(today.getFullYear(), today.getMonth() - back, 1);
      index.set(d.getFullYear() + "-" + d.getMonth(), buckets.length);
      buckets.push({ name: monthLabel(d.getFullYear(), d.getMonth()), value: 0 });
    }
    for (const a of activities) {
      const d = new Date(a.date);
      const at = index.get(d.getFullYear() + "-" + d.getMonth());
      if (at !== undefined) buckets[at].value += 1;
    }
    return buckets;
  }, [activities]);

  const byReason = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of activities) counts.set(a.reason, (counts.get(a.reason) ?? 0) + 1);
    return VISIT_REASONS.map((r) => ({ name: r, value: counts.get(r) ?? 0 })).sort(
      (a, b) => a.value - b.value,
    );
  }, [activities]);

  const stats = useMemo(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const thisMonth = activities.filter((a) => a.date >= startOfMonth).length;
    const withFollowUp = activities.filter((a) => a.producedFollowUpId || a.closesFollowUpId).length;
    return {
      total: activities.length,
      thisMonth,
      linked: activities.length ? Math.round((withFollowUp / activities.length) * 100) : 0,
    };
  }, [activities]);

  /* ---------------- Log ---------------- */

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff =
      datePreset === "30" ? Date.now() - 30 * DAY : datePreset === "90" ? Date.now() - 90 * DAY : 0;

    return activities
      .filter((a) => {
        if (reason !== "all" && a.reason !== reason) return false;
        if (clinician !== "all" && a.by !== clinician) return false;
        if (a.date < cutoff) return false;
        if (!q) return true;
        const name = findCustomer(a.customerId)?.name.toLowerCase() ?? "";
        return (
          name.includes(q) ||
          a.concern.toLowerCase().includes(q) ||
          a.assessment.toLowerCase().includes(q) ||
          a.medication.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date - a.date);
  }, [activities, query, reason, clinician, datePreset]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize],
  );

  function handleSave(draft: ConsultationDraft) {
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

    if (draft.followUp) {
      const created = scheduleFollowUp({
        customerId: draft.customerId,
        dueAt: draft.followUp.dueAt,
        reason: draft.followUp.reason,
        channel: draft.followUp.channel,
        status: "Scheduled",
        by: draft.by,
      });
      activity.producedFollowUpId = created.id;
    }

    setActivities((prev) => [activity, ...prev]);
    setPage(1);
    flash(
      "Consultation saved · " +
        (findCustomer(draft.customerId)?.name ?? "") +
        (draft.followUp ? " · follow-up scheduled" : ""),
    );
  }

  return (
    <div className="con-page">
      <nav className="con-breadcrumb">
        <Link to="/dashboard/customers">Customers &amp; Care</Link>
        <ChevronRight className="con-crumb-icon" />
        <span>Clinical Consultations</span>
      </nav>

      {/* The illustration is landscape, so it reads as a banner rather than the
          side panel the portrait one gets on the section's intro page. */}
      <section className="con-hero">
        <div className="con-hero-text">
          <span className="con-hero-tag">
            <Stethoscope className="con-hero-tag-icon" />
            Pharmaceutical care
          </span>
          <h1>Clinical Consultations</h1>
          <p>
            Every conversation worth remembering — what the patient came in with, what you found,
            and what you did about it.
          </p>
          <div className="con-hero-stats">
            <span>
              <strong>{stats.total}</strong>
              logged
            </span>
            <i />
            <span>
              <strong>{stats.thisMonth}</strong>
              this month
            </span>
            <i />
            <span>
              <strong>{stats.linked}%</strong>
              tied to a follow-up
            </span>
          </div>
          <button type="button" className="con-hero-btn" onClick={() => setNewOpen(true)}>
            <Plus className="con-btn-icon" />
            Start consultation
          </button>
        </div>
        <div className="con-hero-art">
          <img src={consultImg} alt="" />
        </div>
      </section>

      <div className="con-charts">
        <div className="con-card">
          <div className="con-card-title">Consultations by month</div>
          <ResponsiveContainer width="100%" height={168}>
            <BarChart data={byMonth} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
              <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "var(--cream)" }} content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={30} fill="var(--chart-cat-1)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="con-card">
          <div className="con-card-title">Why patients came in</div>
          <ResponsiveContainer width="100%" height={168}>
            <BarChart data={byReason} layout="vertical" margin={{ left: 8, right: 20, top: 8, bottom: 0 }}>
              <XAxis type="number" stroke="var(--chart-axis)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                width={132}
                stroke="var(--chart-axis)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ fill: "var(--cream)" }} content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                {byReason.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === "Follow-up" ? "var(--chart-cat-3)" : "var(--chart-cat-4)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="con-card con-log">
        <div className="con-filters">
          <div className="con-search">
            <Search className="con-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search patient, concern, finding or medicine"
            />
          </div>

          <div className="con-chips">
            <button
              type="button"
              className={"con-chip" + (reason === "all" ? " con-chip-active" : "")}
              onClick={() => {
                setReason("all");
                setPage(1);
              }}
            >
              All reasons
            </button>
            {VISIT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className={"con-chip" + (reason === r ? " con-chip-active" : "")}
                onClick={() => {
                  setReason(r);
                  setPage(1);
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <label className="con-select">
            <span>Seen by</span>
            <select
              value={clinician}
              onChange={(e) => {
                setClinician(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Anyone</option>
              {CLINICIANS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="con-select">
            <span>Period</span>
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value as DatePreset);
                setPage(1);
              }}
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="con-table-wrap">
          <table className="con-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Reason</th>
                <th>Assessment</th>
                <th>Seen by</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((a) => {
                const customer = findCustomer(a.customerId);
                return (
                  <tr key={a.id} className="con-row" onClick={() => setViewing(a)}>
                    <td className="con-nowrap">{formatDate(a.date)}</td>
                    <td>
                      <span className="con-name">
                        <span className="con-avatar">{customer?.name.charAt(0) ?? "?"}</span>
                        {customer?.name ?? a.customerId}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          "con-reason" + (a.reason === "Follow-up" ? " con-reason-followup" : "")
                        }
                      >
                        {a.reason}
                      </span>
                    </td>
                    <td className="con-assessment">{a.assessment}</td>
                    <td className="con-nowrap">{a.by}</td>
                    <td>
                      <span className="con-outcome">{a.outcome}</span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="con-empty">
                    No consultation matches those filters.
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
          noun="consultations"
        />
      </div>

      {newOpen && <ConsultationModal onClose={() => setNewOpen(false)} onSubmit={handleSave} />}

      {viewing && <ConsultationDrawer activity={viewing} onClose={() => setViewing(null)} />}

      {toast && <div className="con-toast">{toast}</div>}
    </div>
  );
}

export default Consultations;
