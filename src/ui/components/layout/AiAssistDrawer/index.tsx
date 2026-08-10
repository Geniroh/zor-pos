import { useEffect, useRef } from "react";
import {
  ClipboardList,
  FileClock,
  PackageSearch,
  Send,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import type { AiExchange } from "../../../context/AiAssistContext";
import "./index.css";

interface AiAssistDrawerProps {
  open: boolean;
  exchange: AiExchange | null;
  onClose: () => void;
}

const SUGGESTIONS = [
  { icon: TrendingUp, text: "What were my top sellers this week?" },
  { icon: PackageSearch, text: "Which products are running low on stock?" },
  { icon: FileClock, text: "Summarize today's sales" },
  { icon: ClipboardList, text: "Draft a reorder for Paracetamol 500mg" },
];

function AiAssistDrawer({ open, exchange, onClose }: AiAssistDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
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
  }, [open, onClose]);

  return (
    <div
      className={`ai-drawer${open ? " open" : ""}`}
      ref={panelRef}
      aria-hidden={!open}
    >
      <div className="ai-drawer-header">
        <div className="ai-drawer-title">
          <span className="ai-drawer-icon">
            <Sparkles className="ai-icon" />
          </span>
          <h2>AI Assist</h2>
        </div>
        <button
          type="button"
          className="ai-drawer-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="ai-icon" />
        </button>
      </div>

      <div className="ai-drawer-body">
        {exchange ? (
          <div className="ai-exchange">
            <span className="ai-exchange-context">{exchange.contextLabel}</span>

            <div className="ai-message ai-message--user">
              <div className="ai-message-bubble ai-message-bubble--user">{exchange.prompt}</div>
            </div>

            <div className="ai-message">
              <span className="ai-message-avatar">
                <Sparkles className="ai-icon" />
              </span>
              <div className="ai-message-bubble">{exchange.response}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="ai-message">
              <span className="ai-message-avatar">
                <Sparkles className="ai-icon" />
              </span>
              <div className="ai-message-bubble">
                Hi, I&apos;m your Zorpill AI Assistant. Ask me anything about your
                sales, inventory, or day-to-day operations.
              </div>
            </div>

            <p className="ai-suggestions-label">Try asking</p>
            <div className="ai-suggestions">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button type="button" key={text} className="ai-suggestion">
                  <Icon className="ai-icon" />
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="ai-drawer-footer">
        <div className="ai-input">
          <input type="text" placeholder="Message AI Assist..." />
          <button type="button" className="ai-send-btn" aria-label="Send">
            <Send className="ai-icon" />
          </button>
        </div>
        <p className="ai-disclaimer">
          AI Assist can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

export default AiAssistDrawer;
