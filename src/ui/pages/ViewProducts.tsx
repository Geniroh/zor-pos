import { useMemo, useRef, useState } from "react";
import {
  Boxes,
  Download,
  Layers,
  PackageX,
  ScanLine,
  Search,
} from "lucide-react";
import { CATALOG, formatNaira, stockStatus, type Product } from "../components/pos/pos-data";
import "./ViewProducts.css";

const PAGE_SIZE = 6;

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv(products: Product[]) {
  const header = ["ID", "Name", "Form", "Barcode", "Price", "Stock", "Status", "VAT"];
  const rows = products.map((p) => [
    p.id,
    p.name,
    p.form,
    p.barcode,
    p.price,
    p.stock,
    stockStatus(p.stock),
    p.vat ? "Yes" : "No",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `product-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function ViewProducts() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2200);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function simulateScan() {
    const product = CATALOG[Math.floor(Math.random() * CATALOG.length)];
    updateQuery(product.barcode);
    searchRef.current?.focus();
    flash("Scanned · " + product.name);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.barcode.includes(q),
    );
  }, [query]);

  const summary = useMemo(() => {
    const totalUnits = CATALOG.reduce((sum, p) => sum + p.stock, 0);
    const lowStock = CATALOG.filter((p) => stockStatus(p.stock) === "Low Stock").length;
    const outOfStock = CATALOG.filter((p) => stockStatus(p.stock) === "Out of Stock").length;
    const value = CATALOG.reduce((sum, p) => sum + p.price * p.stock, 0);
    return { totalUnits, lowStock, outOfStock, value };
  }, []);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="view-products-page">
      <div className="view-products-header">
        <h1>View Products</h1>
        <p>Browse, search, and export your product catalog.</p>
      </div>

      <div className="view-products-summary">
        <div className="view-products-tile">
          <div className="view-products-tile-icon">
            <Layers className="view-products-icon" />
          </div>
          <div>
            <div className="view-products-tile-label">Total products</div>
            <div className="view-products-tile-value">{CATALOG.length}</div>
          </div>
        </div>
        <div className="view-products-tile">
          <div className="view-products-tile-icon">
            <Boxes className="view-products-icon" />
          </div>
          <div>
            <div className="view-products-tile-label">Total stock units</div>
            <div className="view-products-tile-value">{summary.totalUnits.toLocaleString("en-NG")}</div>
          </div>
        </div>
        <div className="view-products-tile view-products-tile--warning">
          <div className="view-products-tile-icon">
            <PackageX className="view-products-icon" />
          </div>
          <div>
            <div className="view-products-tile-label">Low / out of stock</div>
            <div className="view-products-tile-value">{summary.lowStock + summary.outOfStock}</div>
          </div>
        </div>
        <div className="view-products-tile">
          <div className="view-products-tile-icon">
            <Download className="view-products-icon" />
          </div>
          <div>
            <div className="view-products-tile-label">Inventory value</div>
            <div className="view-products-tile-value">{formatNaira(summary.value)}</div>
          </div>
        </div>
      </div>

      <div className="view-products-toolbar">
        <div className="view-products-search">
          <Search className="view-products-search-icon" />
          <input
            ref={searchRef}
            className="view-products-search-input"
            placeholder="Search by name, ID or barcode…"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
          />
        </div>
        <button type="button" className="view-products-scan-btn" onClick={simulateScan}>
          <ScanLine className="view-products-btn-icon" />
          Scan
        </button>
        <button
          type="button"
          className="view-products-export-btn"
          onClick={() => exportCsv(filtered)}
        >
          <Download className="view-products-btn-icon" />
          Export CSV
        </button>
      </div>

      <div className="view-products-table-card">
        {pageItems.length === 0 ? (
          <div className="view-products-empty">No products match &quot;{query}&quot;</div>
        ) : (
          <table className="view-products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Barcode</th>
                <th className="view-products-align-right">Price</th>
                <th className="view-products-align-right">Stock</th>
                <th>Status</th>
                <th>VAT</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => {
                const status = stockStatus(p.stock);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="view-products-name">{p.name}</div>
                      <div className="view-products-form">{p.form}</div>
                    </td>
                    <td className="view-products-mono">{p.barcode}</td>
                    <td className="view-products-align-right view-products-mono">{formatNaira(p.price)}</td>
                    <td className="view-products-align-right view-products-mono">{p.stock}</td>
                    <td>
                      <span
                        className={`view-products-status view-products-status--${status
                          .toLowerCase()
                          .replace(/ /g, "-")}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>{p.vat ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="view-products-pagination">
        <span className="view-products-pagination-info">
          Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length}
        </span>
        <div className="view-products-pagination-controls">
          <button
            type="button"
            className="view-products-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`view-products-page-btn${n === currentPage ? " view-products-page-btn--active" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="view-products-page-btn"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {toast && <div className="view-products-toast">{toast}</div>}
    </div>
  );
}

export default ViewProducts;
