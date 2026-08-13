import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReportShell, { ChartTooltip, useReportPeriod, useToast } from "../../components/reports/ReportShell";
import {
  byCategory,
  byProduct,
  CATEGORIES,
  CATEGORY_COLOR,
  categoryOf,
  changePct,
  defaultGranularity,
  downloadCsv,
  formatCompactNaira,
  formatNaira,
  linesIn,
  seriesFor,
  type Category,
} from "../../components/reports/reports-data";
import "./index.css";

/**
 * Donut-led, with the legend doubling as a filter: selecting a category swaps
 * the whole lower half to that category's products and its own trend line.
 * That drill-in is the reason this page exists separately from the products
 * report — the question here is about the mix, not the individual item.
 */

function CategoryReport() {
  const { preset, setPreset, period, compare } = useReportPeriod("30d");
  const { toast, flash } = useToast();

  const [selected, setSelected] = useState<Category | null>(null);

  const lines = useMemo(() => linesIn(period), [period]);
  const previousLines = useMemo(() => linesIn(compare), [compare]);

  const slices = useMemo(() => byCategory(lines), [lines]);
  const previousSlices = useMemo(() => byCategory(previousLines), [previousLines]);
  const total = slices.reduce((s, c) => s + c.revenue, 0);

  const granularity = defaultGranularity(period);

  /** One series per category, index-aligned, so they stack on one axis. */
  const trend = useMemo(() => {
    const perCategory = CATEGORIES.map((category) => ({
      category,
      points: seriesFor(
        lines.filter((l) => categoryOf(l.productId) === category),
        period,
        granularity,
      ),
    }));
    const length = perCategory[0]?.points.length ?? 0;
    return Array.from({ length }, (_, i) => {
      const row: Record<string, string | number> = { label: perCategory[0].points[i].label };
      for (const { category, points } of perCategory) {
        row[category] = points[i]?.revenue ?? 0;
      }
      return row;
    });
  }, [lines, period, granularity]);

  const focusLines = selected ? lines.filter((l) => categoryOf(l.productId) === selected) : lines;
  const focusProducts = useMemo(
    () => byProduct(focusLines).filter((r) => r.revenue > 0),
    [focusLines],
  );

  function handleExport() {
    const rows = slices.map((slice) => {
      const before = previousSlices.find((p) => p.key === slice.key);
      const change = changePct(slice.revenue, before?.revenue ?? 0);
      return [
        slice.label,
        slice.revenue.toFixed(2),
        slice.profit.toFixed(2),
        String(slice.units),
        String(slice.transactions),
        slice.share.toFixed(1) + "%",
        change === null ? "—" : change.toFixed(1) + "%",
      ];
    });
    downloadCsv(
      "category-report",
      ["Category", "Sales", "Gross profit", "Units", "Transactions", "Share", "Change vs previous"],
      rows,
    );
    flash("Exported " + rows.length + " categor" + (rows.length === 1 ? "y" : "ies") + " to CSV");
  }

  return (
    <ReportShell
      title="Category Report"
      subtitle="Which parts of the catalog are earning their shelf space"
      preset={preset}
      onPresetChange={setPreset}
      period={period}
      compare={compare}
      onExport={handleExport}
      toast={toast}
    >
      <div className="cr-top">
        <section className="report-card cr-donut-card">
          <div className="report-card-head">
            <span className="report-card-title">Revenue mix</span>
            <span className="report-card-note">Select a category to focus the page</span>
          </div>

          <div className="cr-donut-row">
            <div className="cr-donut">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="revenue"
                    nameKey="label"
                    innerRadius="60%"
                    outerRadius="92%"
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                    /* Recharts types the click payload loosely, so resolve the
                       slice by index against our own array instead. */
                    onClick={(_, index) => {
                      const key = slices[index]?.key as Category | undefined;
                      if (key) setSelected((prev) => (prev === key ? null : key));
                    }}
                  >
                    {slices.map((slice) => (
                      <Cell
                        key={slice.key}
                        fill={slice.color}
                        opacity={selected === null || selected === slice.key ? 1 : 0.32}
                        cursor="pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="cr-donut-center">
                <span className="cr-donut-value">{formatCompactNaira(total)}</span>
                <span className="cr-donut-label">Total sales</span>
              </div>
            </div>

            <div className="report-legend">
              {slices.map((slice) => {
                const before = previousSlices.find((p) => p.key === slice.key);
                const change = changePct(slice.revenue, before?.revenue ?? 0);
                const up = (change ?? 0) >= 0;
                return (
                  <button
                    key={slice.key}
                    type="button"
                    className={
                      "report-legend-item" + (selected === slice.key ? " report-legend-item--active" : "")
                    }
                    onClick={() => setSelected((prev) => (prev === slice.key ? null : (slice.key as Category)))}
                  >
                    <span className="report-legend-dot" style={{ background: slice.color }} />
                    <span className="report-legend-text">
                      <strong>{slice.label}</strong>
                      <span>
                        {slice.share.toFixed(1)}% · {slice.units.toLocaleString()} units
                      </span>
                    </span>
                    <span className="report-legend-amount">
                      {formatCompactNaira(slice.revenue)}
                      <span className={"cr-delta" + (up ? " cr-delta--up" : " cr-delta--down")}>
                        {change === null ? "—" : (up ? "▲" : "▼") + Math.abs(change).toFixed(1) + "%"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Category trend</span>
            <span className="report-card-note">{granularity} totals</span>
          </div>

          <ResponsiveContainer width="100%" height={258}>
            <AreaChart data={trend} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
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
                width={58}
                tickFormatter={(v) => formatCompactNaira(Number(v))}
              />
              <Tooltip content={<ChartTooltip />} />
              {CATEGORIES.map((category) => (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  name={category}
                  stackId="mix"
                  stroke={CATEGORY_COLOR[category]}
                  fill={CATEGORY_COLOR[category]}
                  fillOpacity={selected === null || selected === category ? 0.55 : 0.15}
                  strokeWidth={1.4}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="report-card">
        <div className="report-card-head">
          <span className="report-card-title">
            {selected ? selected + " — products" : "All products by category"}
          </span>
          {selected && (
            <button type="button" className="cr-clear" onClick={() => setSelected(null)}>
              Clear filter
            </button>
          )}
        </div>

        {focusProducts.length === 0 ? (
          <div className="report-empty">No sales in this category for the selected period.</div>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="report-align-right">Units</th>
                  <th className="report-align-right">Sales</th>
                  <th className="report-align-right">Gross profit</th>
                  <th className="report-align-right">Margin</th>
                  <th className="report-align-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {focusProducts.map((row) => (
                  <tr key={row.product.id}>
                    <td>{row.product.name}</td>
                    <td>
                      <span className="cr-tag" style={{ background: CATEGORY_COLOR[row.category] }}>
                        {row.category}
                      </span>
                    </td>
                    <td className="report-align-right report-mono">{row.units.toLocaleString()}</td>
                    <td className="report-align-right report-mono">{formatNaira(row.revenue)}</td>
                    <td className="report-align-right report-mono">{formatNaira(row.profit)}</td>
                    <td className="report-align-right report-mono">
                      {row.revenue === 0 ? "—" : ((row.profit / row.revenue) * 100).toFixed(1) + "%"}
                    </td>
                    <td className="report-align-right report-mono">{row.share.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ReportShell>
  );
}

export default CategoryReport;
