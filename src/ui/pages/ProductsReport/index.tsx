import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import ReportShell, { StatTile, useReportPeriod, useToast } from "../../components/reports/ReportShell";
import Pagination from "../../components/common/Pagination";
import {
  byProduct,
  CATEGORIES,
  CATEGORY_COLOR,
  downloadCsv,
  formatNaira,
  linesIn,
  stockStatus,
  unitCostOf,
  type Category,
  type ProductRow,
} from "../../components/reports/reports-data";
import "./index.css";

/**
 * Table-led on purpose: with the full catalog in view the useful operations are
 * ranking and filtering, not shape-reading. The one visual is an inline share
 * bar inside the sales cell, which costs no vertical space and makes the
 * long-tail drop-off legible without a second chart.
 */

type SortKey = "revenue" | "profit" | "units" | "margin" | "transactions" | "name";

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "name", label: "Product", align: "left" },
  { key: "units", label: "Units", align: "right" },
  { key: "transactions", label: "Sales count", align: "right" },
  { key: "revenue", label: "Sales", align: "right" },
  { key: "profit", label: "Gross profit", align: "right" },
  { key: "margin", label: "Margin", align: "right" },
];

function marginOf(row: ProductRow): number {
  return row.revenue === 0 ? 0 : (row.profit / row.revenue) * 100;
}

function ProductsReport() {
  const { preset, setPreset, period, compare } = useReportPeriod("30d");
  const { toast, flash } = useToast();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const lines = useMemo(() => linesIn(period), [period]);
  const allRows = useMemo(() => byProduct(lines), [lines]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (!q) return true;
      return (
        row.product.name.toLowerCase().includes(q) ||
        row.product.id.toLowerCase().includes(q) ||
        row.product.form.toLowerCase().includes(q)
      );
    });
  }, [allRows, query, category]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      let diff: number;
      if (sortKey === "name") diff = a.product.name.localeCompare(b.product.name);
      else if (sortKey === "margin") diff = marginOf(a) - marginOf(b);
      else diff = (a[sortKey] as number) - (b[sortKey] as number);
      return descending ? -diff : diff;
    });
    return rows;
  }, [filtered, sortKey, descending]);

  const maxRevenue = Math.max(1, ...sorted.map((r) => r.revenue));
  const pageStart = (Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize))) - 1) * pageSize;
  const pageRows = sorted.slice(pageStart, pageStart + pageSize);

  const sellingCount = allRows.filter((r) => r.units > 0).length;
  const noSales = allRows.filter((r) => r.units === 0);
  const bestMargin = [...allRows].filter((r) => r.revenue > 0).sort((a, b) => marginOf(b) - marginOf(a))[0];
  const totalRevenue = allRows.reduce((s, r) => s + r.revenue, 0);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDescending((d) => !d);
    } else {
      setSortKey(key);
      setDescending(key !== "name");
    }
    setPage(1);
  }

  function handleExport() {
    const rows = sorted.map((row) => [
      row.product.id,
      row.product.name,
      row.category,
      row.product.form,
      String(row.units),
      String(row.transactions),
      row.revenue.toFixed(2),
      row.profit.toFixed(2),
      marginOf(row).toFixed(1) + "%",
      row.share.toFixed(1) + "%",
      String(row.product.stock),
    ]);
    downloadCsv(
      "products-report",
      [
        "Product ID",
        "Product",
        "Category",
        "Form",
        "Units",
        "Sales count",
        "Sales",
        "Gross profit",
        "Margin",
        "Share",
        "Stock on hand",
      ],
      rows,
    );
    flash("Exported " + rows.length + " product" + (rows.length === 1 ? "" : "s") + " to CSV");
  }

  return (
    <ReportShell
      title="Products Report"
      subtitle="Every product ranked by what it actually sells"
      preset={preset}
      onPresetChange={setPreset}
      period={period}
      compare={compare}
      onExport={handleExport}
      toast={toast}
      controls={
        <>
          <label className="pr-search">
            <Search className="pr-search-icon" />
            <input
              type="search"
              value={query}
              placeholder="Search products"
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            className="pr-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category | "all");
              setPage(1);
            }}
            aria-label="Category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </>
      }
    >
      <div className="report-tiles">
        <StatTile label="Products sold" value={sellingCount + " of " + allRows.length} note="had at least one sale" />
        <StatTile label="Total sales" value={formatNaira(totalRevenue)} note="across all products" />
        <StatTile
          label="Best margin"
          value={bestMargin ? marginOf(bestMargin).toFixed(1) + "%" : "—"}
          note={bestMargin ? bestMargin.product.name : "No sales this period"}
        />
        <StatTile
          label="No sales"
          value={String(noSales.length)}
          note={noSales.length === 0 ? "every product moved" : noSales.map((r) => r.product.name).join(", ")}
        />
      </div>

      <section className="report-card">
        <div className="report-card-head">
          <span className="report-card-title">Product performance</span>
          <span className="report-card-note">
            {sorted.length} product{sorted.length === 1 ? "" : "s"} matching
          </span>
        </div>

        {pageRows.length === 0 ? (
          <div className="report-empty">No products match these filters.</div>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table pr-table">
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} className={col.align === "right" ? "report-align-right" : undefined}>
                      <button type="button" className="report-sort-btn" onClick={() => toggleSort(col.key)}>
                        {col.label}
                        {sortKey === col.key &&
                          (descending ? (
                            <ArrowDown className="report-sort-icon" />
                          ) : (
                            <ArrowUp className="report-sort-icon" />
                          ))}
                      </button>
                    </th>
                  ))}
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const status = stockStatus(row.product.stock);
                  return (
                    <tr key={row.product.id}>
                      <td>
                        <span className="pr-product">
                          <span
                            className="pr-product-dot"
                            style={{ background: CATEGORY_COLOR[row.category] }}
                            title={row.category}
                          />
                          <span className="pr-product-text">
                            <strong>{row.product.name}</strong>
                            <span>
                              {row.product.form} · cost {formatNaira(unitCostOf(row.product.id))}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="report-align-right report-mono">{row.units.toLocaleString()}</td>
                      <td className="report-align-right report-mono">{row.transactions.toLocaleString()}</td>
                      <td className="report-align-right">
                        <span className="pr-sales">
                          <span className="pr-sales-value report-mono">{formatNaira(row.revenue)}</span>
                          {/* Share bar sits inside the cell — ranking context without a second chart. */}
                          <span className="pr-bar">
                            <span
                              className="pr-bar-fill"
                              style={{
                                width: (row.revenue / maxRevenue) * 100 + "%",
                                background: CATEGORY_COLOR[row.category],
                              }}
                            />
                          </span>
                        </span>
                      </td>
                      <td className="report-align-right report-mono">{formatNaira(row.profit)}</td>
                      <td className="report-align-right report-mono">
                        {row.revenue === 0 ? "—" : marginOf(row).toFixed(1) + "%"}
                      </td>
                      <td>
                        <span className={"pr-stock pr-stock--" + status.replace(/\s+/g, "-").toLowerCase()}>
                          {row.product.stock} · {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          pageSize={pageSize}
          total={sorted.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          noun="products"
        />
      </section>
    </ReportShell>
  );
}

export default ProductsReport;
