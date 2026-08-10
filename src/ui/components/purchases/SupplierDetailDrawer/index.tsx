import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { formatNaira } from "../../pos/pos-data";
import { outstandingBalance, type PurchaseHistoryRecord } from "../purchase-history-data";
import "./index.css";

export interface SupplierStats {
  id: string;
  name: string;
  contact: string;
  phone: string;
  totalSpend: number;
  orders: number;
  avgOrderValue: number;
  outstanding: number;
}

interface SupplierDetailDrawerProps {
  supplier: SupplierStats;
  records: PurchaseHistoryRecord[];
  onClose: () => void;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SupplierDetailDrawer({ supplier, records, onClose }: SupplierDetailDrawerProps) {
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
    <div className="supplier-detail-drawer open" ref={panelRef}>
      <div className="supplier-detail-header">
        <div>
          <h2>{supplier.name}</h2>
          <span className="supplier-detail-id">{supplier.id}</span>
        </div>
        <button type="button" className="supplier-detail-close" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>

      <div className="supplier-detail-body">
        <div className="supplier-detail-stats">
          <div className="supplier-detail-stat">
            <span className="supplier-detail-stat-label">Total spend</span>
            <span className="supplier-detail-stat-value">{formatNaira(supplier.totalSpend)}</span>
          </div>
          <div className="supplier-detail-stat">
            <span className="supplier-detail-stat-label">Orders</span>
            <span className="supplier-detail-stat-value">{supplier.orders}</span>
          </div>
          <div className="supplier-detail-stat">
            <span className="supplier-detail-stat-label">Avg order</span>
            <span className="supplier-detail-stat-value">{formatNaira(supplier.avgOrderValue)}</span>
          </div>
          <div className="supplier-detail-stat">
            <span className="supplier-detail-stat-label">Outstanding</span>
            <span className="supplier-detail-stat-value supplier-detail-stat-value--warning">
              {formatNaira(supplier.outstanding)}
            </span>
          </div>
        </div>

        <div className="supplier-detail-rows">
          <div className="supplier-detail-row">
            <span>Contact person</span>
            <span>{supplier.contact}</span>
          </div>
          <div className="supplier-detail-row">
            <span>Phone</span>
            <span>{supplier.phone}</span>
          </div>
        </div>

        <div className="supplier-detail-orders">
          <span className="supplier-detail-orders-label">Order history</span>
          {records.length === 0 ? (
            <div className="supplier-detail-empty">No orders recorded for this supplier yet.</div>
          ) : (
            <div className="supplier-detail-order-list">
              {records.map((r) => (
                <div key={r.id} className="supplier-detail-order">
                  <div className="supplier-detail-order-main">
                    <span className="supplier-detail-order-id">{r.id}</span>
                    <span className="supplier-detail-order-date">{formatDate(r.dateTime)}</span>
                  </div>
                  <div className="supplier-detail-order-amounts">
                    <span className="supplier-detail-order-total">{formatNaira(r.total)}</span>
                    <span
                      className={
                        "supplier-detail-order-status supplier-detail-order-status--" + r.status.toLowerCase()
                      }
                    >
                      {r.status}
                      {outstandingBalance(r) > 0 ? ` · ${formatNaira(outstandingBalance(r))} owed` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupplierDetailDrawer;
