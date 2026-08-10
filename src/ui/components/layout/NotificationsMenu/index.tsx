import { useEffect, useRef, useState } from "react";
import {
  Bell,
  FileText,
  ShoppingCart,
  TriangleAlert,
  Truck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Tooltip from "../../common/Tooltip";
import "./index.css";

interface Notification {
  id: string;
  name: string;
  type: string;
  icon: LucideIcon;
  message: string;
  time: string;
  unread: boolean;
  color: string;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    name: "Stock Alert",
    type: "Low Stock",
    icon: TriangleAlert,
    message: "Paracetamol 500mg is running low — 12 units left.",
    time: "7:17 PM",
    unread: true,
    color: "var(--green)",
  },
  {
    id: "2",
    name: "Adaeze Okafor",
    type: "Sale",
    icon: ShoppingCart,
    message: "Completed a sale — Invoice #1060015207, ₦4,192.50.",
    time: "6:52 PM",
    unread: true,
    color: "var(--ink)",
  },
  {
    id: "3",
    name: "MedPlus Distributors",
    type: "Purchase Order",
    icon: Truck,
    message: "Order #PO-2291 has been delivered.",
    time: "4:30 PM",
    unread: false,
    color: "var(--green-dark)",
  },
  {
    id: "4",
    name: "Ngozi Chukwu",
    type: "Team",
    icon: UserPlus,
    message: "Accepted your invitation to join as Pharmacist.",
    time: "Yesterday",
    unread: false,
    color: "var(--green)",
  },
  {
    id: "5",
    name: "Weekly Report",
    type: "Report",
    icon: FileText,
    message: "Your weekly sales report is ready to view.",
    time: "Yesterday",
    unread: false,
    color: "var(--ink)",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface NotificationsMenuProps {
  notificationCount?: number;
}

function NotificationsMenu({ notificationCount = 0 }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
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

  const items = unreadOnly
    ? NOTIFICATIONS.filter((notification) => notification.unread)
    : NOTIFICATIONS;

  return (
    <div className="notifications-menu" ref={rootRef}>
      <Tooltip label="Notifications">
        <button
          type="button"
          className="titlebar-btn"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Notifications"
        >
          <Bell className="titlebar-icon" />
          {notificationCount > 0 && (
            <span className="titlebar-badge">{notificationCount}</span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div className="notifications-panel" role="menu">
          <div className="notifications-header">
            <strong>Activity</strong>
            <label className="notifications-toggle">
              Unreads
              <button
                type="button"
                role="switch"
                aria-checked={unreadOnly}
                className={`toggle-switch${unreadOnly ? " on" : ""}`}
                onClick={() => setUnreadOnly((u) => !u)}
              >
                <span className="toggle-knob" />
              </button>
            </label>
          </div>

          <div className="notifications-list">
            {items.length === 0 ? (
              <p className="notifications-empty">You&apos;re all caught up.</p>
            ) : (
              items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`notification-item${item.unread ? " unread" : ""}`}
                  >
                    <span
                      className="notification-avatar"
                      style={{ background: item.color }}
                    >
                      {initials(item.name)}
                    </span>
                    <div className="notification-body">
                      <div className="notification-row">
                        <strong>{item.name}</strong>
                        <span className="notification-time">{item.time}</span>
                      </div>
                      <div className="notification-type">
                        <Icon className="notification-type-icon" />
                        {item.type}
                      </div>
                      <p className="notification-message">{item.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsMenu;
