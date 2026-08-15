import { NavLink } from "react-router-dom";
import { Zap } from "lucide-react";
import { NAV_ITEMS } from "../nav-items";
import WorkspaceSwitcher from "../WorkspaceSwitcher";
import BranchSelector from "../BranchSelector";
import UserMenu from "../UserMenu";
import Tooltip from "../../common/Tooltip";
import { useSidebar } from "../../../context/SidebarContext";
import { useUsers } from "../../../context/UsersContext";
import { roleById } from "../../users/users-data";
import "./index.css";

function Sidebar() {
  const { collapsed } = useSidebar();
  const { currentUser } = useUsers();

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <WorkspaceSwitcher collapsed={collapsed} />
      <BranchSelector collapsed={collapsed} />

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <Tooltip key={label} label={label} disabled={!collapsed}>
            <NavLink
              to={path === "" ? "/dashboard" : `/dashboard/${path}`}
              end={path === ""}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
            >
              <Icon className="sidebar-icon" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Tooltip label="Quick Sale" command="F2" disabled={!collapsed}>
          <button type="button" className="sidebar-quick-sale">
            <Zap className="sidebar-icon" />
            {!collapsed && (
              <>
                <span>Quick Sale</span>
                <kbd>F2</kbd>
              </>
            )}
          </button>
        </Tooltip>
      </div>

      <div className="sidebar-user">
        {/* Who's signed in comes from UsersContext rather than UserMenu's
            placeholder defaults, so the sidebar and My Profile agree. */}
        <UserMenu
          collapsed={collapsed}
          userName={currentUser.name}
          userRole={roleById(currentUser.roleId).name}
        />
      </div>
    </aside>
  );
}

export default Sidebar;
