import { ChevronLeft, ChevronRight } from "lucide-react";
import "./index.css";

/**
 * Shared pager for the app's long tables. Owns no state — the parent keeps
 * `page` next to its filters so resetting to page 1 on a filter change stays
 * the parent's call.
 */

interface PaginationProps {
  /** 1-based. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  /** What's being counted, for the "Showing 1–20 of 62 customers" label. */
  noun?: string;
}

const PAGE_SIZES = [10, 20, 50];

/** Page numbers to render, with -1 standing in for a gap. */
function pageWindow(page: number, pageCount: number): number[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  if (page <= 4) return [1, 2, 3, 4, 5, -1, pageCount];
  if (page >= pageCount - 3) {
    return [1, -1, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, -1, page - 1, page, page + 1, -1, pageCount];
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  noun = "rows",
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const first = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, total);

  return (
    <div className="pager">
      <span className="pager-summary">
        {total === 0 ? "No " + noun : "Showing " + first + "–" + last + " of " + total + " " + noun}
      </span>

      {onPageSizeChange && (
        <label className="pager-size">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="pager-controls">
        <button
          type="button"
          className="pager-arrow"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="pager-icon" />
        </button>

        {pageWindow(current, pageCount).map((p, i) =>
          p === -1 ? (
            <span key={"gap-" + i} className="pager-gap">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={"pager-page" + (p === current ? " pager-page-active" : "")}
              onClick={() => onPageChange(p)}
              aria-current={p === current ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className="pager-arrow"
          disabled={current >= pageCount}
          onClick={() => onPageChange(current + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="pager-icon" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
