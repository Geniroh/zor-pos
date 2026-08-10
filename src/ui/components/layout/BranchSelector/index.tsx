import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Store } from "lucide-react";
import Tooltip from "../../common/Tooltip";
import "./index.css";

interface Branch {
  id: string;
  name: string;
  location: string;
}

const BRANCHES: Branch[] = [
  { id: "main", name: "Main Branch Pharmacy", location: "Ikeja, Lagos" },
  { id: "lekki", name: "Lekki Branch", location: "Lekki, Lagos" },
  { id: "abuja", name: "Abuja Branch", location: "Wuse II, Abuja" },
];

interface BranchSelectorProps {
  collapsed?: boolean;
}

function BranchSelector({ collapsed = false }: BranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(BRANCHES[0].id);
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

  const active = BRANCHES.find((branch) => branch.id === activeId) ?? BRANCHES[0];

  return (
    <div className="branch-selector" ref={rootRef}>
      <Tooltip label={active.name} disabled={!collapsed}>
        <button
          type="button"
          className="branch-trigger"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="branch-avatar">
            <Store className="branch-avatar-icon" />
          </span>
          {!collapsed && (
            <>
              <span className="branch-trigger-text">
                <strong>{active.name}</strong>
                <small>{active.location}</small>
              </span>
              <ChevronDown className="branch-chevron" />
            </>
          )}
        </button>
      </Tooltip>

      {open && (
        <div className="branch-menu" role="menu">
          <p className="branch-menu-label">Branches</p>
          <ul>
            {BRANCHES.map((branch, index) => (
              <li key={branch.id}>
                <button
                  type="button"
                  role="menuitem"
                  className={`branch-item${branch.id === activeId ? " active" : ""}`}
                  onClick={() => {
                    setActiveId(branch.id);
                    setOpen(false);
                  }}
                >
                  <span className="branch-avatar">
                    <Store className="branch-avatar-icon" />
                  </span>
                  <span className="branch-item-text">
                    <strong>{branch.name}</strong>
                    <small>{branch.location}</small>
                  </span>
                  {branch.id === activeId ? (
                    <Check className="branch-check" />
                  ) : (
                    <kbd>Ctrl {index + 1}</kbd>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="branch-menu-divider" />

          <button type="button" className="branch-add">
            <span className="branch-avatar branch-avatar--add">
              <Plus className="branch-add-icon" />
            </span>
            Add a branch
          </button>
        </div>
      )}
    </div>
  );
}

export default BranchSelector;
