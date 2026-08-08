import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Customer } from "./pos-data";
import "./AddCustomerModal.css";

interface AddCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (customer: Customer) => void;
}

const GENDER_OPTIONS = ["Prefer not to say", "Female", "Male", "Other"];

function AddCustomerModal({ open, onClose, onAdd }: AddCustomerModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState(GENDER_OPTIONS[0]);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  function reset() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setGender(GENDER_OPTIONS[0]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function handleSubmit() {
    if (!canSubmit) return;
    onAdd({
      name: `${firstName.trim()} ${lastName.trim()}`,
      phone: phone.trim() || "—",
      email: email.trim() || undefined,
      gender: gender === GENDER_OPTIONS[0] ? undefined : gender,
    });
    reset();
    onClose();
  }

  return (
    <div className="add-customer-backdrop" onClick={handleClose}>
      <div className="add-customer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-customer-header">
          <span className="add-customer-title">Add customer</span>
          <button type="button" className="add-customer-close" onClick={handleClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="add-customer-body">
          <div className="add-customer-row">
            <div className="add-customer-field">
              <span className="add-customer-label">First name</span>
              <input
                className="add-customer-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="add-customer-field">
              <span className="add-customer-label">Last name</span>
              <input className="add-customer-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="add-customer-row">
            <div className="add-customer-field">
              <span className="add-customer-label">Phone number <em>optional</em></span>
              <input className="add-customer-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="add-customer-field">
              <span className="add-customer-label">Email <em>optional</em></span>
              <input
                className="add-customer-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="add-customer-field">
            <span className="add-customer-label">Gender <em>optional</em></span>
            <select className="add-customer-select" value={gender} onChange={(e) => setGender(e.target.value)}>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="add-customer-footer">
          <button type="button" className="add-customer-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button type="button" className="add-customer-submit" disabled={!canSubmit} onClick={handleSubmit}>
            Add customer
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddCustomerModal;
