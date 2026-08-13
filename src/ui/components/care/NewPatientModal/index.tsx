import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Gender } from "../care-data";
import "./index.css";

/**
 * Conditionally rendered by its parent (no `open` prop) so Cancel/Escape
 * discards the draft by unmounting — same pattern as DiscountModal.
 */

export interface NewPatientDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: Gender;
  /** null when neither date of birth nor age was given. */
  dob: number | null;
}

interface NewPatientModalProps {
  onClose: () => void;
  onSubmit: (draft: NewPatientDraft) => void;
}

const GENDERS: Gender[] = ["Female", "Male", "Not specified"];

const YEAR = 365.25 * 24 * 60 * 60 * 1000;

function NewPatientModal({ onClose, onSubmit }: NewPatientModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender>("Female");
  // Date of birth is the record we want; age is the fallback for the common
  // case where a walk-in patient knows their age but not their birth date.
  const [ageMode, setAgeMode] = useState<"dob" | "age">("dob");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  function resolveDob(): number | null {
    if (ageMode === "dob") {
      return dob ? new Date(dob + "T00:00").getTime() : null;
    }
    const years = Number(age);
    return Number.isFinite(years) && years > 0 ? Date.now() - years * YEAR : null;
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gender,
      dob: resolveDob(),
    });
    onClose();
  }

  return (
    <div className="np-backdrop" onClick={onClose}>
      <div className="np-modal" onClick={(e) => e.stopPropagation()}>
        <div className="np-header">
          <span className="np-title">
            New patient
            <span className="np-sub">Opens a clinical folder for this person</span>
          </span>
          <button type="button" className="np-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="np-body">
          <div className="np-row">
            <label className="np-field">
              <span className="np-label">First name</span>
              <input
                className="np-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
              />
            </label>
            <label className="np-field">
              <span className="np-label">Last name</span>
              <input className="np-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>

          <div className="np-row">
            <label className="np-field">
              <span className="np-label">
                Phone <em>optional</em>
              </span>
              <input
                className="np-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0803 123 4567"
              />
            </label>
            <label className="np-field">
              <span className="np-label">
                Email <em>optional</em>
              </span>
              <input
                className="np-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@mail.com"
              />
            </label>
          </div>

          <label className="np-field">
            <span className="np-label">Gender</span>
            <div className="np-segmented">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={"np-segment" + (gender === g ? " np-segment-active" : "")}
                  onClick={() => setGender(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </label>

          <div className="np-field">
            <span className="np-label">
              Date of birth <em>optional</em>
            </span>
            <div className="np-age">
              <div className="np-segmented np-segmented-small">
                <button
                  type="button"
                  className={"np-segment" + (ageMode === "dob" ? " np-segment-active" : "")}
                  onClick={() => setAgeMode("dob")}
                >
                  Date of birth
                </button>
                <button
                  type="button"
                  className={"np-segment" + (ageMode === "age" ? " np-segment-active" : "")}
                  onClick={() => setAgeMode("age")}
                >
                  Age
                </button>
              </div>
              {ageMode === "dob" ? (
                <input
                  type="date"
                  className="np-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              ) : (
                <input
                  type="number"
                  min={0}
                  max={120}
                  className="np-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="35"
                />
              )}
            </div>
          </div>
        </div>

        <div className="np-footer">
          <button type="button" className="np-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="np-submit" disabled={!canSubmit} onClick={handleSubmit}>
            Create patient
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewPatientModal;
