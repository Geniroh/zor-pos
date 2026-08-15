import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, UserRound } from "lucide-react";
import { useUsers } from "../../../context/UsersContext";
import { initialsOf } from "../users-data";
import "../../common/panel.css";
import "./index.css";

/**
 * Shell for every Users & Roles screen, including the hub — which is why the
 * back link is optional here but mandatory in SettingsShell.
 *
 * The My Profile button lives in this shell rather than on the hub alone, so
 * it is reachable from all five screens. That is the point of the distinction
 * you drew: everything else in this section manages *other people's* access,
 * and the one control that manages *your own identity* should never be more
 * than one click away, wherever you are in it.
 */

interface UsersShellProps {
  title: string;
  subtitle: string;
  /** Omitted on the hub, which has nowhere above it to go. */
  backTo?: string;
  backLabel?: string;
  /** Controls placed left of the My Profile button. */
  controls?: ReactNode;
  children: ReactNode;
}

function UsersShell({
  title,
  subtitle,
  backTo,
  backLabel = "All sections",
  controls,
  children,
}: UsersShellProps) {
  const { toast, currentUser } = useUsers();
  const { pathname } = useLocation();

  // Suppress the button on the profile screen itself — it would just be a link
  // to the page you are already looking at.
  const onProfile = pathname.endsWith("/users-roles/profile");

  return (
    <div className="users-shell">
      <div className="users-shell-head">
        <div className="users-shell-titles">
          {backTo && (
            <Link to={backTo} className="users-shell-back">
              <ArrowLeft className="users-shell-back-icon" />
              {backLabel}
            </Link>
          )}
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="users-shell-controls">
          {controls}
          {!onProfile && (
            <Link to="/dashboard/users-roles/profile" className="users-profile-btn">
              <span className="users-profile-avatar">{initialsOf(currentUser.name)}</span>
              <span className="users-profile-text">
                My Profile
                <small>{currentUser.name}</small>
              </span>
              <UserRound className="users-profile-icon" />
            </Link>
          )}
        </div>
      </div>

      <div className="users-shell-body">{children}</div>

      {toast && <div className="panel-toast">{toast}</div>}
    </div>
  );
}

export default UsersShell;
