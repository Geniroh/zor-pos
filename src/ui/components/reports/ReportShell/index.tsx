import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, ChevronDown, Download } from "lucide-react";
import {
  DATE_PRESETS,
  formatChange,
  formatNaira,
  formatPeriod,
  precedingPeriod,
  resolvePeriod,
  type DatePreset,
  type Period,
} from "../reports-data";
import "./index.css";

/**
 * Period state for a report page. Lives here rather than in each page so all
 * seven report screens resolve dates and derive their comparison window
 * identically — the comparison is always the equal-length window immediately
 * before the selected one, never a separate user choice.
 */
export function useReportPeriod(initial: DatePreset = "7d") {
  const [preset, setPreset] = useState<DatePreset>(initial);

  // Memoised for identity, not speed: resolvePeriod builds a fresh object every
  // call, and the report pages key their useMemos on `period`. Without this,
  // merely opening a dropdown would re-filter every sale line on the page.
  const period = useMemo(() => resolvePeriod(preset), [preset]);
  const compare = useMemo(() => precedingPeriod(period), [period]);

  return { preset, setPreset, period, compare };
}

/** Toast helper shared by the report pages — matches PurchaseHistory's pattern. */
export function useToast() {
  const [toast, setToast] = useState("");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setToast(""), 2400);
  }

  return { toast, flash };
}

/**
 * KPI tile. Lives here rather than in its own folder because it is styled
 * entirely by ReportShell's stylesheet — splitting it out would separate the
 * JSX from the CSS that owns it, which is the pairing the folder convention
 * exists to keep together.
 */
export function StatTile({
  label,
  value,
  change,
  note,
  icon,
}: {
  label: string;
  value: string;
  change?: number | null;
  note?: string;
  icon?: ReactNode;
}) {
  // A null change means there was nothing to compare against, so it gets the
  // neutral treatment rather than being painted red as if it were a decline.
  const deltaClass =
    change === null || change === undefined
      ? ""
      : change >= 0
        ? " report-tile-delta--up"
        : " report-tile-delta--down";

  return (
    <div className="report-tile">
      <span className="report-tile-label">
        {icon}
        {label}
      </span>
      <span className="report-tile-value">{value}</span>
      {change !== undefined && (
        <span className={"report-tile-delta" + deltaClass}>
          {formatChange(change ?? null)}
          {note && <span>{note}</span>}
        </span>
      )}
      {change === undefined && note && <span className="report-tile-delta"><span>{note}</span></span>}
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: Record<string, unknown>; name?: string; value?: number; color?: string }[];
  label?: string | number;
  /** Formats each series value; defaults to naira. */
  format?: (value: number) => string;
}

/** One tooltip for every chart in the section, so hover reads the same everywhere. */
export function ChartTooltip({ active, payload, label, format = formatNaira }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="report-tooltip">
      {label !== undefined && <span className="report-tooltip-title">{String(label)}</span>}
      {payload.map((entry, i) => (
        <span key={i} className="report-tooltip-value" style={entry.color ? { color: entry.color } : undefined}>
          {entry.name ? entry.name + ": " : ""}
          {format(Number(entry.value ?? 0))}
        </span>
      ))}
    </div>
  );
}

interface ReportShellProps {
  title: string;
  subtitle: string;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  period: Period;
  compare: Period;
  onExport: () => void;
  /** Extra controls placed left of the date picker (report-specific filters). */
  controls?: ReactNode;
  /** Where the back link goes. Defaults to the Reports hub. */
  backTo?: string;
  backLabel?: string;
  toast?: string;
  children: ReactNode;
}

function ReportShell({
  title,
  subtitle,
  preset,
  onPresetChange,
  period,
  compare,
  onExport,
  controls,
  backTo = "/dashboard/reports",
  backLabel = "All reports",
  toast,
  children,
}: ReportShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function choose(value: DatePreset) {
    onPresetChange(value);
    setMenuOpen(false);
  }

  return (
    <div className="report-shell">
      <div className="report-shell-head">
        <div className="report-shell-titles">
          <Link to={backTo} className="report-shell-back">
            <ArrowLeft className="report-shell-back-icon" />
            {backLabel}
          </Link>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="report-shell-controls">
          {controls}

          <div className="report-shell-picker">
            <button
              type="button"
              className="report-shell-picker-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
            >
              <CalendarDays className="report-shell-picker-icon" />
              <span>{formatPeriod(period)}</span>
              <ChevronDown className="report-shell-chevron" />
            </button>

            {menuOpen && (
              <>
                <div className="report-shell-scrim" onClick={() => setMenuOpen(false)} />
                <div className="report-shell-menu" role="listbox">
                  {DATE_PRESETS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      role="option"
                      aria-selected={value === preset}
                      className={
                        "report-shell-menu-item" +
                        (value === preset ? " report-shell-menu-item--active" : "")
                      }
                      onClick={() => choose(value)}
                    >
                      <span>{label}</span>
                      <span className="report-shell-menu-range">
                        {formatPeriod(resolvePeriod(value))}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Read-only: the comparison window always derives from the selection. */}
          <span className="report-shell-compare">Compare to: {formatPeriod(compare)}</span>

          <button type="button" className="report-shell-export" onClick={onExport}>
            <Download className="report-shell-export-icon" />
            Export
          </button>
        </div>
      </div>

      {children}

      {toast && <div className="report-shell-toast">{toast}</div>}
    </div>
  );
}

export default ReportShell;
