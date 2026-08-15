import { Link, Navigate, useParams } from "react-router-dom";
import { Check, CircleSlash, Lock, ShieldQuestion } from "lucide-react";
import UsersShell from "../../components/users/UsersShell";
import { useUsers } from "../../context/UsersContext";
import { useSettings } from "../../context/SettingsContext";
import {
  PERMISSION_GROUPS,
  ROLES,
  initialsOf,
  levelFor,
  scopeLabel,
  type PermissionLevel,
} from "../../components/users/users-data";
import "./index.css";

/**
 * A role page explains permissions rather than just listing them: the
 * plain-language "can / cannot" comes first, and the matrix below is the
 * detail for whoever wants to audit it.
 *
 * Three states, not two. "With approval" is a real answer — a pharmacist may
 * refund a sale, but a manager has to sign it off — and flattening it to a
 * tick or a dash would describe a pharmacy that doesn't exist.
 *
 * The matrix is read-only. Making it editable would imply enforcement that
 * isn't built; that arrives with custom roles.
 */

const LEVEL_LABEL: Record<PermissionLevel, string> = {
  yes: "Allowed",
  approval: "With approval",
  no: "Not allowed",
};

function LevelMark({ level }: { level: PermissionLevel }) {
  return (
    <span className={"rd-mark rd-mark--" + level} title={LEVEL_LABEL[level]}>
      {level === "yes" && <Check className="rd-mark-icon" />}
      {level === "approval" && <ShieldQuestion className="rd-mark-icon" />}
      {level === "no" && <CircleSlash className="rd-mark-icon" />}
      <span className="rd-mark-text">{LEVEL_LABEL[level]}</span>
    </span>
  );
}

function RoleDetail() {
  const { roleId } = useParams();
  const { users } = useUsers();
  const { branches } = useSettings();

  const role = ROLES.find((r) => r.id === roleId);
  if (!role) return <Navigate to="/dashboard/users-roles/roles" replace />;

  const holders = users.filter((u) => u.roleId === role.id);

  return (
    <UsersShell
      title={role.name}
      subtitle={role.summary}
      backTo="/dashboard/users-roles/roles"
      backLabel="Roles & Permissions"
      controls={
        <span className="panel-pill">
          <Lock className="rd-lock" />
          System role
        </span>
      }
    >
      <section className="panel-card">
        <div className="panel-card-body rd-overview">
          <p className="rd-can">{role.can}</p>
          <p className="rd-cannot">{role.cannot}</p>

          <div className="rd-scope">
            <strong>Branch scope</strong>
            <span>
              {role.scope === "all"
                ? "Pharmacy-wide. Reaches every branch, including ones added later."
                : role.scope === "single"
                  ? "One branch. Assigned to a single location."
                  : "Selected branches. Can be given access to any number of locations."}
            </span>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Permissions</h2>
            <p>What this role can do anywhere it has branch access.</p>
          </div>
          <div className="rd-legend">
            <span className="rd-legend-item">
              <span className="rd-dot rd-dot--yes" />
              Allowed
            </span>
            <span className="rd-legend-item">
              <span className="rd-dot rd-dot--approval" />
              With approval
            </span>
            <span className="rd-legend-item">
              <span className="rd-dot rd-dot--no" />
              Not allowed
            </span>
          </div>
        </div>

        <div className="rd-groups">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.id} className="rd-group">
              <h3>{group.label}</h3>
              <ul>
                {group.permissions.map((permission) => {
                  const level = levelFor(role.id, permission.id);
                  return (
                    <li key={permission.id} className={"rd-perm rd-perm--" + level}>
                      <span>{permission.label}</span>
                      <LevelMark level={level} />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Who has this role</h2>
            <p>
              {holders.length === 0
                ? "Nobody currently holds this role."
                : holders.length + (holders.length === 1 ? " person" : " people")}
            </p>
          </div>
        </div>

        {holders.length > 0 && (
          <div className="panel-rows">
            {holders.map((user) => (
              <Link
                key={user.id}
                to={"/dashboard/users-roles/users/" + user.id}
                className="panel-row rd-holder"
              >
                <span className="rd-holder-left">
                  <span className="rd-holder-avatar">{initialsOf(user.name)}</span>
                  <span className="panel-row-text">
                    <strong>{user.name}</strong>
                    <small>{scopeLabel(user, branches)}</small>
                  </span>
                </span>
                <span
                  className={
                    "panel-pill " +
                    (user.status === "Active" ? "panel-pill--on" : "panel-pill--off")
                  }
                >
                  {user.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </UsersShell>
  );
}

export default RoleDetail;
