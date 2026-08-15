import { Link } from "react-router-dom";
import { KeyRound, MailPlus, MonitorSmartphone, Users } from "lucide-react";
import UsersShell from "../../components/users/UsersShell";
import { useUsers } from "../../context/UsersContext";
import { ROLES, activeUsers } from "../../components/users/users-data";
import "../../components/common/folder-cards.css";
import "./index.css";

/**
 * Users & Roles hub. Four folder cards, 2×2 — the same shape Customers & Care
 * uses for its four sections, so the app's two "people" sections look alike.
 *
 * My Profile is not one of the cards. It sits in the shell header instead,
 * because it is a different kind of thing: the cards manage other people's
 * access, My Profile manages your own identity. Making it a fifth card would
 * flatten that distinction.
 *
 * Every meta line is derived from live UsersContext state, so suspending
 * someone or cancelling an invitation updates the hub.
 */

function UsersRoles() {
  const { users, invitations, devices, security } = useUsers();

  const active = activeUsers(users).length;
  const pending = invitations.filter((i) => i.status === "Pending").length;

  const sections = [
    {
      icon: Users,
      title: "Users",
      subtitle: "Manage staff who have access to your pharmacy",
      meta: active + (active === 1 ? " active user" : " active users"),
      path: "users",
      tint: "green",
    },
    {
      icon: KeyRound,
      title: "Roles & Permissions",
      subtitle: "Control what different staff members can access and do",
      meta: ROLES.length + " roles",
      path: "roles",
      tint: "navy",
    },
    {
      icon: MailPlus,
      title: "Invitations",
      subtitle: "People who have been invited but haven't joined yet",
      meta:
        pending === 0
          ? "No pending invitations"
          : pending + (pending === 1 ? " pending invitation" : " pending invitations"),
      path: "invitations",
      tint: "sand",
    },
    {
      icon: MonitorSmartphone,
      title: "Devices & Security",
      subtitle: "See where your pharmacy account is being accessed",
      meta:
        devices.length +
        (devices.length === 1 ? " active device · " : " active devices · ") +
        (security.require2fa ? "2FA required" : "2FA optional"),
      path: "devices",
      tint: "plum",
    },
  ];

  return (
    <UsersShell
      title="Users & Roles"
      subtitle="Manage who can access your pharmacy and what they can do."
    >
      <div className="folder-grid users-folders">
        {sections.map(({ icon: Icon, title, subtitle, meta, path, tint }) => (
          <Link key={path} to={path} className={"folder-card folder-" + tint}>
            <span className="folder-card-tab" />
            <span className="folder-card-body">
              <span className="folder-card-icon">
                <Icon className="folder-card-glyph" />
              </span>
              <span className="folder-card-text">
                <strong>{title}</strong>
                <span>{subtitle}</span>
              </span>
              <span className="folder-card-meta">{meta}</span>
            </span>
          </Link>
        ))}
      </div>
    </UsersShell>
  );
}

export default UsersRoles;
