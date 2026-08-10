import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import type { StockAdjustment } from "../stock-adjustments-data";
import "./index.css";

interface AdjustmentDetailDrawerProps {
  adjustment: StockAdjustment;
  onClose: () => void;
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdjustmentDetailDrawer({ adjustment, onClose }: AdjustmentDetailDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="adjustment-detail-drawer open" ref={panelRef}>
      <div className="adjustment-detail-header">
        <div>
          <h2>{adjustment.product}</h2>
          <span className="adjustment-detail-id">{adjustment.id}</span>
        </div>
        <button type="button" className="adjustment-detail-close" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>

      <div className="adjustment-detail-body">
        <div className="adjustment-detail-stock-change">
          <div className="adjustment-detail-stock-value">
            <span className="adjustment-detail-stock-label">Before</span>
            <span>{adjustment.stockBefore}</span>
          </div>
          <ArrowRight className="adjustment-detail-arrow" />
          <div className="adjustment-detail-stock-value">
            <span className="adjustment-detail-stock-label">After</span>
            <span>{adjustment.stockAfter}</span>
          </div>
        </div>

        <div className="adjustment-detail-rows">
          <div className="adjustment-detail-row">
            <span>Date &amp; time</span>
            <span className="adjustment-detail-mono">{formatDateTime(adjustment.dateTime)}</span>
          </div>
          <div className="adjustment-detail-row">
            <span>Adjustment type</span>
            <span>{adjustment.type}</span>
          </div>
          <div className="adjustment-detail-row">
            <span>Qty change</span>
            <span
              className={`adjustment-detail-mono${
                adjustment.type === "Set count"
                  ? ""
                  : adjustment.qtyChange < 0
                    ? " adjustment-detail-negative"
                    : " adjustment-detail-positive"
              }`}
            >
              {adjustment.type === "Set count" ? "→ " : adjustment.qtyChange > 0 ? "+" : ""}
              {adjustment.qtyChange}
            </span>
          </div>
          <div className="adjustment-detail-row">
            <span>Reason</span>
            <span>{adjustment.reason}</span>
          </div>
          <div className="adjustment-detail-row">
            <span>Adjusted by</span>
            <span>{adjustment.adjustedBy}</span>
          </div>
        </div>

        <div className="adjustment-detail-notes">
          <span className="adjustment-detail-notes-label">Notes</span>
          <p>{adjustment.notes ?? "No notes were recorded for this adjustment."}</p>
        </div>
      </div>
    </div>
  );
}

export default AdjustmentDetailDrawer;
