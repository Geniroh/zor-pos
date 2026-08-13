import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReportShell, {
  ChartTooltip,
  StatTile,
  useReportPeriod,
  useToast,
} from "../../components/reports/ReportShell";
import {
  byStaff,
  changePct,
  defaultGranularity,
  downloadCsv,
  formatCompactNaira,
  formatNaira,
  linesIn,
  seriesFor,
  totalsFor,
  type Granularity,
} from "../../components/reports/reports-data";
import "./index.css";

/**
 * Trend-led: the question this report answers is "is the line going up, and
 * what is it made of". Revenue and profit share one axis so the margin gap is
 * visible as a band rather than needing mental arithmetic between two charts.
 */

type Metric = "revenue" | "profit" | "transactions" | "units";

const METRICS: { value: Metric; label: string; money: boolean }[] = [
  { value: "revenue", label: "Sales", money: true },
  { value: "profit", label: "Gross profit", money: true },
  { value: "transactions", label: "Transactions", money: false },
  { value: "units", label: "Units", money: false },
];

const STAFF_COLORS = [
  "var(--chart-cat-1)",
  "var(--chart-cat-3)",
  "var(--chart-cat-4)",
  "var(--chart-cat-5)",
];

function SalesReport() {
  const { preset, setPreset, period, compare } = useReportPeriod("30d");
  const { toast, flash } = useToast();

  const [granularity, setGranularity] = useState<Granularity | "auto">("auto");
  const [metric, setMetric] = useState<Metric>("revenue");

  const lines = useMemo(() => linesIn(period), [period]);
  const previousLines = useMemo(() => linesIn(compare), [compare]);
  const current = useMemo(() => totalsFor(lines), [lines]);
  const previous = useMemo(() => totalsFor(previousLines), [previousLines]);

  const resolved: Granularity = granularity === "auto" ? defaultGranularity(period) : granularity;
  const series = useMemo(() => seriesFor(lines, period, resolved), [lines, period, resolved]);

  const staff = useMemo(() => byStaff(lines), [lines]);
  const marginPct = current.revenue === 0 ? 0 : (current.profit / current.revenue) * 100;
  const previousMarginPct = previous.revenue === 0 ? 0 : (previous.profit / previous.revenue) * 100;

  const best = series.reduce<(typeof series)[number] | null>(
    (top, point) => (top === null || point.revenue > top.revenue ? point : top),
    null,
  );

  const metricMeta = METRICS.find((m) => m.value === metric) ?? METRICS[0];
  const metricTotal = series.reduce((sum, point) => sum + (point[metric] as number), 0);

  function handleExport() {
    const rows = series.map((point) => [
      point.label,
      point.revenue.toFixed(2),
      point.profit.toFixed(2),
      String(point.transactions),
      String(point.units),
      String(point.customers),
    ]);
    downloadCsv(
      "sales-report",
      ["Period", "Sales", "Gross profit", "Transactions", "Units", "Customers"],
      rows,
    );
    flash("Exported " + rows.length + " row" + (rows.length === 1 ? "" : "s") + " to CSV");
  }

  return (
    <ReportShell
      title="Sales Report"
      subtitle="Revenue, profit and transaction volume over time"
      preset={preset}
      onPresetChange={setPreset}
      period={period}
      compare={compare}
      onExport={handleExport}
      toast={toast}
      controls={
        <select
          className="sr-select"
          value={granularity}
          onChange={(e) => setGranularity(e.target.value as Granularity | "auto")}
          aria-label="Granularity"
        >
          <option value="auto">Auto grouping</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      }
    >
      <div className="report-tiles">
        <StatTile
          label="Total sales"
          value={formatNaira(current.revenue)}
          change={changePct(current.revenue, previous.revenue)}
          note="vs previous period"
        />
        <StatTile
          label="Gross profit"
          value={formatNaira(current.profit)}
          change={changePct(current.profit, previous.profit)}
          note={marginPct.toFixed(1) + "% margin"}
        />
        <StatTile
          label="Transactions"
          value={current.transactions.toLocaleString()}
          change={changePct(current.transactions, previous.transactions)}
          note="vs previous period"
        />
        <StatTile
          label="Average basket"
          value={formatNaira(current.basket)}
          change={changePct(current.basket, previous.basket)}
          note={current.units.toLocaleString() + " units sold"}
        />
        <StatTile
          label="Margin"
          value={marginPct.toFixed(1) + "%"}
          change={changePct(marginPct, previousMarginPct)}
          note="vs previous period"
        />
      </div>

      <section className="report-card sr-chart-card">
        <div className="report-card-head">
          <span className="report-card-title">Sales and gross profit</span>
          <span className="report-card-note">
            {best ? "Best " + resolved.replace("ly", "") + ": " + best.label + " · " + formatNaira(best.revenue) : ""}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={series} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sr-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sr-profit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-cat-3)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--chart-cat-3)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              stroke="var(--chart-axis)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={16}
            />
            <YAxis
              stroke="var(--chart-axis)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={62}
              tickFormatter={(v) => formatCompactNaira(Number(v))}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Sales"
              stroke="var(--green)"
              strokeWidth={2}
              fill="url(#sr-revenue)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="profit"
              name="Gross profit"
              stroke="var(--chart-cat-3)"
              strokeWidth={2}
              fill="url(#sr-profit)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <div className="sr-split">
        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Sales by staff member</span>
            <span className="report-card-note">Who rang the sale up</span>
          </div>

          <ResponsiveContainer width="100%" height={Math.max(150, staff.length * 46)}>
            <BarChart data={staff} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
              <XAxis
                type="number"
                stroke="var(--chart-axis)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCompactNaira(Number(v))}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={140}
                stroke="var(--chart-axis)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ fill: "var(--cream)" }} content={<ChartTooltip />} />
              <Bar dataKey="revenue" name="Sales" radius={[0, 6, 6, 0]} maxBarSize={26} isAnimationActive={false}>
                {staff.map((row, i) => (
                  <Cell key={row.name} fill={STAFF_COLORS[i % STAFF_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Breakdown</span>
            <div className="report-segmented">
              {METRICS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={metric === m.value}
                  onClick={() => setMetric(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="report-table-wrap sr-table-scroll">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="report-align-right">{metricMeta.label}</th>
                  <th className="report-align-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {series.map((point) => {
                  const value = point[metric] as number;
                  return (
                    <tr key={point.bucket}>
                      <td>{point.label}</td>
                      <td className="report-align-right report-mono">
                        {metricMeta.money ? formatNaira(value) : value.toLocaleString()}
                      </td>
                      <td className="report-align-right report-mono">
                        {metricTotal === 0 ? "0.0%" : ((value / metricTotal) * 100).toFixed(1) + "%"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ReportShell>
  );
}

export default SalesReport;
