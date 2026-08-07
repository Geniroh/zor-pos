import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Circle,
  Copy,
  HelpCircle,
  Menu as MenuIcon,
  Minus,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  Square,
  Sun,
  X,
} from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";
import { useTheme } from "../../context/ThemeContext";
import NotificationsMenu from "./NotificationsMenu";
import HelpModal from "./HelpModal";
import AiAssistDrawer from "./AiAssistDrawer";
import "./TitleBar.css";

const platform = window.electronAPI?.platform ?? "win32";
const isMac = platform === "darwin";

interface TitleBarProps {
  notificationCount?: number;
  isOnline?: boolean;
}

function TitleBar({
  notificationCount = 0,
  isOnline = true,
}: TitleBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [isMaximized, setIsMaximized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isDashboard = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    window.electronAPI?.isWindowMaximized().then(setIsMaximized);
    return window.electronAPI?.onWindowMaximizedChange(setIsMaximized);
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className={`titlebar${isMac ? " titlebar--mac" : ""}`}>
      {isMac && (
        <div className="titlebar-traffic-lights">
          <button
            type="button"
            className="traffic-light traffic-light--close"
            onClick={() => window.electronAPI?.closeWindow()}
            aria-label="Close"
          />
          <button
            type="button"
            className="traffic-light traffic-light--minimize"
            onClick={() => window.electronAPI?.minimizeWindow()}
            aria-label="Minimize"
          />
          <button
            type="button"
            className="traffic-light traffic-light--maximize"
            onClick={() => window.electronAPI?.toggleMaximizeWindow()}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          />
        </div>
      )}

      <div className="titlebar-controls">
        <div className="titlebar-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="titlebar-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menu"
          >
            <MenuIcon className="titlebar-icon" />
          </button>

          {menuOpen && (
            <div className="titlebar-menu" role="menu">
              <button type="button" role="menuitem">
                Preferences
              </button>
              <button type="button" role="menuitem">
                Check for Updates
              </button>
              <button type="button" role="menuitem">
                About Zorpill
              </button>
            </div>
          )}
        </div>

        {isDashboard && (
          <button
            type="button"
            className="titlebar-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="titlebar-icon" />
            ) : (
              <PanelLeftClose className="titlebar-icon" />
            )}
          </button>
        )}

        {isDashboard && (
          <>
            <button
              type="button"
              className="titlebar-btn"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <ArrowLeft className="titlebar-icon" />
            </button>
            <button
              type="button"
              className="titlebar-btn"
              onClick={() => navigate(1)}
              aria-label="Forward"
            >
              <ArrowRight className="titlebar-icon" />
            </button>
          </>
        )}
      </div>

      {isDashboard && (
        <div className="titlebar-search">
          <Search className="titlebar-icon titlebar-icon--muted" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search products, customers, invoices..."
          />
          <kbd>Ctrl K</kbd>
        </div>
      )}

      <div className="titlebar-actions">
        {isDashboard && (
          <>
            <div className="titlebar-status">
              <Circle className={`titlebar-status-dot${isOnline ? " online" : ""}`} />
              {isOnline ? "Online" : "Offline"}
            </div>

            <NotificationsMenu notificationCount={notificationCount} />

            <button
              type="button"
              className="titlebar-ai-btn"
              onClick={() => setAiOpen((o) => !o)}
            >
              <Sparkles className="titlebar-icon" />
              AI Assist
            </button>
          </>
        )}

        <div className="titlebar-theme-toggle" role="group" aria-label="Theme">
          <button
            type="button"
            className={theme === "light" ? "active" : ""}
            aria-pressed={theme === "light"}
            aria-label="Light theme"
            onClick={() => setTheme("light")}
          >
            <Sun className="titlebar-icon" />
          </button>
          <button
            type="button"
            className={theme === "dark" ? "active" : ""}
            aria-pressed={theme === "dark"}
            aria-label="Dark theme"
            onClick={() => setTheme("dark")}
          >
            <Moon className="titlebar-icon" />
          </button>
        </div>

        <button
          type="button"
          className="titlebar-btn"
          aria-label="Help"
          onClick={() => setHelpOpen(true)}
        >
          <HelpCircle className="titlebar-icon" />
        </button>
      </div>

      {!isMac && (
        <div className="titlebar-window-controls">
          <button
            type="button"
            className="window-btn"
            onClick={() => window.electronAPI?.minimizeWindow()}
            aria-label="Minimize"
          >
            <Minus className="titlebar-icon" />
          </button>
          <button
            type="button"
            className="window-btn"
            onClick={() => window.electronAPI?.toggleMaximizeWindow()}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <Copy className="titlebar-icon" />
            ) : (
              <Square className="titlebar-icon" />
            )}
          </button>
          <button
            type="button"
            className="window-btn window-btn--close"
            onClick={() => window.electronAPI?.closeWindow()}
            aria-label="Close"
          >
            <X className="titlebar-icon" />
          </button>
        </div>
      )}

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <AiAssistDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
    </header>
  );
}

export default TitleBar;
