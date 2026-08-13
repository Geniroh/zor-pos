import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReportShell, { ChartTooltip, StatTile, useReportPeriod, useToast } from "../../components/reports/ReportShell";
import Pagination from "../../components/common/Pagination";
import {
  byCustomer,
  changePct,
  customerMix,
  downloadCsv,
  formatDay,
  formatNaira,
  linesIn,
  seriesFor,
  totalsFor,
} from "../../components/reports/reports-data";
import "./index.css";

/**
 * Split-question layout: the top half answers "who is coming in" (new versus
 * returning, attributed versus walk-in), the bottom answers "who is worth the
 * most". Rows link into the existing customer detail page rather than
 * duplicating a profile view inside Reports.
 */

type Segment = "all" | "new" | "returning";

function CustomerReport() {
  const { preset, setPreset, period, compare } = useReportPeriod("30d");
  const { toast, flash } = useToast();

  const [segment, setSegment] = useState<Segment>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const lines = useMemo(() => linesIn(period), [period]);
  const previousLines = useMemo(() => linesIn(compare), [compare]);

  const totals = useMemo(() => totalsFor(lines), [lines]);
  const previousTotals = useMemo(() => totalsFor(previousLines), [previousLines]);

  const mix = useMemo(() => customerMix(lines, period), [lines, period]);
  const previousMix = useMemo(() => customerMix(previousLines, compare), [previousLines, compare]);

  const rows = useMemo(() => byCustomer(lines, period), [lines, period]);
  const filtered = useMemo(() => {
    if (segment === "new") return rows.filter((r) => r.isNew);
    if (segment === "returning") return rows.filter((r) => !r.isNew);
    return rows;
  }, [rows, segment]);

  const pageStart = (Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize))) - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);

  const daily = useMemo(() => seriesFor(lines, period, "daily"), [lines, period]);

  const mixData = [
    { key: "new", label: "New", value: mix.newCount, color: "var(--chart-cat-3)" },
    { key: "returning", label: "Returning", value: mix.returningCount, color: "var(--chart-cat-1)" },
  ];
  const attributionData = [
    { key: "attributed", label: "Attributed", value: mix.attributedSales, color: "var(--chart-cat-1)" },
    { key: "walkin", label: "Walk-in", value: mix.walkInSales, color: "var(--chart-cat-4)" },
  ];

  /** Top-5 share of attributed revenue — how concentrated the customer base is. */
  const attributedRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const top5Revenue = rows.slice(0, 5).reduce((s, r) => s + r.revenue, 0);
  const concentration = attributedRevenue === 0 ? 0 : (top5Revenue / attributedRevenue) * 100;

  function changeSegment(value: Segment) {
    setSegment(value);
    setPage(1);
  }

  function handleExport() {
    const data = filtered.map((r) => [
      r.id,
      r.name,
      r.isNew ? "New" : "Returning",
      String(r.transactions),
      String(r.units),
      r.revenue.toFixed(2),
      r.basket.toFixed(2),
      formatDay(r.lastPurchase),
    ]);
    downloadCsv(
      "customer-report",
      ["Customer ID", "Customer", "Segment", "Transactions", "Units", "Sales", "Average basket", "Last purchase"],
      data,
    );
    flash("Exported " + data.length + " customer" + (data.length === 1 ? "" : "s") + " to CSV");
  }

  return (
    <ReportShell
      title="Customer Report"
      subtitle="Who is coming in, and who is worth the most"
      preset={preset}
      onPresetChange={setPreset}
      period={period}
      compare={compare}
      onExport={handleExport}
      toast={toast}
    >
      <div className="report-tiles">
        <StatTile
          label="Active customers"
          value={totals.customers.toLocaleString()}
          change={changePct(totals.customers, previousTotals.customers)}
          note="named customers who bought"
        />
        <StatTile
          label="New customers"
          value={mix.newCount.toLocaleString()}
          change={changePct(mix.newCount, previousMix.newCount)}
          note="first purchase in this period"
        />
        <StatTile
          label="Revenue per customer"
          value={formatNaira(totals.customers === 0 ? 0 : attributedRevenue / totals.customers)}
          note="attributed sales only"
        />
        <StatTile
          label="Top 5 concentration"
          value={concentration.toFixed(1) + "%"}
          note="of attributed revenue"
        />
      </div>

      <div className="cu-top">
        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">New vs returning</span>
            <span className="report-card-note">By customer count</span>
          </div>
          <div className="cu-pair">
            <div className="cu-donut">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={mixData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="58%"
                    outerRadius="92%"
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {mixData.map((s) => (
                      <Cell key={s.key} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip format={(v) => v + " customers"} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="cu-legend">
              {mixData.map((s) => (
                <li key={s.key}>
                  <span className="cu-dot" style={{ background: s.color }} />
                  <span className="cu-legend-text">
                    <strong>{s.label}</strong>
                    <span>
                      {s.value} ·{" "}
                      {formatNaira(s.key === "new" ? mix.newRevenue : mix.returningRevenue)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Attributed vs walk-in</span>
            <span className="report-card-note">By transaction</span>
          </div>
          <div className="cu-pair">
            <div className="cu-donut">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={attributionData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="58%"
                    outerRadius="92%"
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {attributionData.map((s) => (
                      <Cell key={s.key} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip format={(v) => v + " sales"} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="cu-legend">
              {attributionData.map((s) => (
                <li key={s.key}>
                  <span className="cu-dot" style={{ background: s.color }} />
                  <span className="cu-legend-text">
                    <strong>{s.label}</strong>
                    <span>{s.value} sales</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Active customers per day</span>
          </div>
          <ResponsiveContainer width="100%" height={186}>
            <LineChart data={daily} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                stroke="var(--chart-axis)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis
                stroke="var(--chart-axis)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip format={(v) => v + " customers"} />} />
              <Line
                type="monotone"
                dataKey="customers"
                name="Customers"
                stroke="var(--chart-cat-1)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="report-card">
        <div className="report-card-head">
          <span className="report-card-title">Customers by spend</span>
          <div className="report-segmented">
            <button type="button" aria-pressed={segment === "all"} onClick={() => changeSegment("all")}>
              All
            </button>
            <button type="button" aria-pressed={segment === "new"} onClick={() => changeSegment("new")}>
              New
            </button>
            <button
              type="button"
              aria-pressed={segment === "returning"}
              onClick={() => changeSegment("returning")}
            >
              Returning
            </button>
          </div>
        </div>

        {pageRows.length === 0 ? (
          <div className="report-empty">No customers in this segment for the selected period.</div>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Segment</th>
                  <th className="report-align-right">Transactions</th>
                  <th className="report-align-right">Units</th>
                  <th className="report-align-right">Sales</th>
                  <th className="report-align-right">Average basket</th>
                  <th className="report-align-right">Last purchase</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {/* Links into the existing customer detail page rather than
                          rebuilding a profile view inside Reports. */}
                      <Link to={"/dashboard/customers/" + row.id} className="cu-link">
                        {row.name}
                      </Link>
                    </td>
                    <td>
                      <span className={"cu-tag" + (row.isNew ? " cu-tag--new" : "")}>
                        {row.isNew ? "New" : "Returning"}
                      </span>
                    </td>
                    <td className="report-align-right report-mono">{row.transactions}</td>
                    <td className="report-align-right report-mono">{row.units}</td>
                    <td className="report-align-right report-mono">{formatNaira(row.revenue)}</td>
                    <td className="report-align-right report-mono">{formatNaira(row.basket)}</td>
                    <td className="report-align-right report-mono">{formatDay(row.lastPurchase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          noun="customers"
        />
      </section>
    </ReportShell>
  );
}

export default CustomerReport;
