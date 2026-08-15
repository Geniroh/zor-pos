import { Link } from "react-router-dom";
import { ChevronRight, Lock } from "lucide-react";
import UsersShell from "../../components/users/UsersShell";
import { useUsers } from "../../context/UsersContext";
import { ROLES, allowedCount } from "../../components/users/users-data";
import "./index.css";

/**
 * Roles are system-defined and read-only in v1 — there is no "create custom
 * role" here, and the permission matrix on each role page is a description,
 * not a form. That keeps the first version honest: a matrix you can edit
 * implies a backend that enforces it, and there isn't one yet.
 *
 * Each row carries how many people currently hold the role, so an admin can
 * see at a glance where the pharmacy's access actually sits.
 */

function Roles() {
  const { users } = useUsers();

  return (
    <UsersShell
      title="Roles & Permissions"
      subtitle="What each role can access and do across your pharmacy."
      backTo="/dashboard/users-roles"
    >
      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>System roles</h2>
            <p>
              Built in and the same for every pharmacy. Custom roles aren't available yet.
            </p>
          </div>
          <span className="panel-pill">
            <Lock className="roles-lock" />
            Read-only
          </span>
        </div>

        <div className="panel-rows">
          {ROLES.map((role) => {
            const holders = users.filter((u) => u.roleId === role.id).length;

            return (
              <Link
                key={role.id}
                to={role.id}
                className="panel-row roles-row"
              >
                <span className="panel-row-text">
                  <strong>{role.name}</strong>
                  <small>{role.summary}</small>
                </span>

                <span className="roles-meta">
                  <span className="roles-scope">
                    {role.scope === "all"
                      ? "All branches"
                      : role.scope === "single"
                        ? "One branch"
                        : "Selected branches"}
                  </span>
                  <span className="roles-count">
                    {holders} {holders === 1 ? "person" : "people"}
                  </span>
                  <span className="roles-perms">{allowedCount(role.id)} permissions</span>
                  <ChevronRight className="roles-arrow" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="roles-note">
        Changing someone's role is done from their user page, not here — a role
        describes a job, and this screen is about what those jobs mean.{" "}
        <Link to="/dashboard/users-roles/users">Go to Users</Link> to reassign
        anyone.
      </p>
    </UsersShell>
  );
}

export default Roles;
