import { useEffect, useRef, useState } from "react";
import { CopyPlus, Plus, X } from "lucide-react";
import Switch from "../../common/Switch";
import {
  DAY_NAMES,
  DAY_SHORT,
  formatDayHours,
  type DayHours,
  type WeekHours,
} from "../settings-data";
import "./index.css";

/**
 * The opening-hours week editor, shared by the Hours screen and by each
 * branch's own page — both edit the same shape, and duplicating a seven-row
 * grid with period splitting in two places would guarantee they drift.
 *
 * Deliberately not a scheduling interface: a day is open or closed, and an
 * open day carries one or more plain start/end windows. Times are native
 * `<input type="time">`, whose value format is already the "HH:MM" 24-hour
 * string the data uses, so there is no parsing layer.
 */

/** What a day gets when it's switched from closed to open with nothing set. */
const DEFAULT_PERIOD = { open: "08:00", close: "20:00" };

interface HoursEditorProps {
  hours: WeekHours;
  onChange: (hours: WeekHours) => void;
}

function HoursEditor({ hours, onChange }: HoursEditorProps) {
  const [copyFrom, setCopyFrom] = useState<number | null>(null);

  function replaceDay(index: number, day: DayHours) {
    onChange(hours.map((d, i) => (i === index ? day : d)));
  }

  function toggleOpen(index: number, open: boolean) {
    const day = hours[index];
    replaceDay(index, {
      closed: !open,
      // Reopening a day that was never configured needs somewhere to start.
      periods: open && day.periods.length === 0 ? [{ ...DEFAULT_PERIOD }] : day.periods,
    });
  }

  function setTime(index: number, periodIndex: number, field: "open" | "close", value: string) {
    const day = hours[index];
    replaceDay(index, {
      ...day,
      periods: day.periods.map((p, i) => (i === periodIndex ? { ...p, [field]: value } : p)),
    });
  }

  function addPeriod(index: number) {
    const day = hours[index];
    const last = day.periods[day.periods.length - 1];
    // A second window is nearly always an afternoon session after a break, so
    // it starts an hour after the previous one ends rather than at midnight.
    const start = last ? shiftHour(last.close, 1) : DEFAULT_PERIOD.open;
    replaceDay(index, {
      ...day,
      periods: [...day.periods, { open: start, close: shiftHour(start, 4) }],
    });
  }

  function removePeriod(index: number, periodIndex: number) {
    const day = hours[index];
    const periods = day.periods.filter((_, i) => i !== periodIndex);
    replaceDay(index, { closed: periods.length === 0, periods });
  }

  function applyTo(sourceIndex: number, targets: number[]) {
    const source = hours[sourceIndex];
    onChange(
      hours.map((day, i) =>
        targets.includes(i)
          ? { closed: source.closed, periods: source.periods.map((p) => ({ ...p })) }
          : day,
      ),
    );
    setCopyFrom(null);
  }

  return (
    <div className="hours-editor">
      {hours.map((day, index) => (
        <div key={DAY_NAMES[index]} className={"hours-row" + (day.closed ? " hours-row--closed" : "")}>
          <div className="hours-day">
            <Switch
              checked={!day.closed}
              onChange={(open) => toggleOpen(index, open)}
              ariaLabel={DAY_NAMES[index] + " open"}
            />
            <span className="hours-day-name">{DAY_NAMES[index]}</span>
          </div>

          <div className="hours-periods">
            {day.closed || day.periods.length === 0 ? (
              <span className="hours-closed">Closed</span>
            ) : (
              day.periods.map((period, periodIndex) => (
                <div key={periodIndex} className="hours-period">
                  <input
                    type="time"
                    className="hours-time"
                    value={period.open}
                    aria-label={DAY_NAMES[index] + " opening time"}
                    onChange={(e) => setTime(index, periodIndex, "open", e.target.value)}
                  />
                  <span className="hours-dash">–</span>
                  <input
                    type="time"
                    className="hours-time"
                    value={period.close}
                    aria-label={DAY_NAMES[index] + " closing time"}
                    onChange={(e) => setTime(index, periodIndex, "close", e.target.value)}
                  />
                  {day.periods.length > 1 && (
                    <button
                      type="button"
                      className="hours-remove"
                      onClick={() => removePeriod(index, periodIndex)}
                      aria-label="Remove this period"
                    >
                      <X />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="hours-actions">
            {!day.closed && (
              <button
                type="button"
                className="hours-action"
                onClick={() => addPeriod(index)}
                title="Split the day into another period"
              >
                <Plus />
                Add period
              </button>
            )}

            <div className="hours-copy">
              <button
                type="button"
                className="hours-action"
                onClick={() => setCopyFrom(copyFrom === index ? null : index)}
                aria-expanded={copyFrom === index}
              >
                <CopyPlus />
                Copy to…
              </button>

              {copyFrom === index && (
                <CopyMenu
                  sourceIndex={index}
                  source={day}
                  onApply={(targets) => applyTo(index, targets)}
                  onClose={() => setCopyFrom(null)}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Adds whole hours to an "HH:MM" string, clamped inside the same day. */
function shiftHour(time: string, delta: number): string {
  const [h, m] = time.split(":").map(Number);
  const hour = Math.min(23, Math.max(0, h + delta));
  return String(hour).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

interface CopyMenuProps {
  sourceIndex: number;
  source: DayHours;
  onApply: (targets: number[]) => void;
  onClose: () => void;
}

/**
 * "Apply this day's hours to other days" — the small affordance that saves
 * setting the same window seven times. Lives in this file rather than its own
 * folder because it is styled entirely by HoursEditor's stylesheet.
 */
function CopyMenu({ sourceIndex, source, onApply, onClose }: CopyMenuProps) {
  const others = DAY_NAMES.map((_, i) => i).filter((i) => i !== sourceIndex);
  const [selected, setSelected] = useState<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function toggle(index: number) {
    setSelected((list) =>
      list.includes(index) ? list.filter((i) => i !== index) : [...list, index],
    );
  }

  return (
    <div className="hours-copy-menu" ref={rootRef}>
      <p className="hours-copy-title">
        Apply <strong>{formatDayHours(source)}</strong> to:
      </p>

      <div className="hours-copy-quick">
        <button type="button" onClick={() => setSelected(others.filter((i) => i < 5))}>
          Weekdays
        </button>
        <button type="button" onClick={() => setSelected(others)}>
          All other days
        </button>
        <button type="button" onClick={() => setSelected([])}>
          Clear
        </button>
      </div>

      <div className="hours-copy-days">
        {others.map((i) => (
          <button
            key={i}
            type="button"
            className={
              "panel-chip" + (selected.includes(i) ? " panel-chip--active" : "")
            }
            aria-pressed={selected.includes(i)}
            onClick={() => toggle(i)}
          >
            {DAY_SHORT[i]}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="panel-btn panel-btn--primary panel-btn--sm hours-copy-apply"
        disabled={selected.length === 0}
        onClick={() => onApply(selected)}
      >
        Apply to {selected.length} {selected.length === 1 ? "day" : "days"}
      </button>
    </div>
  );
}

export default HoursEditor;
