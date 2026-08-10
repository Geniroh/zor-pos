import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { AlertCircle, AlertOctagon, AlertTriangle, Clock } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNaira } from "../../components/pos/pos-data";
import { SUPPLIERS, supplierName } from "../../components/purchases/purchases-data";
import {
  AGING_BUCKETS,
  daysOverdue,
  outstandingBalance,
  payables,
  type AgingBucket,
} from "../../components/purchases/purchase-history-data";
import "./index.css";

const PAGE_SIZE = 8;

const BUCKET_META: Record<AgingBucket, { icon: ComponentType<{ className?: string; style?: object }>; color: string; description: string }> = {
  Due: { icon: Clock, color: "var(--chart-status-due)", description: "Not yet past due" },
  Outstanding: { icon: AlertCircle, color: "var(--chart-status-outstanding)", description: "1–15 days overdue" },
  Overdue: { icon: AlertTriangle, color: "var(--chart-status-overdue)", description: "16–45 days overdue" },
  Critical: { icon: AlertOctagon, color: "var(--chart-status-critical)", description: "45+ days overdue" },
};

const SUPPLIER_COLORS = [
  "var(--chart-cat-1)",
  "var(--chart-cat-2)",
  "var(--chart-cat-3)",
  "var(--chart-cat-4)",
  "var(--chart-cat-5)",
];

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface BucketTooltipProps {
  active?: boolean;
  payload?: { payload: { bucket: AgingBucket; amount: number; count: number } }[];
}

function BucketTooltip({ active, payload }: BucketTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="ap-tooltip">
      <span className="ap-tooltip-title">{p.bucket}</span>
      <span className="ap-tooltip-value">{formatNaira(p.amount)}</span>
      <span className="ap-tooltip-note">
        {p.count} invoice{p.count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

interface SupplierTooltipProps {
  active?: boolean;
  payload?: { payload: { name: string; balance: number } }[];
}

function SupplierTooltip({ active, payload }: SupplierTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="ap-tooltip">
      <span className="ap-tooltip-title">{p.name}</span>
      <span className="ap-tooltip-value">{formatNaira(p.balance)}</span>
    </div>
  );
}

function AccountsPayable() {
  const [activeBucket, setActiveBucket] = useState<AgingBucket | "all">("all");
  const [page, setPage] = useState(1);

  const allPayables = useMemo(() => payables(), []);

  const bucketData = useMemo(
    () =>
      AGING_BUCKETS.map((bucket) => {
        const records = allPayables.filter((r) => r.bucket === bucket);
        return {
          bucket,
          amount: records.reduce((sum, r) => sum + outstandingBalance(r), 0),
          count: records.length,
        };
      }),
    [allPayables],
  );

  const totalOutstanding = bucketData.reduce((sum, b) => sum + b.amount, 0);
  const overdueCriticalCount = allPayables.filter((r) => r.bucket === "Overdue" || r.bucket === "Critical").length;

  const overdueOnly = allPayables.filter((r) => r.bucket !== "Due");
  const avgDaysOverdue = overdueOnly.length
    ? Math.round(overdueOnly.reduce((sum, r) => sum + daysOverdue(r), 0) / overdueOnly.length)
    : 0;

  const supplierBalances = useMemo(() => {
    return SUPPLIERS.map((s) => ({
      id: s.id,
      name: s.name,
      balance: allPayables
        .filter((r) => r.supplierId === s.id)
        .reduce((sum, r) => sum + outstandingBalance(r), 0),
    })).sort((a, b) => b.balance - a.balance);
  }, [allPayables]);

  const largestExposure = supplierBalances[0];

  function selectBucket(bucket: AgingBucket) {
    setActiveBucket((prev) => (prev === bucket ? "all" : bucket));
    setPage(1);
  }

  const filtered = activeBucket === "all" ? allPayables : allPayables.filter((r) => r.bucket === activeBucket);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="ap-page">
      <div className="ap-header">
        <h1>Accounts Payable</h1>
        <p>Track what&apos;s owed to suppliers, prioritized by urgency.</p>
      </div>

      <div className="ap-overview">
        <div className="ap-donut-card">
          <div className="ap-donut-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={bucketData}
                  dataKey="amount"
                  nameKey="bucket"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {bucketData.map((entry) => (
                    <Cell key={entry.bucket} fill={BUCKET_META[entry.bucket].color} />
                  ))}
                </Pie>
                <Tooltip content={<BucketTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="ap-donut-center">
              <span className="ap-donut-center-label">Outstanding</span>
              <span className="ap-donut-center-value">{formatNaira(totalOutstanding)}</span>
            </div>
          </div>

          <div className="ap-legend">
            {bucketData.map(({ bucket, amount, count }) => {
              const meta = BUCKET_META[bucket];
              const Icon = meta.icon;
              return (
                <button
                  type="button"
                  key={bucket}
                  className={"ap-legend-item" + (activeBucket === bucket ? " ap-legend-item--active" : "")}
                  onClick={() => selectBucket(bucket)}
                >
                  <span className="ap-legend-dot" style={{ background: meta.color }} />
                  <Icon className="ap-legend-icon" style={{ color: meta.color }} />
                  <span className="ap-legend-text">
                    <strong>{bucket}</strong>
                    <span>{meta.description}</span>
                  </span>
                  <span className="ap-legend-amounts">
                    <span className="ap-legend-value">{formatNaira(amount)}</span>
                    <span className="ap-legend-count">
                      {count} invoice{count === 1 ? "" : "s"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="ap-stats">
          <div className="ap-stat">
            <div className="ap-stat-label">Total outstanding</div>
            <div className="ap-stat-value">{formatNaira(totalOutstanding)}</div>
          </div>
          <div className="ap-stat ap-stat--warning">
            <div className="ap-stat-label ap-stat-label--warning">Overdue + Critical</div>
            <div className="ap-stat-value ap-stat-value--warning">{overdueCriticalCount}</div>
            <div className="ap-stat-note ap-stat-note--warning">
              invoice{overdueCriticalCount === 1 ? "" : "s"} need action
            </div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-label">Avg days overdue</div>
            <div className="ap-stat-value">{avgDaysOverdue}</div>
            <div className="ap-stat-note">across unpaid invoices past due</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-label">Largest exposure</div>
            <div className="ap-stat-value">{largestExposure ? formatNaira(largestExposure.balance) : "—"}</div>
            <div className="ap-stat-note">{largestExposure ? largestExposure.name : "No balances owed"}</div>
          </div>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-card-title">Outstanding balance by supplier</div>
        <ResponsiveContainer width="100%" height={Math.max(160, supplierBalances.length * 44)}>
          <BarChart data={supplierBalances} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => formatNaira(v)}
              stroke="var(--chart-axis)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={160}
              stroke="var(--chart-axis)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip cursor={{ fill: "var(--cream)" }} content={<SupplierTooltip />} />
            <Bar dataKey="balance" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {supplierBalances.map((entry, i) => (
                <Cell key={entry.id} fill={SUPPLIER_COLORS[i % SUPPLIER_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ap-card">
        <div className="ap-card-title-row">
          <span className="ap-card-title">Payables</span>
          <div className="ap-filter-tabs">
            <button
              type="button"
              className={"ap-filter-tab" + (activeBucket === "all" ? " ap-filter-tab--active" : "")}
              onClick={() => {
                setActiveBucket("all");
                setPage(1);
              }}
            >
              All
            </button>
            {AGING_BUCKETS.map((bucket) => (
              <button
                key={bucket}
                type="button"
                className={"ap-filter-tab" + (activeBucket === bucket ? " ap-filter-tab--active" : "")}
                onClick={() => selectBucket(bucket)}
              >
                {bucket}
              </button>
            ))}
          </div>
        </div>

        {pageItems.length === 0 ? (
          <div className="ap-empty">No payables match this filter.</div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Due date</th>
                  <th className="ap-align-right">Days</th>
                  <th className="ap-align-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => {
                  const overdue = daysOverdue(r);
                  return (
                    <tr key={r.id}>
                      <td className="ap-mono">{r.id}</td>
                      <td>{supplierName(r.supplierId)}</td>
                      <td className="ap-mono">{formatDate(r.dueDate)}</td>
                      <td className="ap-align-right ap-mono">
                        {overdue > 0 ? `${overdue}d late` : `due in ${-overdue}d`}
                      </td>
                      <td className="ap-align-right ap-mono">{formatNaira(outstandingBalance(r))}</td>
                      <td>
                        <span className={`ap-status ap-status--${r.bucket.toLowerCase()}`}>{r.bucket}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="ap-pagination">
          <span className="ap-pagination-info">
            Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)}{" "}
            of {filtered.length}
          </span>
          <div className="ap-pagination-controls">
            <button
              type="button"
              className="ap-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={"ap-page-btn" + (n === currentPage ? " ap-page-btn--active" : "")}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className="ap-page-btn"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountsPayable;
