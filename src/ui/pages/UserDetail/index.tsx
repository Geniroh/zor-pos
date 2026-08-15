import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  Building2,
  KeyRound,
  Mail,
  MonitorSmartphone,
  PauseCircle,
  Phone,
  PlayCircle,
  ShieldCheck,
  UserMinus,
} from "lucide-react";
import UsersShell from "../../components/users/UsersShell";
import ChangeAccessModal from "../../components/users/ChangeAccessModal";
import UserActionModal, { type UserAction } from "../../components/users/UserActionModal";
import { useUsers } from "../../context/UsersContext";
import { useSettings } from "../../context/SettingsContext";
import {
  formatRelative,
  formatUserDate,
  initialsOf,
  roleById,
  scopeLabel,
} from "../../components/users/users-data";
import "./index.css";

/**
 * One user's full record: who they are, what they can do and where, the
 * devices they're signed in on, and the destructive actions.
 *
 * Role and branch access are shown as two separate rows with their own edit
 * buttons — the same separation the table draws, so the model reads the same
 * way wherever you meet it.
 */

function UserDetail() {
  const { userId } = useParams();
  const { users, currentUser, devices, changeRole, setSuspended, removeUser, flash } = useUsers();
  const { branches } = useSettings();

  const [accessMode, setAccessMode] = useState<"role" | "branch" | null>(null);
  const [action, setAction] = useState<UserAction | null>(null);

  const user = users.find((u) => u.id === userId);

  // A removed user (or a hand-typed id) shouldn't render an empty shell.
  if (!user) return <Navigate to="/dashboard/users-roles/users" replace />;

  const role = roleById(user.roleId);
  const isSelf = user.id === currentUser.id;
  const userDevices = devices.filter((d) => d.userId === user.id);

  return (
    <UsersShell
      title={user.name}
      subtitle={role.name + " · " + scopeLabel(user, branches)}
      backTo="/dashboard/users-roles/users"
      backLabel="Users"
      controls={
        <span
          className={
            "panel-pill " + (user.status === "Active" ? "panel-pill--on" : "panel-pill--off")
          }
        >
          {user.status}
        </span>
      }
    >
      <section className="panel-card">
        <div className="ud-identity">
          <span className="ud-avatar">{initialsOf(user.name)}</span>
          <div className="ud-identity-text">
            <strong>{user.name}</strong>
            <span className="ud-line">
              <Mail className="ud-line-icon" />
              {user.email}
            </span>
            <span className="ud-line">
              <Phone className="ud-line-icon" />
              {user.phone || "No phone number"}
            </span>
            <span className="ud-line">
              <ShieldCheck className="ud-line-icon" />
              {user.twoFactorEnabled ? "Two-factor enabled" : "Two-factor not set up"}
            </span>
          </div>
          <div className="ud-joined">
            <small>Joined</small>
            <strong>{formatUserDate(user.joinedAt)}</strong>
            <small>Last active {formatRelative(user.lastActiveAt)}</small>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Access</h2>
            <p>The role says what they can do. The branches say where.</p>
          </div>
        </div>

        <div className="panel-rows">
          <div className="panel-row">
            <span className="panel-row-text">
              <strong>
                <KeyRound className="ud-row-icon" />
                {role.name}
              </strong>
              <small>{role.summary}</small>
            </span>
            <div className="panel-row-control">
              <Link
                to={"/dashboard/users-roles/roles/" + role.id}
                className="panel-btn panel-btn--sm panel-btn--ghost"
              >
                View permissions
              </Link>
              <button
                type="button"
                className="panel-btn panel-btn--sm"
                onClick={() => setAccessMode("role")}
              >
                Change role
              </button>
            </div>
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>
                <Building2 className="ud-row-icon" />
                {scopeLabel(user, branches)}
              </strong>
              <small>
                {role.scope === "all"
                  ? "Pharmacy-wide roles reach every branch, including new ones."
                  : "Where this user can sign in and work."}
              </small>
            </span>
            <div className="panel-row-control">
              <button
                type="button"
                className="panel-btn panel-btn--sm"
                disabled={role.scope === "all"}
                onClick={() => setAccessMode("branch")}
              >
                Change branches
              </button>
            </div>
          </div>

          <div className="panel-row">
            <span className="panel-row-text">
              <strong>Role assigned by</strong>
              <small>{user.roleAssignedBy}</small>
            </span>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Signed-in devices</h2>
            <p>
              {userDevices.length === 0
                ? "No active sessions."
                : userDevices.length + " active " + (userDevices.length === 1 ? "session" : "sessions")}
            </p>
          </div>
          <Link
            to="/dashboard/users-roles/devices"
            className="panel-btn panel-btn--sm panel-btn--ghost"
          >
            Manage devices
          </Link>
        </div>

        {userDevices.length > 0 && (
          <div className="panel-rows">
            {userDevices.map((device) => (
              <div key={device.id} className="panel-row">
                <span className="panel-row-text">
                  <strong>
                    <MonitorSmartphone className="ud-row-icon" />
                    {device.client} · {device.os}
                  </strong>
                  <small>
                    {device.location} · Approx. location · Last active{" "}
                    {formatRelative(device.lastActiveAt)}
                  </small>
                </span>
                {device.current && <span className="panel-pill panel-pill--on">This device</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      {!isSelf && (
        <section className="panel-card ud-danger">
          <div className="panel-rows">
            <div className="panel-row">
              <span className="panel-row-text">
                <strong>
                  {user.status === "Active" ? "Suspend this user" : "Restore this user"}
                </strong>
                <small>
                  {user.status === "Active"
                    ? "They can't sign in until you restore them. Their records are kept."
                    : "They get their role and branches back and can sign in again."}
                </small>
              </span>
              <button
                type="button"
                className={
                  "panel-btn panel-btn--sm" +
                  (user.status === "Active" ? " panel-btn--danger" : "")
                }
                onClick={() => setAction(user.status === "Active" ? "suspend" : "restore")}
              >
                {user.status === "Active" ? <PauseCircle /> : <PlayCircle />}
                {user.status === "Active" ? "Suspend" : "Restore"}
              </button>
            </div>

            <div className="panel-row">
              <span className="panel-row-text">
                <strong>Remove access</strong>
                <small>
                  Permanently removes {user.name.split(" ")[0]} from this pharmacy. You'd have
                  to invite them again.
                </small>
              </span>
              <button
                type="button"
                className="panel-btn panel-btn--sm panel-btn--danger"
                onClick={() => setAction("remove")}
              >
                <UserMinus />
                Remove
              </button>
            </div>
          </div>
        </section>
      )}

      {accessMode && (
        <ChangeAccessModal
          mode={accessMode}
          user={user}
          branches={branches}
          onClose={() => setAccessMode(null)}
          onSave={(roleId, branchIds) => {
            changeRole(user.id, roleId, branchIds);
            flash(user.name + "'s access updated");
          }}
        />
      )}

      {action && (
        <UserActionModal
          action={action}
          user={user}
          branches={branches}
          onClose={() => setAction(null)}
          onConfirm={() => {
            if (action === "remove") {
              removeUser(user.id);
              flash(user.name + " removed from this pharmacy");
            } else {
              setSuspended(user.id, action === "suspend");
              flash(user.name + (action === "suspend" ? " suspended" : " restored"));
            }
          }}
        />
      )}
    </UsersShell>
  );
}

export default UserDetail;
