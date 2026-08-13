import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReportShell, { ChartTooltip, StatTile, useReportPeriod, useToast } from "../../components/reports/ReportShell";
import Pagination from "../../components/common/Pagination";
import {
  CARE_ACTIVITIES,
  CLINICIANS,
  FOLLOW_UPS,
  findCustomer,
  OUTCOMES,
  VISIT_REASONS,
} from "../../components/care/care-data";
import {
  careSeries,
  careTotals,
  changePct,
  downloadCsv,
  formatDay,
  inPeriod,
} from "../../components/reports/reports-data";
import "./index.css";

/**
 * Timeline-led, because care work is judged on whether the queue is being
 * kept up with rather than on totals. Everything here reads the real care
 * datasets (CARE_ACTIVITIES / FOLLOW_UPS) — this report has no generated
 * sale-line component at all, unlike the other five.
 */

const OUTCOME_COLORS = [
  "var(--chart-cat-3)",
  "var(--chart-cat-1)",
  "var(--chart-cat-4)",
  "var(--chart-status-overdue)",
  "var(--green)",
];

const REASON_COLORS = [
  "var(--chart-cat-1)",
  "var(--chart-cat-3)",
  "var(--chart-cat-4)",
  "var(--chart-cat-5)",
  "var(--chart-cat-2)",
  "var(--muted)",
];

function CareReport() {
  const { preset, setPreset, period, compare } = useReportPeriod("30d");
  const { toast, flash } = useToast();

  const [clinician, setClinician] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const current = useMemo(() => careTotals(period), [period]);
  const previous = useMemo(() => careTotals(compare), [compare]);
  const series = useMemo(() => careSeries(period), [period]);

  const consultations = useMemo(
    () =>
      CARE_ACTIVITIES.filter(
        (a) => inPeriod(a.date, period) && (clinician === "all" || a.by === clinician),
      ).sort((a, b) => b.date - a.date),
    [period, clinician],
  );

  const followUps = useMemo(
    () =>
      FOLLOW_UPS.filter(
        (f) => inPeriod(f.dueAt, period) && (clinician === "all" || f.by === clinician),
      ),
    [period, clinician],
  );

  const reasonData = useMemo(
    () =>
      VISIT_REASONS.map((reason, i) => ({
        reason,
        count: consultations.filter((a) => a.reason === reason).length,
        color: REASON_COLORS[i % REASON_COLORS.length],
      })).sort((a, b) => b.count - a.count),
    [consultations],
  );

  const outcomeData = useMemo(
    () =>
      OUTCOMES.map((outcome, i) => ({
        outcome,
        count: consultations.filter((a) => a.outcome === outcome).length,
        color: OUTCOME_COLORS[i % OUTCOME_COLORS.length],
      })).sort((a, b) => b.count - a.count),
    [consultations],
  );

  const scheduled = followUps.filter((f) => f.status === "Scheduled").length;
  const completed = followUps.filter((f) => f.status === "Completed").length;
  const missed = followUps.filter((f) => f.status === "Missed").length;
  const completionPct = followUps.length === 0 ? 0 : (completed / followUps.length) * 100;

  const pageStart =
    (Math.min(page, Math.max(1, Math.ceil(consultations.length / pageSize))) - 1) * pageSize;
  const pageRows = consultations.slice(pageStart, pageStart + pageSize);

  function changeClinician(value: string) {
    setClinician(value);
    setPage(1);
  }

  function handleExport() {
    const rows = consultations.map((a) => [
      formatDay(a.date),
      findCustomer(a.customerId)?.name ?? a.customerId,
      a.by,
      a.reason,
      a.concern,
      a.assessment,
      a.intervention,
      a.medication,
      a.outcome,
    ]);
    downloadCsv(
      "care-report",
      ["Date", "Patient", "Seen by", "Reason", "Concern", "Assessment", "Intervention", "Medication", "Outcome"],
      rows,
    );
    flash("Exported " + rows.length + " consultation" + (rows.length === 1 ? "" : "s") + " to CSV");
  }

  return (
    <ReportShell
      title="Care Report"
      subtitle="Consultations, follow-ups, and whether the care queue is being kept up with"
      preset={preset}
      onPresetChange={setPreset}
      period={period}
      compare={compare}
      onExport={handleExport}
      toast={toast}
      controls={
        <select
          className="ca-select"
          value={clinician}
          onChange={(e) => changeClinician(e.target.value)}
          aria-label="Clinician"
        >
          <option value="all">All clinicians</option>
          {CLINICIANS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      }
    >
      <div className="report-tiles">
        <StatTile
          label="Consultations"
          value={current.consultations.toLocaleString()}
          change={changePct(current.consultations, previous.consultations)}
          note="logged in this period"
        />
        <StatTile
          label="Patients seen"
          value={current.patientsSeen.toLocaleString()}
          change={changePct(current.patientsSeen, previous.patientsSeen)}
          note="distinct patients"
        />
        <StatTile
          label="Follow-ups completed"
          value={completed + " of " + followUps.length}
          change={changePct(current.followUpsCompleted, previous.followUpsCompleted)}
          note={completionPct.toFixed(0) + "% closed"}
        />
        <StatTile
          label="Missed follow-ups"
          value={String(missed)}
          note={scheduled + " still scheduled"}
        />
      </div>

      <section className="report-card ca-timeline">
        <div className="report-card-head">
          <span className="report-card-title">Care activity per day</span>
          <span className="report-card-note">
            Consultations logged against follow-ups closed
          </span>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={series} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="label"
              stroke="var(--chart-axis)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />
            <YAxis
              stroke="var(--chart-axis)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={32}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip format={(v) => String(v)} />} />
            <Line
              type="monotone"
              dataKey="consultations"
              name="Consultations"
              stroke="var(--chart-cat-3)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Follow-ups closed"
              stroke="var(--chart-cat-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <div className="ca-split">
        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Why patients were seen</span>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(160, reasonData.length * 34)}>
            <BarChart data={reasonData} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
              <XAxis
                type="number"
                stroke="var(--chart-axis)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="reason"
                type="category"
                width={160}
                stroke="var(--chart-axis)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ fill: "var(--cream)" }} content={<ChartTooltip format={(v) => String(v)} />} />
              <Bar dataKey="count" name="Consultations" radius={[0, 6, 6, 0]} maxBarSize={20} isAnimationActive={false}>
                {reasonData.map((row) => (
                  <Cell key={row.reason} fill={row.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Outcomes</span>
          </div>
          <ul className="ca-outcomes">
            {outcomeData.map((row) => {
              const share = consultations.length === 0 ? 0 : (row.count / consultations.length) * 100;
              return (
                <li key={row.outcome}>
                  <span className="ca-outcome-head">
                    <span className="ca-outcome-label">{row.outcome}</span>
                    <span className="ca-outcome-count report-mono">
                      {row.count} · {share.toFixed(0)}%
                    </span>
                  </span>
                  <span className="ca-outcome-bar">
                    <span
                      className="ca-outcome-fill"
                      style={{ width: share + "%", background: row.color }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="ca-followups">
            <div className="ca-followup ca-followup--done">
              <span>{completed}</span>Completed
            </div>
            <div className="ca-followup ca-followup--open">
              <span>{scheduled}</span>Scheduled
            </div>
            <div className="ca-followup ca-followup--missed">
              <span>{missed}</span>Missed
            </div>
          </div>
        </section>
      </div>

      <section className="report-card">
        <div className="report-card-head">
          <span className="report-card-title">Consultation log</span>
          <span className="report-card-note">
            {consultations.length} record{consultations.length === 1 ? "" : "s"}
          </span>
        </div>

        {pageRows.length === 0 ? (
          <div className="report-empty">No consultations in this period.</div>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table ca-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Seen by</th>
                  <th>Reason</th>
                  <th>Intervention</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((activity) => (
                  <tr key={activity.id}>
                    <td className="report-mono">{formatDay(activity.date)}</td>
                    <td>
                      <Link to={"/dashboard/customers/" + activity.customerId} className="ca-link">
                        {findCustomer(activity.customerId)?.name ?? activity.customerId}
                      </Link>
                    </td>
                    <td>{activity.by}</td>
                    <td>{activity.reason}</td>
                    <td className="ca-intervention">{activity.intervention}</td>
                    <td>
                      <span className="ca-outcome-tag">{activity.outcome}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          pageSize={pageSize}
          total={consultations.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          noun="consultations"
        />
      </section>
    </ReportShell>
  );
}

export default CareReport;
