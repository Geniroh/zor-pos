import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, Layers, PackageCheck, PackageX, SlidersHorizontal } from "lucide-react";
import { CATALOG, stockStatus, type StockStatus } from "../components/pos/pos-data";
import "./StockLevels.css";

const PAGE_SIZE = 6;
const STATUS_FILTERS: (StockStatus | "All")[] = ["All", "In Stock", "Low Stock", "Out of Stock"];

function StockLevels() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StockStatus | "All">("All");
  const [page, setPage] = useState(1);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateStatus(value: StockStatus | "All") {
    setStatus(value);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((p) => {
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.barcode.includes(q);
      const matchesStatus = status === "All" || stockStatus(p.stock) === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const summary = useMemo(() => {
    const totalUnits = CATALOG.reduce((sum, p) => sum + p.stock, 0);
    const inStock = CATALOG.filter((p) => stockStatus(p.stock) === "In Stock").length;
    const lowStock = CATALOG.filter((p) => stockStatus(p.stock) === "Low Stock").length;
    const outOfStock = CATALOG.filter((p) => stockStatus(p.stock) === "Out of Stock").length;
    return { totalUnits, inStock, lowStock, outOfStock };
  }, []);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="stock-levels-page">
      <div className="stock-levels-header">
        <h1>View Stock Levels</h1>
        <p>Check current stock across your catalog and jump straight to an adjustment.</p>
      </div>

      <div className="stock-levels-summary">
        <div className="stock-levels-tile">
          <div className="stock-levels-tile-icon">
            <Layers className="stock-levels-icon" />
          </div>
          <div>
            <div className="stock-levels-tile-label">Total SKUs</div>
            <div className="stock-levels-tile-value">{CATALOG.length}</div>
          </div>
        </div>
        <div className="stock-levels-tile">
          <div className="stock-levels-tile-icon">
            <Boxes className="stock-levels-icon" />
          </div>
          <div>
            <div className="stock-levels-tile-label">Total units</div>
            <div className="stock-levels-tile-value">{summary.totalUnits.toLocaleString("en-NG")}</div>
          </div>
        </div>
        <div className="stock-levels-tile">
          <div className="stock-levels-tile-icon">
            <PackageCheck className="stock-levels-icon" />
          </div>
          <div>
            <div className="stock-levels-tile-label">In stock</div>
            <div className="stock-levels-tile-value">{summary.inStock}</div>
          </div>
        </div>
        <div className="stock-levels-tile stock-levels-tile--warning">
          <div className="stock-levels-tile-icon">
            <PackageX className="stock-levels-icon" />
          </div>
          <div>
            <div className="stock-levels-tile-label">Low / out of stock</div>
            <div className="stock-levels-tile-value">{summary.lowStock + summary.outOfStock}</div>
          </div>
        </div>
      </div>

      <div className="stock-levels-toolbar">
        <input
          className="stock-levels-search"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          placeholder="Search by name, ID or barcode…"
        />
        <div className="stock-levels-filter-pills">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`stock-levels-pill${status === s ? " stock-levels-pill--active" : ""}`}
              onClick={() => updateStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="stock-levels-table-card">
        {pageItems.length === 0 ? (
          <div className="stock-levels-empty">No products match this filter.</div>
        ) : (
          <table className="stock-levels-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="stock-levels-align-right">Current stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => {
                const productStatus = stockStatus(p.stock);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="stock-levels-name">{p.name}</div>
                      <div className="stock-levels-form">{p.form}</div>
                    </td>
                    <td className="stock-levels-align-right stock-levels-mono">{p.stock}</td>
                    <td>
                      <span
                        className={`stock-levels-status stock-levels-status--${productStatus
                          .toLowerCase()
                          .replace(/ /g, "-")}`}
                      >
                        {productStatus}
                      </span>
                    </td>
                    <td className="stock-levels-align-right">
                      <button
                        type="button"
                        className="stock-levels-adjust-btn"
                        onClick={() =>
                          navigate("/dashboard/inventory/stock-adjustment", {
                            state: { productId: p.id },
                          })
                        }
                      >
                        <SlidersHorizontal className="stock-levels-adjust-icon" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="stock-levels-pagination">
        <span className="stock-levels-pagination-info">
          Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length}
        </span>
        <div className="stock-levels-pagination-controls">
          <button
            type="button"
            className="stock-levels-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`stock-levels-page-btn${n === currentPage ? " stock-levels-page-btn--active" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="stock-levels-page-btn"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockLevels;
