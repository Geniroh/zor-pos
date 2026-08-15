import { useState } from "react";
import { Store } from "lucide-react";
import Modal from "../../common/Modal";
import { MANAGERS } from "../settings-data";

/**
 * Conditionally rendered by its parent rather than taking an `open` prop — the
 * DiscountModal pattern. Its draft fields must start empty on every open, and
 * a fresh mount is the way to get that without setState inside an effect.
 *
 * Carries no stylesheet of its own: the chrome comes from common/Modal and
 * the fields from the shared `.panel-*` primitives.
 */

export interface NewBranchInput {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
}

interface AddBranchModalProps {
  onClose: () => void;
  onCreate: (input: NewBranchInput) => void;
}

function AddBranchModal({ onClose, onCreate }: AddBranchModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [manager, setManager] = useState(MANAGERS[0]);

  // Name and city are the minimum that makes a branch identifiable in the
  // switcher; everything else can be filled in on the branch page.
  const canSubmit = name.trim() !== "" && city.trim() !== "";

  function handleSubmit() {
    if (!canSubmit) return;
    onCreate({
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      phone: phone.trim(),
      email: email.trim(),
      manager,
    });
    onClose();
  }

  return (
    <Modal
      icon={<Store />}
      title="Add branch"
      subtitle="A new location under this pharmacy"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="panel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="panel-btn panel-btn--primary"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Add branch
          </button>
        </>
      }
    >
      <label className="panel-field">
        <span className="panel-label">Branch name</span>
        <input
          className="panel-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Yaba Branch"
          autoFocus
        />
      </label>

      <label className="panel-field">
        <span className="panel-label">Street address</span>
        <input
          className="panel-input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="12 Herbert Macaulay Way"
        />
      </label>

      <div className="panel-grid-2">
        <label className="panel-field">
          <span className="panel-label">City / area</span>
          <input
            className="panel-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Yaba, Lagos"
          />
        </label>

        <label className="panel-field">
          <span className="panel-label">Phone number</span>
          <input
            className="panel-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0803 000 0000"
          />
        </label>
      </div>

      <div className="panel-grid-2">
        <label className="panel-field">
          <span className="panel-label">
            Email <em>optional</em>
          </span>
          <input
            className="panel-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="yaba@zorpill.ng"
          />
        </label>

        <label className="panel-field">
          <span className="panel-label">Branch manager</span>
          <select
            className="panel-input"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
          >
            {MANAGERS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="modal-note">
        The new branch starts on your main branch's opening hours. You can change them,
        and set up its receipt printer, from the branch page.
      </p>
    </Modal>
  );
}

export default AddBranchModal;
