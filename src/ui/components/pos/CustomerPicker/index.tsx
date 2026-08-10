import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, User } from "lucide-react";
import type { Customer } from "../pos-data";
import AddCustomerModal from "../AddCustomerModal";
import "./index.css";

interface CustomerPickerProps {
  customer: string;
  customers: Customer[];
  onSelectCustomer: (name: string) => void;
  onAddCustomer: (customer: Customer) => void;
}

function CustomerPicker({ customer, customers, onSelectCustomer, onAddCustomer }: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
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
    <div className="customer-picker" ref={rootRef}>
      <button
        type="button"
        className="customer-picker-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <User className="customer-picker-icon" />
        <span className="customer-picker-text">{customer}</span>
        <ChevronDown className="customer-picker-chevron" />
      </button>

      {open && (
        <div className="customer-picker-menu" role="menu">
          {customers.map((c) => (
            <button
              key={c.name}
              type="button"
              role="menuitem"
              className="customer-picker-item"
              onClick={() => {
                onSelectCustomer(c.name);
                setOpen(false);
              }}
            >
              <span>{c.name}</span>
              <span className="customer-picker-item-phone">{c.phone}</span>
            </button>
          ))}

          <div className="customer-picker-divider" />

          <button
            type="button"
            className="customer-picker-add"
            onClick={() => {
              setOpen(false);
              setAddOpen(true);
            }}
          >
            <Plus className="customer-picker-add-icon" />
            Add customer
          </button>
        </div>
      )}

      <AddCustomerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(newCustomer) => {
          onAddCustomer(newCustomer);
          onSelectCustomer(newCustomer.name);
        }}
      />
    </div>
  );
}

export default CustomerPicker;
