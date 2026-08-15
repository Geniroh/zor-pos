import { useId } from "react";
import "./index.css";

/**
 * The app's on/off switch. Built on a real checkbox input rather than a
 * `role="switch"` button so it is keyboard- and form-native for free; the
 * visible track and knob are drawn from the input's `:checked` state.
 *
 * Introduced for Settings, which is the first section built mostly out of
 * booleans. Anything else needing a toggle should use this rather than hand-
 * rolling another one.
 */

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible text. Omit when the row already labels the control, and pass `ariaLabel`. */
  label?: string;
  hint?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

function Switch({ checked, onChange, label, hint, ariaLabel, disabled = false }: SwitchProps) {
  const id = useId();

  return (
    <label className={"switch" + (disabled ? " switch--disabled" : "")} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="switch-input"
        checked={checked}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-knob" />
      </span>
      {(label || hint) && (
        <span className="switch-text">
          {label && <strong>{label}</strong>}
          {hint && <small>{hint}</small>}
        </span>
      )}
    </label>
  );
}

export default Switch;
