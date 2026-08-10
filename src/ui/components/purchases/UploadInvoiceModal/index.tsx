import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { simulateParseInvoice, type ParsedInvoice } from "../purchases-data";
import "./index.css";

interface UploadInvoiceModalProps {
  onClose: () => void;
  onParsed: (invoice: ParsedInvoice) => void;
}

const ACCEPTED_TYPES = "image/*,.pdf";
const ANALYZE_MS = 1400;

function UploadInvoiceModal({ onClose, onParsed }: UploadInvoiceModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFile(file: File | null | undefined) {
    if (!file) return;
    setFileName(file.name);
    setAnalyzing(true);
    timeoutRef.current = setTimeout(() => {
      onParsed(simulateParseInvoice());
    }, ANALYZE_MS);
  }

  return (
    <div className="upload-invoice-backdrop" onClick={onClose}>
      <div className="upload-invoice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-invoice-header">
          <span className="upload-invoice-title">Upload Invoice</span>
          <button type="button" className="upload-invoice-close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="upload-invoice-body">
          {!analyzing ? (
            <>
              <div
                className={"upload-invoice-drop" + (dragOver ? " upload-invoice-drop--drag" : "")}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  hidden
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <UploadCloud className="upload-invoice-drop-icon" />
                <span className="upload-invoice-drop-title">Drag and drop the invoice, or click to browse</span>
                <span className="upload-invoice-drop-hint">Supports JPG, PNG or PDF</span>
              </div>
              <p className="upload-invoice-note">
                We'll read the supplier, invoice details, and line items straight off the file so you
                don't have to type them in.
              </p>
            </>
          ) : (
            <div className="upload-invoice-analyzing">
              <Loader2 className="upload-invoice-spinner" />
              <div className="upload-invoice-analyzing-text">
                <span className="upload-invoice-analyzing-title">
                  <FileText className="upload-invoice-file-icon" />
                  Analyzing {fileName}…
                </span>
                <span className="upload-invoice-analyzing-hint">
                  Extracting supplier, invoice details, and line items
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadInvoiceModal;
