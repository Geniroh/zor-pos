import { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./index.css";

export interface SupplierDraft {
  name: string;
  contact: string;
  phone: string;
}

interface AddSupplierModalProps {
  onClose: () => void;
  onSubmit: (draft: SupplierDraft) => void;
}

function AddSupplierModal({ onClose, onSubmit }: AddSupplierModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = name.trim().length > 0 && contact.trim().length > 0 && phone.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), contact: contact.trim(), phone: phone.trim() });
    onClose();
  }

  return (
    <div className="add-supplier-backdrop" onClick={onClose}>
      <div className="add-supplier-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-supplier-header">
          <span className="add-supplier-title">Add supplier</span>
          <button type="button" className="add-supplier-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="add-supplier-body">
          <div className="add-supplier-field">
            <span className="add-supplier-label">Supplier name</span>
            <input className="add-supplier-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="add-supplier-field">
            <span className="add-supplier-label">Contact person</span>
            <input className="add-supplier-input" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="add-supplier-field">
            <span className="add-supplier-label">Phone</span>
            <input className="add-supplier-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="add-supplier-footer">
          <button type="button" className="add-supplier-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="add-supplier-submit" disabled={!canSubmit} onClick={handleSubmit}>
            Add supplier
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddSupplierModal;
