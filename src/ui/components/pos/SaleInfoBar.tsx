import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CUSTOMERS } from "./pos-data";
import "./SaleInfoBar.css";

interface SaleInfoBarProps {
  customer: string;
  onSelectCustomer: (name: string) => void;
  saleDate: string;
  servedBy: string;
  invoiceNo: string;
}

function SaleInfoBar({ customer, onSelectCustomer, saleDate, servedBy, invoiceNo }: SaleInfoBarProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="sale-info-bar">
      <div className="sale-info-field" ref={rootRef}>
        <span className="sale-info-label">Customer</span>
        <div className="sale-info-dropdown">
          <button
            type="button"
            className="sale-info-trigger"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="sale-info-trigger-text">{customer}</span>
            <ChevronDown className="sale-info-chevron" />
          </button>
          {open && (
            <div className="sale-info-menu" role="menu">
              {CUSTOMERS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  role="menuitem"
                  className="sale-info-menu-item"
                  onClick={() => {
                    onSelectCustomer(c.name);
                    setOpen(false);
                  }}
                >
                  <span>{c.name}</span>
                  <span className="sale-info-menu-item-phone">{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sale-info-field">
        <span className="sale-info-label">Sale date</span>
        <div className="sale-info-static">{saleDate}</div>
      </div>

      <div className="sale-info-field">
        <span className="sale-info-label">Served by</span>
        <div className="sale-info-static">{servedBy}</div>
      </div>

      <div className="sale-info-field">
        <span className="sale-info-label">Invoice no</span>
        <div className="sale-info-static sale-info-static--between">
          <span>{invoiceNo}</span>
          <span className="sale-info-auto">Auto</span>
        </div>
      </div>
    </div>
  );
}

export default SaleInfoBar;
