import { Building2, Check, Globe } from "lucide-react";
import { ROLES, roleById, type Role, type RoleId } from "../users-data";
import "./index.css";

/**
 * The two controls that make up "access", kept as separate ideas on purpose:
 * the role says *what* someone may do, the branch scope says *where*. They
 * live in one file because they are always used together and share a
 * stylesheet — the same reason StatTile sits inside ReportShell.
 */

/* ------------------------------------------------------------------ *
 * Role summary
 * ------------------------------------------------------------------ */

/**
 * Plain-language "can / cannot" for a role. Shown wherever a role is being
 * chosen, so the decision is made on consequences rather than on the
 * permission matrix — which is deliberately not exposed during user creation.
 */
export function RoleSummary({ role }: { role: Role }) {
  return (
    <div className="access-summary">
      <strong>{role.name}</strong>
      <p className="access-summary-can">{role.can}</p>
      <p className="access-summary-cannot">{role.cannot}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Role select
 * ------------------------------------------------------------------ */

export function RoleField({
  value,
  onChange,
  label = "Role",
}: {
  value: RoleId;
  onChange: (roleId: RoleId) => void;
  label?: string;
}) {
  return (
    <label className="panel-field">
      <span className="panel-label">{label}</span>
      <select
        className="panel-input"
        value={value}
        onChange={(e) => onChange(e.target.value as RoleId)}
      >
        {ROLES.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Branch scope
 * ------------------------------------------------------------------ */

interface BranchScopeFieldProps {
  roleId: RoleId;
  value: string[];
  onChange: (branchIds: string[]) => void;
  branches: { id: string; name: string; city: string }[];
}

/**
 * Branch access, shaped by the role rather than by a generic checkbox list.
 *
 * This is what keeps the two-level model from leaking onto the user: nobody
 * has to know that "Pharmacy Administrator is pharmacy-wide" — the control
 * simply doesn't offer a choice there, and says why. A Branch Manager picks
 * exactly one location because managing two branches is a different job;
 * everyone else gets a multi-select.
 */
export function BranchScopeField({ roleId, value, onChange, branches }: BranchScopeFieldProps) {
  const role = roleById(roleId);

  if (role.scope === "all") {
    return (
      <div className="panel-field">
        <span className="panel-label">Branch access</span>
        <div className="access-all">
          <Globe className="access-all-icon" />
          <span className="access-all-text">
            <strong>All branches</strong>
            <small>{role.name}s work across the whole pharmacy, including new branches.</small>
          </span>
        </div>
      </div>
    );
  }

  if (role.scope === "single") {
    return (
      <div className="panel-field">
        <span className="panel-label">
          Branch <em>a {role.name.toLowerCase()} runs one location</em>
        </span>
        <div className="access-options">
          {branches.map((branch) => (
            <button
              key={branch.id}
              type="button"
              className={
                "access-option" + (value[0] === branch.id ? " access-option--on" : "")
              }
              aria-pressed={value[0] === branch.id}
              onClick={() => onChange([branch.id])}
            >
              <Building2 className="access-option-icon" />
              <span className="access-option-text">
                <strong>{branch.name}</strong>
                <small>{branch.city}</small>
              </span>
              {value[0] === branch.id && <Check className="access-option-check" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel-field">
      <span className="panel-label">
        Branch access <em>where they can work</em>
      </span>
      <div className="access-options">
        {branches.map((branch) => {
          const on = value.includes(branch.id);
          return (
            <button
              key={branch.id}
              type="button"
              className={"access-option" + (on ? " access-option--on" : "")}
              aria-pressed={on}
              onClick={() =>
                onChange(on ? value.filter((id) => id !== branch.id) : [...value, branch.id])
              }
            >
              <Building2 className="access-option-icon" />
              <span className="access-option-text">
                <strong>{branch.name}</strong>
                <small>{branch.city}</small>
              </span>
              {on && <Check className="access-option-check" />}
            </button>
          );
        })}
      </div>
      {value.length === 0 && (
        <span className="access-warning">
          With no branch selected they can sign in but won't see any location.
        </span>
      )}
    </div>
  );
}
