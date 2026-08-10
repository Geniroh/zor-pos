import { useEffect } from "react";
import {
  Bell,
  ChevronRight,
  Gift,
  Keyboard,
  Package,
  Search,
  Store,
  Users,
  X,
} from "lucide-react";
import "./index.css";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const DISCOVER_CARDS = [
  {
    title: "New Quick Sale shortcuts",
    subtitle: "Ring up sales faster with hotkeys",
    badge: "New",
    gradient: "linear-gradient(135deg, #4f7d52, #263b28)",
  },
  {
    title: "Organize your branches",
    subtitle: "Group locations for easier reporting",
    badge: "New",
    gradient: "linear-gradient(135deg, #1c2b3a, #3d5069)",
  },
  {
    title: "What's new in Zorpill",
    subtitle: "See the latest features",
    badge: null,
    gradient: "linear-gradient(135deg, #d8cfa8, #ab8f4c)",
  },
];

const HELP_TOPICS = [
  { icon: Bell, title: "Configure your notification preferences" },
  { icon: Store, title: "Set up your pharmacy branches" },
  { icon: Package, title: "Manage inventory and stock alerts" },
  { icon: Users, title: "Add and manage staff accounts" },
];

function HelpModal({ open, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="help-backdrop" onMouseDown={onClose}>
      <div
        className="help-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Help"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="help-header">
          <h2>Help</h2>
          <div className="help-header-actions">
            <button
              type="button"
              className="help-icon-btn"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="help-icon" />
            </button>
            <button
              type="button"
              className="help-icon-btn"
              aria-label="What's new"
            >
              <Gift className="help-icon" />
            </button>
            <button
              type="button"
              className="help-icon-btn"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="help-icon" />
            </button>
          </div>
        </div>

        <div className="help-body">
          <p className="help-section-label">Find answers quickly</p>
          <div className="help-search">
            <Search className="help-icon help-icon--muted" />
            <input type="text" placeholder="How can we help?" />
          </div>

          <div className="help-section-header">
            <p className="help-section-label">Discover more</p>
            <span className="help-page-indicator">1/3</span>
          </div>
          <div className="help-cards">
            {DISCOVER_CARDS.map((card) => (
              <div
                key={card.title}
                className="help-card"
                style={{ background: card.gradient }}
              >
                {card.badge && (
                  <span className="help-card-badge">{card.badge}</span>
                )}
                <div className="help-card-text">
                  <strong>{card.title}</strong>
                  <span>{card.subtitle}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="help-section-label">Explore help topics</p>
          <div className="help-topics">
            {HELP_TOPICS.map(({ icon: Icon, title }) => (
              <button type="button" key={title} className="help-topic">
                <span className="help-topic-icon">
                  <Icon className="help-icon" />
                </span>
                <span className="help-topic-title">{title}</span>
                <ChevronRight className="help-icon help-icon--muted" />
              </button>
            ))}
          </div>
        </div>

        <div className="help-footer">
          <a href="#" className="help-link">
            Help requests ↗
          </a>
          <button type="button" className="help-contact-btn">
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
