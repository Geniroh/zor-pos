import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import "./UserMenu.css";

interface UserMenuProps {
  userName?: string;
  userRole?: string;
  collapsed?: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UserMenu({
  userName = "Guest User",
  userRole = "Staff",
  collapsed = false,
}: UserMenuProps) {
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
    <div className="user-menu" ref={rootRef}>
      {open && (
        <div className="user-menu-popover" role="menu">
          <div className="user-menu-header">
            <span className="user-menu-avatar">{initials(userName)}</span>
            <span className="user-menu-header-text">
              <strong>{userName}</strong>
              <small>{userRole}</small>
            </span>
          </div>

          <div className="user-menu-divider" />

          <button type="button" role="menuitem">
            <UserIcon className="user-menu-icon" />
            Profile
          </button>
          <button type="button" role="menuitem">
            <Settings className="user-menu-icon" />
            Preferences
          </button>

          <div className="user-menu-divider" />

          <button type="button" role="menuitem" className="user-menu-signout">
            <LogOut className="user-menu-icon" />
            Sign out
          </button>
        </div>
      )}

      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? userName : undefined}
      >
        <span className="user-menu-avatar">{initials(userName)}</span>
        {!collapsed && (
          <span className="user-menu-trigger-text">
            <strong>{userName}</strong>
            <small>{userRole}</small>
          </span>
        )}
      </button>
    </div>
  );
}

export default UserMenu;
