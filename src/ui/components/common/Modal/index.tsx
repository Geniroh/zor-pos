import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import "./index.css";

/**
 * Shared chrome for the modals in Settings — backdrop, header with icon and
 * title, scrolling body, footer, Escape-to-close and backdrop-click-to-close.
 *
 * Extracted once a third modal wanted the same 120 lines of shell CSS. Each
 * modal now supplies only its own body and footer buttons, so they can't drift
 * apart on padding, close-button placement or dismissal behaviour.
 *
 * Every modal built on this is expected to be *conditionally rendered* by its
 * parent rather than take an `open` prop — these all seed draft state from
 * props on open, which a fresh mount handles and an effect would not (see
 * DiscountModal in CLAUDE.md).
 */

interface ModalProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider shell for side-by-side content, e.g. the plan comparison. */
  wide?: boolean;
  /** Paints the header icon in the danger colour instead of brand green. */
  danger?: boolean;
}

function Modal({
  icon,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
  danger = false,
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={"modal-modal" + (wide ? " modal-modal--wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">
            <span className={"modal-title-icon" + (danger ? " modal-title-icon--danger" : "")}>
              {icon}
            </span>
            <span className="modal-title-text">
              {title}
              {subtitle && <small>{subtitle}</small>}
            </span>
          </span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
