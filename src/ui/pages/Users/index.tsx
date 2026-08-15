import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus } from "lucide-react";
import UsersShell from "../../components/users/UsersShell";
import UserActionsMenu, { type UserMenuAction } from "../../components/users/UserActionsMenu";
import AddUserModal from "../../components/users/AddUserModal";
import ChangeAccessModal from "../../components/users/ChangeAccessModal";
import UserActionModal, { type UserAction } from "../../components/users/UserActionModal";
import { useUsers } from "../../context/UsersContext";
import { useSettings } from "../../context/SettingsContext";
import {
  ROLES,
  formatRelative,
  initialsOf,
  roleById,
  scopeLabel,
  type User,
} from "../../components/users/users-data";
import "./index.css";

/**
 * The users table — the section's centre of gravity, so it's information-dense
 * on purpose: who, what they can do, where they can do it, whether they're
 * active, and when they were last seen, all on one row.
 *
 * Role and access are separate columns rather than one "Branch" column, which
 * is the whole point of the model: the role says what, the access says where.
 */

function Users() {
  const { users, currentUser, changeRole, setSuspended, removeUser, inviteUser, flash } = useUsers();
  const { branches } = useSettings();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [accessTarget, setAccessTarget] = useState<{ user: User; mode: "role" | "branch" } | null>(
    null,
  );
  const [actionTarget, setActionTarget] = useState<{ user: User; action: UserAction } | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.roleId !== roleFilter) return false;
      if (!q) return true;
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        roleById(user.roleId).name.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  function handleAction(user: User, action: UserMenuAction) {
    if (action === "view") navigate(user.id);
    else if (action === "role") setAccessTarget({ user, mode: "role" });
    else if (action === "branch") setAccessTarget({ user, mode: "branch" });
    else setActionTarget({ user, action });
  }

  return (
    <UsersShell
      title="Users"
      subtitle="Staff who have access to your pharmacy."
      backTo="/dashboard/users-roles"
      controls={
        <button
          type="button"
          className="panel-btn panel-btn--primary"
          onClick={() => setAddOpen(true)}
        >
          <UserPlus />
          Add user
        </button>
      }
    >
      <section className="panel-card">
        <div className="panel-card-head users-filters">
          <div className="users-search">
            <Search className="users-search-icon" />
            <input
              className="users-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or role"
              aria-label="Search users"
            />
          </div>

          <select
            className="panel-input users-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            {ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="users-table-wrap">
          <table className="panel-table users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Access</th>
                <th>Status</th>
                <th>Last active</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => {
                const role = roleById(user.roleId);
                const isSelf = user.id === currentUser.id;

                return (
                  <tr
                    key={user.id}
                    className="users-row"
                    onClick={() => navigate(user.id)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(user.id);
                    }}
                  >
                    <td>
                      <div className="users-identity">
                        <span className="users-avatar">{initialsOf(user.name)}</span>
                        <span className="users-identity-text">
                          <strong>
                            {user.name}
                            {isSelf && <span className="users-you">You</span>}
                          </strong>
                          <small>{user.email}</small>
                        </span>
                      </div>
                    </td>
                    <td className="users-role">{role.name}</td>
                    <td className="users-access">{scopeLabel(user, branches)}</td>
                    <td>
                      <span
                        className={
                          "panel-pill " +
                          (user.status === "Active" ? "panel-pill--on" : "panel-pill--off")
                        }
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="users-last-active">{formatRelative(user.lastActiveAt)}</td>
                    {/* The row navigates; the menu must not navigate with it. */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <UserActionsMenu
                        label={user.name}
                        suspended={user.status === "Suspended"}
                        isSelf={isSelf}
                        onAction={(action) => handleAction(user, action)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {visible.length === 0 && (
            <p className="users-empty">No users match that search.</p>
          )}
        </div>
      </section>

      {addOpen && (
        <AddUserModal
          branches={branches}
          onClose={() => setAddOpen(false)}
          onInvite={(input) => {
            inviteUser(input);
            flash("Invitation sent to " + input.email);
          }}
        />
      )}

      {accessTarget && (
        <ChangeAccessModal
          mode={accessTarget.mode}
          user={accessTarget.user}
          branches={branches}
          onClose={() => setAccessTarget(null)}
          onSave={(roleId, branchIds) => {
            changeRole(accessTarget.user.id, roleId, branchIds);
            flash(accessTarget.user.name + "'s access updated");
          }}
        />
      )}

      {actionTarget && (
        <UserActionModal
          action={actionTarget.action}
          user={actionTarget.user}
          branches={branches}
          onClose={() => setActionTarget(null)}
          onConfirm={() => {
            const { user, action } = actionTarget;
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

export default Users;
