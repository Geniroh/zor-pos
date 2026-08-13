import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Users,
  UserPlus,
  Repeat,
  FolderHeart,
} from "lucide-react";
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
import { formatNaira } from "../../components/pos/pos-data";
import Pagination from "../../components/common/Pagination";
import {
  CARE_CUSTOMERS,
  CARE_PURCHASES,
  formatDate,
  monthLabel,
  type CareCustomer,
  type Gender,
} from "../../components/care/care-data";
import "./index.css";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

type DatePreset = "all" | "30" | "90" | "year";
type SortKey = "name" | "spend" | "last" | "created";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "Any time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year" },
];

const GENDERS: (Gender | "all")[] = ["all", "Male", "Female", "Not specified"];

interface CustomerStats {
  customer: CareCustomer;
  orders: number;
  spend: number;
  lastPurchase: number | null;
}

/**
 * Purchase totals per customer. Computed per mount rather than at module load
 * so customers registered at runtime (New patient) appear on the next visit.
 */
function buildStats(): CustomerStats[] {
  const map = new Map<string, { orders: number; spend: number; last: number }>();
  for (const p of CARE_PURCHASES) {
    if (!p.customerId) continue;
    const entry = map.get(p.customerId) ?? { orders: 0, spend: 0, last: 0 };
    entry.orders += 1;
    entry.spend += p.total;
    entry.last = Math.max(entry.last, p.date);
    map.set(p.customerId, entry);
  }
  return CARE_CUSTOMERS.map((customer) => {
    const e = map.get(customer.id);
    return {
      customer,
      orders: e?.orders ?? 0,
      spend: e?.spend ?? 0,
      lastPurchase: e?.last ?? null,
    };
  });
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: { name: string; value: number; suffix?: string } }[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="cd-tooltip">
      <span className="cd-tooltip-title">{p.name}</span>
      <span className="cd-tooltip-value">{p.suffix ? p.value + p.suffix : formatNaira(p.value)}</span>
    </div>
  );
}

function CustomerDirectory() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<Gender | "all">("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortAsc, setSortAsc] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const stats = useMemo(() => buildStats(), []);

  /* -------------------------------------------------------------- */
  /* Insights                                                        */
  /* -------------------------------------------------------------- */

  // Unique identified customers transacting per month, across the last 12 months.
  const activityByMonth = useMemo(() => {
    const buckets: { key: string; label: string; seen: Set<string>; value: number }[] = [];
    const index = new Map<string, number>();
    const today = new Date();
    for (let back = 11; back >= 0; back--) {
      const d = new Date(today.getFullYear(), today.getMonth() - back, 1);
      const key = d.getFullYear() + "-" + d.getMonth();
      index.set(key, buckets.length);
      buckets.push({ key, label: monthLabel(d.getFullYear(), d.getMonth()), seen: new Set(), value: 0 });
    }
    for (const p of CARE_PURCHASES) {
      if (!p.customerId) continue;
      const d = new Date(p.date);
      const at = index.get(d.getFullYear() + "-" + d.getMonth());
      if (at === undefined) continue;
      buckets[at].seen.add(p.customerId);
    }
    return buckets.map((b) => ({ name: b.label, value: b.seen.size, suffix: " customers" }));
  }, []);

  const peakMonth = useMemo(
    () => activityByMonth.reduce((best, m) => (m.value > best.value ? m : best), activityByMonth[0]),
    [activityByMonth],
  );

  const last30 = useMemo(() => CARE_PURCHASES.filter((p) => p.date >= now - 30 * DAY), []);

  const topCustomers = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of last30) {
      if (!p.customerId) continue;
      map.set(p.customerId, (map.get(p.customerId) ?? 0) + p.total);
    }
    return [...map.entries()]
      .map(([id, value]) => ({
        id,
        name: CARE_CUSTOMERS.find((c) => c.id === id)?.name ?? id,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .reverse(); // recharts stacks vertical bars bottom-up
  }, [last30]);

  const attribution = useMemo(() => {
    let identified = 0;
    let walkIn = 0;
    for (const p of last30) {
      if (p.customerId) identified += p.total;
      else walkIn += p.total;
    }
    return [
      { id: "identified", name: "Identified customers", value: identified },
      { id: "walk-in", name: "Walk-in (unidentified)", value: walkIn },
    ];
  }, [last30]);

  const walkInShare = useMemo(() => {
    const total = attribution[0].value + attribution[1].value;
    return total ? Math.round((attribution[1].value / total) * 100) : 0;
  }, [attribution]);

  const kpis = useMemo(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const newThisMonth = stats.filter((s) => s.customer.createdAt >= startOfMonth).length;
    const withPurchases = stats.filter((s) => s.orders > 0).length;
    const repeat = stats.filter((s) => s.orders > 1).length;
    return {
      total: stats.length,
      newThisMonth,
      repeatRate: withPurchases ? Math.round((repeat / withPurchases) * 100) : 0,
      patients: stats.filter((s) => s.customer.isPatient).length,
    };
  }, [stats]);

  /* -------------------------------------------------------------- */
  /* Table                                                           */
  /* -------------------------------------------------------------- */

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cutoff =
      datePreset === "30"
        ? now - 30 * DAY
        : datePreset === "90"
          ? now - 90 * DAY
          : datePreset === "year"
            ? new Date(new Date().getFullYear(), 0, 1).getTime()
            : 0;

    const filtered = stats.filter(({ customer }) => {
      if (gender !== "all" && customer.gender !== gender) return false;
      if (customer.createdAt < cutoff) return false;
      if (!q) return true;
      // Phone matching ignores spacing so "0803441" finds "0803 441 2290".
      const phone = customer.phone.replace(/\s/g, "");
      return customer.name.toLowerCase().includes(q) || phone.includes(q.replace(/\s/g, ""));
    });

    const dir = sortAsc ? 1 : -1;
    return filtered.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.customer.name.localeCompare(b.customer.name) * dir;
        case "created":
          return (a.customer.createdAt - b.customer.createdAt) * dir;
        case "last":
          return ((a.lastPurchase ?? 0) - (b.lastPurchase ?? 0)) * dir;
        default:
          return (a.spend - b.spend) * dir;
      }
    });
  }, [stats, query, gender, datePreset, sortKey, sortAsc]);

  // Clamped rather than reset, so a filter that shrinks the result set can
  // never strand you on a page that no longer exists.
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize],
  );

  function toggleSort(key: SortKey) {
    setPage(1);
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  }

  function sortIcon(key: SortKey) {
    if (key !== sortKey) return null;
    return sortAsc ? <ChevronUp className="cd-sort-icon" /> : <ChevronDown className="cd-sort-icon" />;
  }

  const filtersActive = query.trim() !== "" || gender !== "all" || datePreset !== "all";

  return (
    <div className="cd-page">
      <nav className="cd-breadcrumb">
        <Link to="/dashboard/customers">Customers &amp; Care</Link>
        <ChevronRight className="cd-crumb-icon" />
        <span>Customer Profile</span>
      </nav>

      <div className="cd-header">
        <div>
          <h1>Customer Profile</h1>
          <p>Everyone who buys from this branch, and what they're worth.</p>
        </div>
      </div>

      <section className="cd-insights">
        <button
          type="button"
          className="cd-insights-toggle"
          onClick={() => setInsightsOpen((prev) => !prev)}
          aria-expanded={insightsOpen}
        >
          {insightsOpen ? <ChevronUp className="cd-toggle-icon" /> : <ChevronDown className="cd-toggle-icon" />}
          Insights
          {!insightsOpen && (
            <span className="cd-insights-peek">
              {kpis.total} customers · {kpis.newThisMonth} new this month · {walkInShare}% walk-in revenue
            </span>
          )}
        </button>

        {insightsOpen && (
          <div className="cd-insights-body">
            <div className="cd-kpis">
              <div className="cd-kpi">
                <span className="cd-kpi-icon cd-kpi-green">
                  <Users className="cd-icon" />
                </span>
                <span className="cd-kpi-text">
                  <strong>{kpis.total}</strong>
                  <span>Total customers</span>
                </span>
              </div>
              <div className="cd-kpi">
                <span className="cd-kpi-icon cd-kpi-blue">
                  <UserPlus className="cd-icon" />
                </span>
                <span className="cd-kpi-text">
                  <strong>{kpis.newThisMonth}</strong>
                  <span>New this month</span>
                </span>
              </div>
              <div className="cd-kpi">
                <span className="cd-kpi-icon cd-kpi-amber">
                  <Repeat className="cd-icon" />
                </span>
                <span className="cd-kpi-text">
                  <strong>{kpis.repeatRate}%</strong>
                  <span>Buy more than once</span>
                </span>
              </div>
              <div className="cd-kpi">
                <span className="cd-kpi-icon cd-kpi-plum">
                  <FolderHeart className="cd-icon" />
                </span>
                <span className="cd-kpi-text">
                  <strong>{kpis.patients}</strong>
                  <span>With a clinical file</span>
                </span>
              </div>
            </div>

            <div className="cd-charts">
              <div className="cd-card">
                <div className="cd-card-title">Customer activity by month</div>
                <div className="cd-card-note">Busiest: {peakMonth?.name} · {peakMonth?.value} customers</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={activityByMonth} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      stroke="var(--chart-axis)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "var(--cream)" }} content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={26}>
                      {activityByMonth.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.name === peakMonth?.name ? "var(--chart-cat-4)" : "var(--chart-cat-1)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="cd-card">
                <div className="cd-card-title">Top customers</div>
                <div className="cd-card-note">By spend · last 30 days</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={topCustomers}
                    layout="vertical"
                    margin={{ left: 8, right: 20, top: 8, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatNaira(v)}
                      stroke="var(--chart-axis)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      stroke="var(--chart-axis)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip cursor={{ fill: "var(--cream)" }} content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20} fill="var(--chart-cat-3)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="cd-card">
                <div className="cd-card-title">Who we can identify</div>
                <div className="cd-card-note">Revenue share · last 30 days</div>
                <div className="cd-donut">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={attribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="none"
                      >
                        <Cell fill="var(--chart-cat-3)" />
                        <Cell fill="var(--chart-cat-2)" />
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="cd-donut-center">
                    <strong>{walkInShare}%</strong>
                    <span>walk-in</span>
                  </div>
                </div>
                <div className="cd-legend">
                  <span>
                    <i style={{ background: "var(--chart-cat-3)" }} /> Identified
                  </span>
                  <span>
                    <i style={{ background: "var(--chart-cat-2)" }} /> Walk-in
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="cd-card cd-table-card">
        <div className="cd-filters">
          <div className="cd-search">
            <Search className="cd-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or phone number"
            />
          </div>

          <label className="cd-select">
            <span>Gender</span>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as Gender | "all");
                setPage(1);
              }}
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g === "all" ? "All" : g}
                </option>
              ))}
            </select>
          </label>

          <label className="cd-select">
            <span>Date created</span>
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

          {filtersActive && (
            <button
              type="button"
              className="cd-clear"
              onClick={() => {
                setQuery("");
                setGender("all");
                setDatePreset("all");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}

          <span className="cd-count">
            {rows.length} of {stats.length}
          </span>
        </div>

        <div className="cd-table-wrap">
          <table className="cd-table">
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => toggleSort("name")}>
                    Customer {sortIcon("name")}
                  </button>
                </th>
                <th>Phone</th>
                <th>Gender</th>
                <th>
                  <button type="button" onClick={() => toggleSort("created")}>
                    Date created {sortIcon("created")}
                  </button>
                </th>
                <th className="cd-align-right">Orders</th>
                <th className="cd-align-right">
                  <button type="button" onClick={() => toggleSort("spend")}>
                    Total spend {sortIcon("spend")}
                  </button>
                </th>
                <th className="cd-align-right">
                  <button type="button" onClick={() => toggleSort("last")}>
                    Last purchase {sortIcon("last")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map(({ customer, orders, spend, lastPurchase }) => (
                <tr
                  key={customer.id}
                  className="cd-row"
                  onClick={() => navigate("/dashboard/customers/" + customer.id)}
                >
                  <td>
                    <span className="cd-name">
                      <span className="cd-avatar">{customer.name.charAt(0)}</span>
                      <span className="cd-name-text">
                        {customer.name}
                        {customer.isPatient && <span className="cd-badge">Patient</span>}
                      </span>
                    </span>
                  </td>
                  <td className="cd-mono">{customer.phone}</td>
                  <td>{customer.gender}</td>
                  <td>{formatDate(customer.createdAt)}</td>
                  <td className="cd-align-right cd-mono">{orders}</td>
                  <td className="cd-align-right cd-mono">{formatNaira(spend)}</td>
                  <td className="cd-align-right">
                    {lastPurchase ? formatDate(lastPurchase) : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="cd-empty">
                    No customer matches those filters.
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
          noun="customers"
        />
      </div>
    </div>
  );
}

export default CustomerDirectory;
