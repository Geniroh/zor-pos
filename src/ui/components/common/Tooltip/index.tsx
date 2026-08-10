import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import "./index.css";

type Side = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  label: string;
  command?: string;
  disabled?: boolean;
  /** Single element only — cloned to attach hover/focus listeners and a ref. */
  children: ReactElement<any>;
}

const GAP = 8;
const EDGE_MARGIN = 4;
const SHOW_DELAY = 350;

function Tooltip({ label, command, disabled = false, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | undefined>(undefined);

  function show() {
    if (disabled) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(true), SHOW_DELAY);
  }

  function hide() {
    window.clearTimeout(timerRef.current);
    setVisible(false);
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useLayoutEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const space: Record<Side, number> = {
      top: trigger.top,
      bottom: vh - trigger.bottom,
      left: trigger.left,
      right: vw - trigger.right,
    };
    const side = (Object.keys(space) as Side[]).sort(
      (a, b) => space[b] - space[a],
    )[0];

    let top = 0;
    let left = 0;

    if (side === "bottom") {
      top = trigger.bottom + GAP;
      left = trigger.left + trigger.width / 2 - tooltip.width / 2;
    } else if (side === "top") {
      top = trigger.top - tooltip.height - GAP;
      left = trigger.left + trigger.width / 2 - tooltip.width / 2;
    } else if (side === "right") {
      top = trigger.top + trigger.height / 2 - tooltip.height / 2;
      left = trigger.right + GAP;
    } else {
      top = trigger.top + trigger.height / 2 - tooltip.height / 2;
      left = trigger.left - tooltip.width - GAP;
    }

    left = Math.min(
      Math.max(left, EDGE_MARGIN),
      vw - tooltip.width - EDGE_MARGIN,
    );
    top = Math.min(
      Math.max(top, EDGE_MARGIN),
      vh - tooltip.height - EDGE_MARGIN,
    );

    setCoords({ top, left });
  }, [visible, label, command]);

  useEffect(() => {
    if (!visible) return;

    function handleWindowChange() {
      hide();
    }
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);
    return () => {
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [visible]);

  if (!isValidElement(children)) return children;

  const element = children as ReactElement<any>;
  const props = element.props as Record<string, unknown>;

  const child = cloneElement(element, {
    ref: triggerRef,
    onMouseEnter: (event: React.MouseEvent) => {
      (props.onMouseEnter as React.MouseEventHandler | undefined)?.(event);
      show();
    },
    onMouseLeave: (event: React.MouseEvent) => {
      (props.onMouseLeave as React.MouseEventHandler | undefined)?.(event);
      hide();
    },
    onFocus: (event: React.FocusEvent) => {
      (props.onFocus as React.FocusEventHandler | undefined)?.(event);
      show();
    },
    onBlur: (event: React.FocusEvent) => {
      (props.onBlur as React.FocusEventHandler | undefined)?.(event);
      hide();
    },
  });

  return (
    <>
      {child}
      {visible &&
        !disabled &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={`app-tooltip${coords ? " visible" : ""}`}
            style={{ top: coords?.top ?? -9999, left: coords?.left ?? -9999 }}
          >
            <span className="app-tooltip-label">{label}</span>
            {command && <span className="app-tooltip-command">{command}</span>}
          </div>,
          document.body,
        )}
    </>
  );
}

export default Tooltip;
