import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import Tooltip from "../Tooltip";
import "./WorkspaceSwitcher.css";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  color: string;
}

const WORKSPACES: Workspace[] = [
  {
    id: "zorpill-hq",
    name: "Zorpill HQ",
    slug: "zorpill-hq.zorpill.app",
    color: "var(--green)",
  },
  {
    id: "ikeja-central",
    name: "Ikeja Central Pharmacy",
    slug: "ikeja-central.zorpill.app",
    color: "var(--ink)",
  },
  {
    id: "lekki-group",
    name: "Lekki Pharmacy Group",
    slug: "lekki-group.zorpill.app",
    color: "var(--green-dark)",
  },
];

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(WORKSPACES[0].id);
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

  const active = WORKSPACES.find((ws) => ws.id === activeId) ?? WORKSPACES[0];

  return (
    <div className="workspace-switcher" ref={rootRef}>
      <Tooltip label={active.name} disabled={!collapsed}>
        <button
          type="button"
          className="workspace-trigger"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span
            className="workspace-avatar"
            style={{ background: active.color }}
          >
            {active.name[0]}
          </span>
          {!collapsed && (
            <>
              <span className="workspace-trigger-name">{active.name}</span>
              <ChevronDown className="workspace-chevron" />
            </>
          )}
        </button>
      </Tooltip>

      {open && (
        <div className="workspace-menu" role="menu">
          <p className="workspace-menu-label">Workspaces</p>
          <ul>
            {WORKSPACES.map((ws, index) => (
              <li key={ws.id}>
                <button
                  type="button"
                  role="menuitem"
                  className={`workspace-item${ws.id === activeId ? " active" : ""}`}
                  onClick={() => {
                    setActiveId(ws.id);
                    setOpen(false);
                  }}
                >
                  <span
                    className="workspace-avatar"
                    style={{ background: ws.color }}
                  >
                    {ws.name[0]}
                  </span>
                  <span className="workspace-item-text">
                    <strong>{ws.name}</strong>
                    <small>{ws.slug}</small>
                  </span>
                  {ws.id === activeId ? (
                    <Check className="workspace-check" />
                  ) : (
                    <kbd>Ctrl {index + 1}</kbd>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="workspace-menu-divider" />

          <button type="button" className="workspace-add">
            <span className="workspace-avatar workspace-avatar--add">
              <Plus className="workspace-add-icon" />
            </span>
            Add a workspace
          </button>
        </div>
      )}
    </div>
  );
}

export default WorkspaceSwitcher;
