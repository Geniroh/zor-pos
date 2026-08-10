import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import "./Accordion.css";

interface AccordionProps {
  title: ReactNode;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function Accordion({ title, badge, open, onToggle, children }: AccordionProps) {
  return (
    <div className="accordion">
      <button type="button" className="accordion-toggle" onClick={onToggle} aria-expanded={open}>
        <span className="accordion-title">
          {title}
          {badge && <span className="accordion-badge">{badge}</span>}
        </span>
        <ChevronDown className={"accordion-chevron" + (open ? " accordion-chevron--open" : "")} />
      </button>
      <div className={"accordion-body" + (open ? " accordion-body--open" : "")}>
        <div className="accordion-inner">{children}</div>
      </div>
    </div>
  );
}

export default Accordion;
