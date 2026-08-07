import { Store, ChevronDown, Bell, Circle } from "lucide-react";
import "./TopNav.css";

interface TopNavProps {
  branchName?: string;
  branchLocation?: string;
  userName?: string;
  userRole?: string;
  notificationCount?: number;
  isOnline?: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TopNav({
  branchName = "Main Branch Pharmacy",
  branchLocation = "Set your pharmacy location",
  userName = "Guest User",
  userRole = "Staff",
  notificationCount = 0,
  isOnline = true,
}: TopNavProps) {
  return (
    <header className="topnav">
      <button type="button" className="topnav-branch">
        <Store className="topnav-icon" />
        <span className="topnav-branch-text">
          <strong>{branchName}</strong>
          <small>{branchLocation}</small>
        </span>
        <ChevronDown className="topnav-icon topnav-icon--muted" />
      </button>

      <div className="topnav-spacer" />

      <div className="topnav-status">
        <Circle className={`status-dot${isOnline ? " online" : ""}`} />
        {isOnline ? "Online" : "Offline"}
      </div>

      <button type="button" className="topnav-bell" aria-label="Notifications">
        <Bell className="topnav-icon" />
        {notificationCount > 0 && (
          <span className="topnav-badge">{notificationCount}</span>
        )}
      </button>

      <div className="topnav-user">
        <span className="topnav-avatar">{initials(userName)}</span>
        <span className="topnav-user-text">
          <strong>{userName}</strong>
          <small>{userRole}</small>
        </span>
      </div>
    </header>
  );
}

export default TopNav;
