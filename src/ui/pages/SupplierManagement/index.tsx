import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNaira } from "../../components/pos/pos-data";
import { SUPPLIERS, type Supplier } from "../../components/purchases/purchases-data";
import { PURCHASE_HISTORY, outstandingBalance } from "../../components/purchases/purchase-history-data";
import SupplierDetailDrawer, {
  type SupplierStats,
} from "../../components/purchases/SupplierDetailDrawer";
import AddSupplierModal, { type SupplierDraft } from "../../components/purchases/AddSupplierModal";
import "./index.css";

const SUPPLIER_COLORS = [
  "var(--chart-cat-1)",
  "var(--chart-cat-2)",
  "var(--chart-cat-3)",
  "var(--chart-cat-4)",
  "var(--chart-cat-5)",
];

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: { name: string; value: number } }[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="sm-tooltip">
      <span className="sm-tooltip-title">{p.name}</span>
      <span className="sm-tooltip-value">{formatNaira(p.value)}</span>
    </div>
  );
}

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<SupplierStats | null>(null);

  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2400);
  }

  // Color follows the supplier's identity (insertion order), not its rank in any sort.
  const colorById = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach((s, i) => map.set(s.id, SUPPLIER_COLORS[i % SUPPLIER_COLORS.length]));
    return map;
  }, [suppliers]);

  const statsList = useMemo<SupplierStats[]>(() => {
    return suppliers.map((s) => {
      const orders = PURCHASE_HISTORY.filter((r) => r.supplierId === s.id);
      const totalSpend = orders.reduce((sum, r) => sum + r.total, 0);
      const outstanding = orders.reduce((sum, r) => sum + Math.max(0, outstandingBalance(r)), 0);
      return {
        id: s.id,
        name: s.name,
        contact: s.contact,
        phone: s.phone,
        totalSpend,
        orders: orders.length,
        avgOrderValue: orders.length ? totalSpend / orders.length : 0,
        outstanding,
      };
    });
  }, [suppliers]);

  const bySpend = useMemo(
    () => [...statsList].sort((a, b) => b.totalSpend - a.totalSpend),
    [statsList],
  );
  const byOutstanding = useMemo(
    () => [...statsList].sort((a, b) => b.outstanding - a.outstanding),
    [statsList],
  );

  const spendChartData = bySpend.map((s) => ({ id: s.id, name: s.name, value: s.totalSpend }));
  const outstandingChartData = byOutstanding.map((s) => ({ id: s.id, name: s.name, value: s.outstanding }));

  function handleAddSupplier(draft: SupplierDraft) {
    const id = "SUP-" + String(suppliers.length + 1).padStart(3, "0");
    setSuppliers((prev) => [...prev, { id, ...draft }]);
    flash("Supplier added · " + draft.name);
  }

  const selectedRecords = selected ? PURCHASE_HISTORY.filter((r) => r.supplierId === selected.id) : [];

  return (
    <div className="sm-page">
      <div className="sm-header">
        <div>
          <h1>Supplier Management</h1>
          <p>Manage suppliers tied to your purchase orders and compare their performance.</p>
        </div>
        <button type="button" className="sm-add-btn" onClick={() => setAddOpen(true)}>
          <Plus className="sm-add-icon" />
          Add Supplier
        </button>
      </div>

      <div className="sm-charts">
        <div className="sm-card">
          <div className="sm-card-title">Total spend by supplier</div>
          <ResponsiveContainer width="100%" height={Math.max(160, spendChartData.length * 44)}>
            <BarChart data={spendChartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
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
              <Tooltip cursor={{ fill: "var(--cream)" }} content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {spendChartData.map((entry) => (
                  <Cell key={entry.id} fill={colorById.get(entry.id)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sm-card">
          <div className="sm-card-title">Outstanding balance by supplier</div>
          <ResponsiveContainer width="100%" height={Math.max(160, outstandingChartData.length * 44)}>
            <BarChart
              data={outstandingChartData}
              layout="vertical"
              margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
            >
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
              <Tooltip cursor={{ fill: "var(--cream)" }} content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {outstandingChartData.map((entry) => (
                  <Cell key={entry.id} fill={colorById.get(entry.id)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="sm-card">
        <div className="sm-card-title">Supplier directory</div>
        <div className="sm-table-wrap">
          <table className="sm-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Phone</th>
                <th className="sm-align-right">Orders</th>
                <th className="sm-align-right">Total spend</th>
                <th className="sm-align-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {statsList.map((s) => (
                <tr key={s.id} className="sm-row-clickable" onClick={() => setSelected(s)}>
                  <td>
                    <span className="sm-supplier-name">
                      <span className="sm-supplier-dot" style={{ background: colorById.get(s.id) }} />
                      {s.name}
                    </span>
                  </td>
                  <td>{s.contact}</td>
                  <td className="sm-mono">{s.phone}</td>
                  <td className="sm-align-right sm-mono">{s.orders}</td>
                  <td className="sm-align-right sm-mono">{formatNaira(s.totalSpend)}</td>
                  <td className="sm-align-right sm-mono">
                    {s.outstanding > 0 ? formatNaira(s.outstanding) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && <AddSupplierModal onClose={() => setAddOpen(false)} onSubmit={handleAddSupplier} />}

      {selected && (
        <SupplierDetailDrawer supplier={selected} records={selectedRecords} onClose={() => setSelected(null)} />
      )}

      {toast && <div className="sm-toast">{toast}</div>}
    </div>
  );
}

export default SupplierManagement;
