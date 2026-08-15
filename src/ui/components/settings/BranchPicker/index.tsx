import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Store } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext";
import "./index.css";

/**
 * Picks which branch a branch-level settings screen is editing.
 *
 * This is how Settings resolves the pharmacy-level / branch-level split without
 * making the user learn it: instead of labelling sections "branch settings",
 * the screens that happen to be per-branch simply say whose they are and let
 * you switch. Pharmacy-level screens (Profile, Preferences, Billing) render no
 * picker at all, so the distinction is felt rather than explained.
 *
 * Deliberately separate from the sidebar's BranchSelector, which stays
 * cosmetic — see CLAUDE.md. This one drives real state via SettingsContext.
 */

interface BranchPickerProps {
  /** Prefix before the branch name, e.g. "Hours for". */
  label: string;
}

function BranchPicker({ label }: BranchPickerProps) {
  const { branches, activeBranchId, setActiveBranchId, activeBranch } = useSettings();
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
    <div className="branch-picker" ref={rootRef}>
      <button
        type="button"
        className="branch-picker-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Store className="branch-picker-icon" />
        <span className="branch-picker-label">{label}:</span>
        <strong>{activeBranch.name}</strong>
        <ChevronDown className="branch-picker-chevron" />
      </button>

      {open && (
        <div className="branch-picker-menu" role="listbox">
          {branches.map((branch) => (
            <button
              key={branch.id}
              type="button"
              role="option"
              aria-selected={branch.id === activeBranchId}
              className={
                "branch-picker-item" +
                (branch.id === activeBranchId ? " branch-picker-item--active" : "")
              }
              onClick={() => {
                setActiveBranchId(branch.id);
                setOpen(false);
              }}
            >
              <span className="branch-picker-item-text">
                <strong>{branch.name}</strong>
                <small>{branch.city}</small>
              </span>
              {branch.id === activeBranchId && <Check className="branch-picker-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default BranchPicker;
