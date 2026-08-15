import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Eye,
  KeyRound,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  UserMinus,
} from "lucide-react";
import "./index.css";

/**
 * The per-row actions menu. Destructive entries are separated below a rule and
 * coloured, so "Remove access" can't be misread as another routine edit while
 * skimming a dense table.
 */

export type UserMenuAction =
  | "view"
  | "role"
  | "branch"
  | "suspend"
  | "restore"
  | "remove";

interface UserActionsMenuProps {
  suspended: boolean;
  /** The signed-in user can't suspend or remove themselves. */
  isSelf: boolean;
  onAction: (action: UserMenuAction) => void;
  label: string;
}

function UserActionsMenu({ suspended, isSelf, onAction, label }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
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

  function choose(action: UserMenuAction) {
    setOpen(false);
    onAction(action);
  }

  return (
    <div className="uam" ref={rootRef}>
      <button
        type="button"
        className="uam-trigger"
        aria-label={"Actions for " + label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal />
      </button>

      {open && (
        <div className="uam-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => choose("view")}>
            <Eye />
            View user
          </button>
          <button type="button" role="menuitem" onClick={() => choose("role")}>
            <KeyRound />
            Change role
          </button>
          <button type="button" role="menuitem" onClick={() => choose("branch")}>
            <Building2 />
            Change branch access
          </button>

          {!isSelf && (
            <>
              <div className="uam-divider" />
              {suspended ? (
                <button type="button" role="menuitem" onClick={() => choose("restore")}>
                  <PlayCircle />
                  Restore access
                </button>
              ) : (
                <button type="button" role="menuitem" onClick={() => choose("suspend")}>
                  <PauseCircle />
                  Suspend
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                className="uam-danger"
                onClick={() => choose("remove")}
              >
                <UserMinus />
                Remove access
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UserActionsMenu;
