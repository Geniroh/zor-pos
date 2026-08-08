import { createContext, useContext, useState, type ReactNode } from "react";

export interface AiExchange {
  contextLabel: string;
  prompt: string;
  response: string;
}

interface AiAssistContextValue {
  open: boolean;
  exchange: AiExchange | null;
  openBlank: () => void;
  openWithExchange: (exchange: AiExchange) => void;
  close: () => void;
}

const AiAssistContext = createContext<AiAssistContextValue | undefined>(undefined);

export function AiAssistProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [exchange, setExchange] = useState<AiExchange | null>(null);

  function openBlank() {
    setExchange(null);
    setOpen(true);
  }

  function openWithExchange(next: AiExchange) {
    setExchange(next);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  return (
    <AiAssistContext.Provider value={{ open, exchange, openBlank, openWithExchange, close }}>
      {children}
    </AiAssistContext.Provider>
  );
}

export function useAiAssist() {
  const context = useContext(AiAssistContext);
  if (!context) {
    throw new Error("useAiAssist must be used within an AiAssistProvider");
  }
  return context;
}
