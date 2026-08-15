import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSettings } from "../../../context/SettingsContext";
// The card/row/field/button primitives these screens are built from. Imported
// here rather than per page so every screen rendering inside this shell gets
// them, and so the import can't be forgotten on a new one.
import "../../common/panel.css";
import "./index.css";

/**
 * The shared shell every settings screen renders inside — the same role
 * ReportShell plays for Reports: back link, title, header controls and the
 * toast, so seven screens can't drift apart on chrome.
 *
 * It reads the toast straight from SettingsContext rather than taking it as a
 * prop. Saves are instant everywhere in this section, so every screen (and
 * every modal inside one) needs to flash confirmation; threading that through
 * props would have meant the same three lines on all seven pages.
 *
 * `.panel-*` style primitives live in this folder's stylesheet. Shared
 * settings styling belongs there, not in an individual page's CSS.
 */

interface SettingsShellProps {
  title: string;
  subtitle: string;
  /** Controls pinned to the right of the header — the branch picker, mostly. */
  controls?: ReactNode;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
}

function SettingsShell({
  title,
  subtitle,
  controls,
  backTo = "/dashboard/settings",
  backLabel = "All settings",
  children,
}: SettingsShellProps) {
  const { toast } = useSettings();

  return (
    <div className="settings-shell">
      <div className="settings-shell-head">
        <div className="settings-shell-titles">
          <Link to={backTo} className="settings-shell-back">
            <ArrowLeft className="settings-shell-back-icon" />
            {backLabel}
          </Link>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {controls && <div className="settings-shell-controls">{controls}</div>}
      </div>

      <div className="settings-shell-body">{children}</div>

      {toast && <div className="panel-toast">{toast}</div>}
    </div>
  );
}

export default SettingsShell;
