import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  Info,
  PackageX,
  Receipt,
  ShoppingBasket,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
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
import ReportShell, { ChartTooltip, useReportPeriod, useToast } from "../../components/reports/ReportShell";
import {
  byCategory,
  byPayment,
  byProduct,
  careSeries,
  careTotals,
  categoryOf,
  CATEGORY_COLOR,
  changePct,
  customerMix,
  defaultGranularity,
  downloadCsv,
  formatChange,
  formatCompactNaira,
  formatNaira,
  formatPeriod,
  linesIn,
  precedingPeriod,
  seriesFor,
  stockAlerts,
  totalsFor,
  type Granularity,
  type Period,
} from "../../components/reports/reports-data";
import { useAiAssist } from "../../context/AiAssistContext";
import "./index.css";

/**
 * The Reports overview — the one screen that answers "how is the business
 * doing" without a drill-down. Every card's own dropdown re-slices only that
 * card; the header's date range governs the page. Card scopes are This period
 * / Previous period so a card can be compared against the same window the KPI
 * deltas use, rather than an unrelated arbitrary range.
 */

type CardScope = "current" | "previous";

const SCOPE_OPTIONS: { value: CardScope; label: string }[] = [
  { value: "current", label: "This period" },
  { value: "previous", label: "Previous period" },
];

function ScopeSelect({ value, onChange }: { value: CardScope; onChange: (v: CardScope) => void }) {
  return (
    <select
      className="ro-select"
      value={value}
      onChange={(e) => onChange(e.target.value as CardScope)}
      aria-label="Card period"
    >
      {SCOPE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

interface KpiSpec {
  key: string;
  label: string;
  icon: typeof TrendingUp;
  tint: string;
  color: string;
  value: string;
  change: number | null;
  series: { bucket: number; v: number }[];
}

function ReportsOverview() {
  const { preset, setPreset, period, compare } = useReportPeriod("7d");
  const { toast, flash } = useToast();
  const { openWithExchange } = useAiAssist();

  const [granularity, setGranularity] = useState<Granularity | "auto">("auto");
  const [categoryScope, setCategoryScope] = useState<CardScope>("current");
  const [productScope, setProductScope] = useState<CardScope>("current");
  const [paymentScope, setPaymentScope] = useState<CardScope>("current");
  const [customerScope, setCustomerScope] = useState<CardScope>("current");
  const [careScope, setCareScope] = useState<CardScope>("current");

  const currentLines = useMemo(() => linesIn(period), [period]);
  const previousLines = useMemo(() => linesIn(compare), [compare]);

  const current = useMemo(() => totalsFor(currentLines), [currentLines]);
  const previous = useMemo(() => totalsFor(previousLines), [previousLines]);

  function scoped(scope: CardScope): { lines: typeof currentLines; window: Period } {
    return scope === "current"
      ? { lines: currentLines, window: period }
      : { lines: previousLines, window: compare };
  }

  const resolvedGranularity: Granularity =
    granularity === "auto" ? defaultGranularity(period) : granularity;

  const trend = useMemo(
    () => seriesFor(currentLines, period, resolvedGranularity),
    [currentLines, period, resolvedGranularity],
  );
  const trendPrevious = useMemo(
    () => seriesFor(previousLines, compare, resolvedGranularity),
    [previousLines, compare, resolvedGranularity],
  );

  /** Both periods on one axis: index-aligned, since the windows are equal length. */
  const trendData = useMemo(
    () =>
      trend.map((point, i) => ({
        label: point.label,
        current: point.revenue,
        previous: trendPrevious[i]?.revenue ?? null,
      })),
    [trend, trendPrevious],
  );

  const daily = useMemo(() => seriesFor(currentLines, period, "daily"), [currentLines, period]);

  const kpis: KpiSpec[] = [
    {
      key: "sales",
      label: "Total Sales",
      icon: Banknote,
      tint: "ro-tint-green",
      color: "var(--green)",
      value: formatCompactNaira(current.revenue),
      change: changePct(current.revenue, previous.revenue),
      series: daily.map((d) => ({ bucket: d.bucket, v: d.revenue })),
    },
    {
      key: "profit",
      label: "Gross Profit",
      icon: TrendingUp,
      tint: "ro-tint-green",
      color: "var(--chart-cat-3)",
      value: formatCompactNaira(current.profit),
      change: changePct(current.profit, previous.profit),
      series: daily.map((d) => ({ bucket: d.bucket, v: d.profit })),
    },
    {
      key: "transactions",
      label: "Transactions",
      icon: Receipt,
      tint: "ro-tint-blue",
      color: "var(--chart-cat-1)",
      value: current.transactions.toLocaleString(),
      change: changePct(current.transactions, previous.transactions),
      series: daily.map((d) => ({ bucket: d.bucket, v: d.transactions })),
    },
    {
      key: "basket",
      label: "Average Basket Value",
      icon: ShoppingBasket,
      tint: "ro-tint-plum",
      color: "var(--chart-cat-5)",
      value: formatCompactNaira(current.basket),
      change: changePct(current.basket, previous.basket),
      series: daily.map((d) => ({
        bucket: d.bucket,
        v: d.transactions === 0 ? 0 : d.revenue / d.transactions,
      })),
    },
    {
      key: "customers",
      label: "Active Customers",
      icon: Users,
      tint: "ro-tint-sand",
      color: "var(--chart-cat-4)",
      value: current.customers.toLocaleString(),
      change: changePct(current.customers, previous.customers),
      series: daily.map((d) => ({ bucket: d.bucket, v: d.customers })),
    },
  ];

  const categoryScoped = scoped(categoryScope);
  const categorySlices = useMemo(() => byCategory(categoryScoped.lines), [categoryScoped.lines]);
  const categoryTotal = categorySlices.reduce((s, c) => s + c.revenue, 0);

  const productScoped = scoped(productScope);
  const topProducts = useMemo(
    () => byProduct(productScoped.lines).filter((r) => r.revenue > 0).slice(0, 8),
    [productScoped.lines],
  );

  const paymentScoped = scoped(paymentScope);
  const paymentSlices = useMemo(() => byPayment(paymentScoped.lines), [paymentScoped.lines]);

  const customerScoped = scoped(customerScope);
  const mix = useMemo(
    () => customerMix(customerScoped.lines, customerScoped.window),
    [customerScoped.lines, customerScoped.window],
  );
  const mixData = [
    { key: "new", label: "New Customers", value: mix.newCount, color: "var(--chart-cat-3)" },
    { key: "returning", label: "Returning Customers", value: mix.returningCount, color: "var(--chart-cat-1)" },
  ];
  const mixTotal = mix.newCount + mix.returningCount;

  const careScoped = scoped(careScope);
  const care = useMemo(() => careTotals(careScoped.window), [careScoped.window]);
  // Compare against the window preceding whatever the card is showing — using
  // `compare` unconditionally would report a flat 0% whenever the card itself
  // is scoped to the previous period.
  const carePrevious = useMemo(
    () => careTotals(precedingPeriod(careScoped.window)),
    [careScoped.window],
  );
  const careDaily = useMemo(() => careSeries(careScoped.window), [careScoped.window]);

  const alerts = useMemo(() => stockAlerts(), []);

  const insight = useMemo(() => {
    const top = categorySlices[0];
    const topProduct = topProducts[0];
    const delta = changePct(current.revenue, previous.revenue);
    if (!top || !topProduct) return null;
    return {
      short:
        top.label +
        " drove " +
        top.share.toFixed(1) +
        "% of sales this period, with " +
        topProduct.product.name +
        " the single biggest earner.",
      long:
        "Over " +
        formatPeriod(period) +
        ", total sales came to " +
        formatNaira(current.revenue) +
        " — " +
        formatChange(delta) +
        " against the preceding " +
        formatPeriod(compare) +
        ". " +
        top.label +
        " accounted for " +
        top.share.toFixed(1) +
        "% of revenue (" +
        formatNaira(top.revenue) +
        "), and " +
        topProduct.product.name +
        " alone brought in " +
        formatNaira(topProduct.revenue) +
        " across " +
        topProduct.units +
        " units. Gross margin held at " +
        (current.revenue === 0 ? "0" : ((current.profit / current.revenue) * 100).toFixed(1)) +
        "%. Worth watching: " +
        alerts.lowStock +
        " products are low on stock and " +
        alerts.expiringSoon +
        " are expiring soon — restocking the fast movers among them protects next period's trend.",
    };
  }, [categorySlices, topProducts, current, previous, period, compare, alerts]);

  function openInsights() {
    if (!insight) return;
    openWithExchange({
      contextLabel: "Reports · " + formatPeriod(period),
      prompt: "What stands out in the business performance for this period?",
      response: insight.long,
    });
  }

  function handleExport() {
    const rows = trend.map((point, i) => [
      point.label,
      String(point.revenue.toFixed(2)),
      String(point.profit.toFixed(2)),
      String(point.transactions),
      String(point.units),
      String(trendPrevious[i]?.revenue.toFixed(2) ?? ""),
    ]);
    downloadCsv(
      "reports-overview",
      ["Period", "Sales", "Gross profit", "Transactions", "Units", "Previous period sales"],
      rows,
    );
    flash("Exported " + rows.length + " row" + (rows.length === 1 ? "" : "s") + " to CSV");
  }

  return (
    <ReportShell
      title="Reports"
      subtitle="Overview of your business performance"
      preset={preset}
      onPresetChange={setPreset}
      period={period}
      compare={compare}
      onExport={handleExport}
      toast={toast}
    >
      <div className="ro-kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const up = (kpi.change ?? 0) >= 0;
          return (
            <div key={kpi.key} className="ro-kpi">
              <div className="ro-kpi-head">
                <span className={"ro-kpi-icon " + kpi.tint}>
                  <Icon className="ro-kpi-glyph" />
                </span>
                <span className="ro-kpi-label">{kpi.label}</span>
              </div>
              <div className="ro-kpi-value">{kpi.value}</div>
              <div className={"ro-kpi-delta" + (up ? " ro-kpi-delta--up" : " ro-kpi-delta--down")}>
                {formatChange(kpi.change)}
                <span>vs {formatPeriod(compare)}</span>
              </div>
              <div className="ro-kpi-spark">
                <ResponsiveContainer width="100%" height={44}>
                  <LineChart data={kpi.series} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={kpi.color}
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ro-row ro-row-main">
        <section className="report-card ro-trend">
          <div className="report-card-head">
            <span className="report-card-title">
              Sales Trend
              <span className="ro-hint" title="Revenue per bucket, against the same-length preceding window.">
                <Info className="ro-hint-icon" />
              </span>
            </span>
            <select
              className="ro-select"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity | "auto")}
              aria-label="Trend granularity"
            >
              <option value="auto">Auto</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="ro-trend-legend">
            <span className="ro-trend-key ro-trend-key--current">This period</span>
            <span className="ro-trend-key ro-trend-key--previous">Previous period</span>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="ro-trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--green)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                stroke="var(--chart-axis)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={12}
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
              <Area
                type="monotone"
                dataKey="previous"
                name="Previous"
                stroke="var(--muted)"
                strokeDasharray="4 4"
                strokeWidth={1.4}
                fill="none"
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="current"
                name="This period"
                stroke="var(--green)"
                strokeWidth={2}
                fill="url(#ro-trend-fill)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          <Link to="../sales" className="ro-card-link">
            View sales report <ArrowRight className="ro-card-link-icon" />
          </Link>
        </section>

        <section className="report-card ro-category">
          <div className="report-card-head">
            <span className="report-card-title">Sales by Category</span>
            <ScopeSelect value={categoryScope} onChange={setCategoryScope} />
          </div>

          <div className="ro-donut-row">
            <div className="ro-donut">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categorySlices}
                    dataKey="revenue"
                    nameKey="label"
                    innerRadius="62%"
                    outerRadius="92%"
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {categorySlices.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="ro-donut-center">
                <span className="ro-donut-center-value">{formatCompactNaira(categoryTotal)}</span>
                <span className="ro-donut-center-label">Total</span>
              </div>
            </div>

            <ul className="ro-slice-list">
              {categorySlices.map((slice) => (
                <li key={slice.key}>
                  <span className="ro-slice-dot" style={{ background: slice.color }} />
                  <span className="ro-slice-text">
                    <strong>{slice.label}</strong>
                    <span>
                      {slice.share.toFixed(1)}% ({formatCompactNaira(slice.revenue)})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link to="../categories" className="ro-card-link">
            View category report <ArrowRight className="ro-card-link-icon" />
          </Link>
        </section>

        <div className="ro-right-stack">
          <section className="report-card ro-products">
            <div className="report-card-head">
              <span className="report-card-title">Top Selling Products</span>
              <ScopeSelect value={productScope} onChange={setProductScope} />
            </div>

            {topProducts.length === 0 ? (
              <div className="report-empty">No sales in this period.</div>
            ) : (
              <table className="ro-product-table">
                <thead>
                  <tr>
                    <th />
                    <th>Product</th>
                    <th className="report-align-right">Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((row, i) => (
                    <tr key={row.product.id}>
                      <td className="ro-rank">{i + 1}</td>
                      <td>
                        <span className="ro-product-name">
                          <span
                            className="ro-product-dot"
                            style={{ background: CATEGORY_COLOR[categoryOf(row.product.id)] }}
                          />
                          {row.product.name}
                        </span>
                      </td>
                      <td className="report-align-right report-mono">{formatCompactNaira(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <Link to="../products" className="ro-card-link">
              View all products report <ArrowRight className="ro-card-link-icon" />
            </Link>
          </section>

          <section className="report-card ro-alerts">
            <div className="report-card-head">
              <span className="report-card-title">Stock Alerts</span>
              {/* Display only — Reports summarises stock, it does not manage it. */}
              <span className="report-card-note">Current catalog</span>
            </div>
            <ul className="ro-alert-list">
              <li>
                <span className="ro-alert-icon ro-alert-icon--low">
                  <AlertTriangle className="ro-alert-glyph" />
                </span>
                <span className="ro-alert-label">Low Stock</span>
                <span className="ro-alert-count">{alerts.lowStock} products</span>
              </li>
              <li>
                <span className="ro-alert-icon ro-alert-icon--expiring">
                  <CalendarClock className="ro-alert-glyph" />
                </span>
                <span className="ro-alert-label">Expiring Soon</span>
                <span className="ro-alert-count">{alerts.expiringSoon} products</span>
              </li>
              <li>
                <span className="ro-alert-icon ro-alert-icon--out">
                  <PackageX className="ro-alert-glyph" />
                </span>
                <span className="ro-alert-label">Out of Stock</span>
                <span className="ro-alert-count">{alerts.outOfStock} products</span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className="ro-row ro-row-secondary">
        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">Sales by Payment Method</span>
            <ScopeSelect value={paymentScope} onChange={setPaymentScope} />
          </div>

          <div className="ro-donut-row">
            <div className="ro-donut ro-donut--small">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={paymentSlices}
                    dataKey="revenue"
                    nameKey="label"
                    innerRadius="58%"
                    outerRadius="92%"
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {paymentSlices.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="ro-slice-list">
              {paymentSlices.map((slice) => (
                <li key={slice.key}>
                  <span className="ro-slice-dot" style={{ background: slice.color }} />
                  <span className="ro-slice-text">
                    <strong>{slice.label}</strong>
                    <span>
                      {slice.share.toFixed(1)}% ({formatCompactNaira(slice.revenue)})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link to="../payments" className="ro-card-link">
            View payment report <ArrowRight className="ro-card-link-icon" />
          </Link>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">
              New vs Returning Customers
              <span className="ro-hint" title="New = first attributed purchase falls inside this period.">
                <Info className="ro-hint-icon" />
              </span>
            </span>
            <ScopeSelect value={customerScope} onChange={setCustomerScope} />
          </div>

          <div className="ro-donut-row">
            <div className="ro-donut ro-donut--small">
              <ResponsiveContainer width="100%" height={150}>
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
                    {mixData.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip format={(v) => v + " customers"} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="ro-slice-list">
              {mixData.map((slice) => (
                <li key={slice.key}>
                  <span className="ro-slice-dot" style={{ background: slice.color }} />
                  <span className="ro-slice-text">
                    <strong>{slice.label}</strong>
                    <span>
                      {slice.value} ({mixTotal === 0 ? "0.0" : ((slice.value / mixTotal) * 100).toFixed(1)}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link to="../customers" className="ro-card-link">
            View customer report <ArrowRight className="ro-card-link-icon" />
          </Link>
        </section>

        <section className="report-card">
          <div className="report-card-head">
            <span className="report-card-title">
              Consultations &amp; Follow-ups
              <span className="ro-hint" title="Consultations logged, and follow-ups due in this window that were closed.">
                <Info className="ro-hint-icon" />
              </span>
            </span>
            <ScopeSelect value={careScope} onChange={setCareScope} />
          </div>

          <div className="ro-care-pair">
            <div className="ro-care-stat">
              <span className="ro-care-label">Consultations</span>
              <span className="ro-care-value">{care.consultations}</span>
              <span
                className={
                  "ro-kpi-delta" +
                  ((changePct(care.consultations, carePrevious.consultations) ?? 0) >= 0
                    ? " ro-kpi-delta--up"
                    : " ro-kpi-delta--down")
                }
              >
                {formatChange(changePct(care.consultations, carePrevious.consultations))}
              </span>
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={careDaily} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                  <Line
                    type="monotone"
                    dataKey="consultations"
                    stroke="var(--chart-cat-3)"
                    strokeWidth={1.6}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="ro-care-stat">
              <span className="ro-care-label">Follow-ups Completed</span>
              <span className="ro-care-value">{care.followUpsCompleted}</span>
              <span
                className={
                  "ro-kpi-delta" +
                  ((changePct(care.followUpsCompleted, carePrevious.followUpsCompleted) ?? 0) >= 0
                    ? " ro-kpi-delta--up"
                    : " ro-kpi-delta--down")
                }
              >
                {formatChange(changePct(care.followUpsCompleted, carePrevious.followUpsCompleted))}
              </span>
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={careDaily} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="var(--chart-cat-1)"
                    strokeWidth={1.6}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Link to="../care" className="ro-card-link">
            View care report <ArrowRight className="ro-card-link-icon" />
          </Link>
        </section>
      </div>

      {insight && (
        <div className="ro-insight">
          <span className="ro-insight-icon">
            <Sparkles className="ro-insight-glyph" />
          </span>
          <span className="ro-insight-text">
            <strong>AI Insight</strong>
            <span>{insight.short}</span>
          </span>
          <button type="button" className="ro-insight-btn" onClick={openInsights}>
            <Sparkles className="ro-insight-btn-icon" />
            View full insights
          </button>
        </div>
      )}

      <p className="ro-footnote">
        <Info className="ro-footnote-icon" />
        All amounts are in NGN. Figures cover {formatPeriod(period)} and are compared against{" "}
        {formatPeriod(compare)}.
      </p>
    </ReportShell>
  );
}

export default ReportsOverview;
