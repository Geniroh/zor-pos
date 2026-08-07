import { NavLink } from "react-router-dom";
import { Zap } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import UserMenu from "./UserMenu";
import { useSidebar } from "../../context/SidebarContext";
import "./Sidebar.css";

function Sidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <WorkspaceSwitcher collapsed={collapsed} />

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={label}
            to={path === "" ? "/dashboard" : `/dashboard/${path}`}
            end={path === ""}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="sidebar-icon" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-quick-sale">
          <Zap className="sidebar-icon" />
          {!collapsed && (
            <>
              <span>Quick Sale</span>
              <kbd>F2</kbd>
            </>
          )}
        </button>
      </div>

      <div className="sidebar-user">
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}

export default Sidebar;
