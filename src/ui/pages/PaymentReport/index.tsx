import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReportShell, { ChartTooltip, StatTile, useReportPeriod, useToast } from "../../components/reports/ReportShell";
import {
  byPayment,
  changePct,
  defaultGranularity,
  downloadCsv,
  formatCompactNaira,
  formatNaira,
  linesIn,
  PAYMENT_COLOR,
  PAYMENT_METHODS,
  seriesFor,
  totalsFor,
} from "../../components/reports/reports-data";
import "./index.css";

/**
 * Mix-over-time led. A single donut answers "what's the split" but not the
 * question that actually matters to a pharmacy — whether cash is drifting to
 * transfer — so the stacked bar carries the page and the donut supports it.
 * Toggling between value and share of period is the point of the segmented
 * control: the two tell different stories on a growing week.
 */

type Mode = "value" | "share";

function PaymentReport() {
  const { preset, setPreset, period, compare } = useReportPeriod("30d");
  const { toast, flash } = useToast();

  const [mode, setMode] = useState<Mode>("value");

  const lines = useMemo(() => linesIn(period), [period]);
  const previousLines = useMemo(() => linesIn(compare), [compare]);

  const slices = useMemo(() => byPayment(lines), [lines]);
  const previousSlices = useMemo(() => byPayment(previousLines), [previousLines]);
  const totals = useMemo(() => totalsFor(lines), [lines]);

  const granularity = defaultGranularity(period);

  const stacked = useMemo(() => {
    const perMethod = PAYMENT_METHODS.map((method) => ({
      method,
      points: seriesFor(lines.filter((l) => l.payment === method), period, granularity),
    }));
    const length = perMethod[0]?.points.length ?? 0;

    return Array.from({ length }, (_, i) => {
      const row: Record<string, string | number> = { label: perMethod[0].points[i].label };
      const bucketTotal = perMethod.reduce((sum, m) => sum + (m.points[i]?.revenue ?? 0), 0);
      for (const { method, points } of perMethod) {
        const value = points[i]?.revenue ?? 0;
        row[method] = mode === "value" ? value : bucketTotal === 0 ? 0 : (value / bucketTotal) * 100;
      }
      return row;
    });
  }, [lines, period, granularity, mode]);

  const cash = slices.find((s) => s.key === "Cash");
  const digital = slices.filter((s) => s.key === "Transfer" || s.key === "POS / Card");
  const digitalRevenue = digital.reduce((s, d) => s + d.revenue, 0);
  const previousDigital = previousSlices
    .filter((s) => s.key === "Transfer" || s.key === "POS / Card")
    .reduce((s, d) => s + d.revenue, 0);
  const digitalShare = totals.revenue === 0 ? 0 : (digitalRevenue / totals.revenue) * 100;

  function handleExport() {
    const rows = slices.map((slice) => {
      const before = previousSlices.find((p) => p.key === slice.key);
      const change = changePct(slice.revenue, before?.revenue ?? 0);
      return [
        slice.label,
        slice.revenue.toFixed(2),
        slice.share.toFixed(1) + "%",
        String(slice.transactions),
        (slice.transactions === 0 ? 0 : slice.revenue / slice.transactions).toFixed(2),
        change === null ? "—" : change.toFixed(1) + "%",
      ];
    });
    downloadCsv(
      "payment-report",
      ["Method", "Sales", "Share", "Transactions", "Average basket", "Change vs previous"],
      rows,
    );
    flash("Exported " + rows.length + " method" + (rows.length === 1 ? "" : "s") + " to CSV");
  }

  return (
    <ReportShell
      title="Payment Report"
      subtitle="How customers are paying, and whether that is shifting"
      preset={preset}
      onPresetChange={setPreset}
      period={period}
      compare={compare}
      onExport={handleExport}
      toast={toast}
    >
      <div className="report-tiles">
        <StatTile label="Total collected" value={formatNaira(totals.revenue)} note={totals.transactions + " transactions"} />
        <StatTile
          label="Cash share"
          value={cash ? cash.share.toFixed(1) + "%" : "—"}
          note={cash ? formatNaira(cash.revenue) : "No cash sales"}
        />
        <StatTile
          label="Digital share"
          value={digitalShare.toFixed(1) + "%"}
          change={changePct(digitalRevenue, previousDigital)}
          note="transfer + card"
        />
        <StatTile
          label="Average basket"
          value={formatNaira(totals.basket)}
          note="across all methods"
        />
      </div>

      <div className="pm-top">
        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Payment mix over time</span>
            <div className="report-segmented">
              <button type="button" aria-pressed={mode === "value"} onClick={() => setMode("value")}>
                Value
              </button>
              <button type="button" aria-pressed={mode === "share"} onClick={() => setMode("share")}>
                Share
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stacked} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
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
                width={mode === "value" ? 62 : 44}
                domain={mode === "share" ? [0, 100] : undefined}
                tickFormatter={(v) =>
                  mode === "value" ? formatCompactNaira(Number(v)) : Math.round(Number(v)) + "%"
                }
              />
              <Tooltip
                cursor={{ fill: "var(--cream)" }}
                content={
                  <ChartTooltip
                    format={(v) => (mode === "value" ? formatNaira(v) : v.toFixed(1) + "%")}
                  />
                }
              />
              {PAYMENT_METHODS.map((method) => (
                <Bar
                  key={method}
                  dataKey={method}
                  name={method}
                  stackId="mix"
                  fill={PAYMENT_COLOR[method]}
                  maxBarSize={38}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Share of takings</span>
          </div>

          <div className="pm-donut">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="revenue"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="92%"
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.key} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pm-donut-center">
              <span className="pm-donut-value">{formatCompactNaira(totals.revenue)}</span>
              <span className="pm-donut-label">Collected</span>
            </div>
          </div>

          <div className="report-legend pm-legend">
            {slices.map((slice) => (
              <div key={slice.key} className="report-legend-item pm-legend-row">
                <span className="report-legend-dot" style={{ background: slice.color }} />
                <span className="report-legend-text">
                  <strong>{slice.label}</strong>
                  <span>{slice.transactions} transactions</span>
                </span>
                <span className="report-legend-amount">{slice.share.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="report-card">
        <div className="report-card-head">
          <span className="report-card-title">By method</span>
          <span className="report-card-note">Compared against the preceding period</span>
        </div>

        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Method</th>
                <th className="report-align-right">Transactions</th>
                <th className="report-align-right">Sales</th>
                <th className="report-align-right">Share</th>
                <th className="report-align-right">Average basket</th>
                <th className="report-align-right">vs previous</th>
              </tr>
            </thead>
            <tbody>
              {slices.map((slice) => {
                const before = previousSlices.find((p) => p.key === slice.key);
                const change = changePct(slice.revenue, before?.revenue ?? 0);
                const up = (change ?? 0) >= 0;
                return (
                  <tr key={slice.key}>
                    <td>
                      <span className="pm-method">
                        <span className="pm-method-dot" style={{ background: slice.color }} />
                        {slice.label}
                      </span>
                    </td>
                    <td className="report-align-right report-mono">{slice.transactions.toLocaleString()}</td>
                    <td className="report-align-right report-mono">{formatNaira(slice.revenue)}</td>
                    <td className="report-align-right report-mono">{slice.share.toFixed(1)}%</td>
                    <td className="report-align-right report-mono">
                      {formatNaira(slice.transactions === 0 ? 0 : slice.revenue / slice.transactions)}
                    </td>
                    <td
                      className={
                        "report-align-right report-mono " + (up ? "pm-change--up" : "pm-change--down")
                      }
                    >
                      {change === null ? "—" : (up ? "▲ " : "▼ ") + Math.abs(change).toFixed(1) + "%"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </ReportShell>
  );
}

export default PaymentReport;
