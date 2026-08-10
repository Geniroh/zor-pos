import { useMemo, useRef, useState } from "react";
import { FileText, Trash2, UploadCloud, X } from "lucide-react";
import { CATALOG, formatNaira, type Product } from "../../components/pos/pos-data";
import {
  PAYMENT_TERMS,
  SUPPLIERS,
  findSupplier,
  type ParsedInvoice,
  type PaymentTerm,
} from "../../components/purchases/purchases-data";
import UploadInvoiceModal from "../../components/purchases/UploadInvoiceModal";
import "./index.css";

interface LineRow {
  key: number;
  query: string;
  searchOpen: boolean;
  pid: string | null;
  batch: string;
  expiry: string;
  qty: string;
  cost: string;
}

let rowSeq = 1;

function emptyRow(): LineRow {
  return { key: rowSeq++, query: "", searchOpen: false, pid: null, batch: "", expiry: "", qty: "", cost: "" };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function ReceiveNewStock() {
  const [supplierQuery, setSupplierQuery] = useState("");
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateReceived, setDateReceived] = useState(todayISO());
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>("Cash");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<LineRow[]>([emptyRow()]);
  const [invoiceTotalInput, setInvoiceTotalInput] = useState("");

  const [showBanner, setShowBanner] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2400);
  }

  const supplierMatches = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase();
    if (!q) return SUPPLIERS;
    return SUPPLIERS.filter((s) => s.name.toLowerCase().includes(q));
  }, [supplierQuery]);

  function selectSupplier(id: string) {
    const supplier = findSupplier(id);
    if (!supplier) return;
    setSupplierId(supplier.id);
    setSupplierQuery(supplier.name);
    setSupplierOpen(false);
  }

  function productMatches(query: string): Product[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CATALOG.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)).slice(0, 6);
  }

  function updateRow(index: number, patch: Partial<LineRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function selectProductForRow(index: number, product: Product) {
    setRows((prev) => {
      const next = prev.map((r, i) =>
        i === index
          ? { ...r, pid: product.id, query: product.name, searchOpen: false, cost: r.cost || String(product.price) }
          : r,
      );
      if (index === prev.length - 1) next.push(emptyRow());
      return next;
    });
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  const itemCount = rows.filter((r) => r.pid).length;
  const computedTotal = rows.reduce((sum, r) => sum + (parseFloat(r.qty) || 0) * (parseFloat(r.cost) || 0), 0);

  const invoiceTotalValue = parseFloat(invoiceTotalInput);
  const hasCrossCheck = invoiceTotalInput.trim().length > 0 && !Number.isNaN(invoiceTotalValue);
  const crossCheckMatches = hasCrossCheck && Math.abs(invoiceTotalValue - computedTotal) < 1;

  const canSubmit =
    supplierId !== null &&
    invoiceNumber.trim().length > 0 &&
    dateReceived.length > 0 &&
    rows.some((r) => r.pid && (parseFloat(r.qty) || 0) > 0 && (parseFloat(r.cost) || 0) > 0);

  function resetForm() {
    setSupplierQuery("");
    setSupplierId(null);
    setInvoiceNumber("");
    setDateReceived(todayISO());
    setPaymentTerm("Cash");
    setNotes("");
    setRows([emptyRow()]);
    setInvoiceTotalInput("");
    setShowBanner(true);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    flash("Purchase submitted · " + invoiceNumber.trim());
    resetForm();
  }

  function handleSaveDraft() {
    flash(invoiceNumber.trim() ? "Saved as draft · " + invoiceNumber.trim() : "Saved as draft");
  }

  function handleParsed(invoice: ParsedInvoice) {
    setUploadOpen(false);
    setSupplierId(invoice.supplierId);
    setSupplierQuery(findSupplier(invoice.supplierId)?.name ?? "");
    setInvoiceNumber(invoice.invoiceNumber);
    setDateReceived(invoice.dateReceived);
    setPaymentTerm(invoice.paymentTerm);
    setNotes(invoice.notes);
    setRows([
      ...invoice.lines.map((l) => ({
        key: rowSeq++,
        query: l.name,
        searchOpen: false,
        pid: l.pid,
        batch: l.batch,
        expiry: l.expiry,
        qty: String(l.qty),
        cost: String(l.cost),
      })),
      emptyRow(),
    ]);
    setInvoiceTotalInput(String(invoice.invoiceTotal));
    setShowBanner(false);
    flash(`Invoice parsed · filled ${invoice.lines.length} line item${invoice.lines.length === 1 ? "" : "s"}`);
  }

  return (
    <div className="receive-stock-page">
      <div className="receive-stock-header">
        <span className="receive-stock-header-icon">
          <FileText />
        </span>
        <div>
          <h1>Receive New Stock</h1>
          <p>Record an incoming purchase invoice from a supplier</p>
        </div>
      </div>

      {showBanner ? (
        <div className="receive-stock-banner">
          <div className="receive-stock-banner-text">
            <UploadCloud className="receive-stock-banner-icon" />
            <div className="receive-stock-banner-copy">
              <strong>Have an invoice on hand?</strong>
              <span>
                Upload it and we&apos;ll fill in the details below for you — faster and less error-prone
                than typing it all in.
              </span>
            </div>
          </div>
          <div className="receive-stock-banner-actions">
            <button type="button" className="receive-stock-banner-upload" onClick={() => setUploadOpen(true)}>
              <UploadCloud className="receive-stock-banner-upload-icon" />
              Upload Invoice
            </button>
            <button
              type="button"
              className="receive-stock-banner-dismiss"
              onClick={() => setShowBanner(false)}
              aria-label="Dismiss"
            >
              <X />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="receive-stock-reupload" onClick={() => setUploadOpen(true)}>
          <UploadCloud className="receive-stock-reupload-icon" />
          Upload a different invoice
        </button>
      )}

      <div className="receive-stock-card">
        <div className="receive-stock-card-title">Invoice Details</div>

        <div className="receive-stock-row">
          <div className="receive-stock-field receive-stock-field--search">
            <span className="receive-stock-label">
              Supplier <span className="receive-stock-required">*</span>
            </span>
            <input
              className="receive-stock-input"
              value={supplierQuery}
              onChange={(e) => {
                setSupplierQuery(e.target.value);
                setSupplierId(null);
                setSupplierOpen(true);
              }}
              onFocus={() => setSupplierOpen(true)}
              onBlur={() => setTimeout(() => setSupplierOpen(false), 120)}
              placeholder="Search supplier…"
              autoComplete="off"
            />
            {supplierOpen && supplierMatches.length > 0 && (
              <div className="receive-stock-dropdown">
                {supplierMatches.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="receive-stock-dropdown-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSupplier(s.id)}
                  >
                    <span className="receive-stock-dropdown-title">{s.name}</span>
                    <span className="receive-stock-dropdown-meta">
                      {s.contact} · {s.phone}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="receive-stock-field">
            <span className="receive-stock-label">
              Invoice Number <span className="receive-stock-required">*</span>
            </span>
            <input
              className="receive-stock-input"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2026-0234"
            />
          </div>
        </div>

        <div className="receive-stock-row">
          <div className="receive-stock-field">
            <span className="receive-stock-label">
              Date Received <span className="receive-stock-required">*</span>
            </span>
            <input
              type="date"
              className="receive-stock-input"
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
            />
          </div>

          <div className="receive-stock-field">
            <span className="receive-stock-label">Payment Terms</span>
            <div className="receive-stock-seg">
              {PAYMENT_TERMS.map((term) => (
                <button
                  key={term}
                  type="button"
                  className={
                    "receive-stock-seg-btn" + (paymentTerm === term ? " receive-stock-seg-btn--active" : "")
                  }
                  onClick={() => setPaymentTerm(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="receive-stock-field">
          <span className="receive-stock-label">
            Notes <em>optional</em>
          </span>
          <input
            className="receive-stock-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Partial delivery — remaining items expected next week"
          />
        </div>
      </div>

      <div className="receive-stock-card">
        <div className="receive-stock-card-title-row">
          <span className="receive-stock-card-title">Line Items</span>
          <span className="receive-stock-item-count">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="receive-stock-table-wrap">
          <table className="receive-stock-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Batch #</th>
                <th>Expiry</th>
                <th>Qty</th>
                <th>Cost (₦)</th>
                <th>Total</th>
                <th aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const matches = row.searchOpen ? productMatches(row.query) : [];
                const rowTotal = (parseFloat(row.qty) || 0) * (parseFloat(row.cost) || 0);
                return (
                  <tr key={row.key}>
                    <td className="receive-stock-row-index">{index + 1}</td>
                    <td className="receive-stock-cell-product">
                      <input
                        className="receive-stock-cell-input"
                        value={row.query}
                        onChange={(e) => updateRow(index, { query: e.target.value, pid: null, searchOpen: true })}
                        onFocus={() => updateRow(index, { searchOpen: true })}
                        onBlur={() => setTimeout(() => updateRow(index, { searchOpen: false }), 120)}
                        placeholder="Search product…"
                        autoComplete="off"
                      />
                      {row.searchOpen && matches.length > 0 && (
                        <div className="receive-stock-dropdown">
                          {matches.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="receive-stock-dropdown-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectProductForRow(index, p)}
                            >
                              <span className="receive-stock-dropdown-title">{p.name}</span>
                              <span className="receive-stock-dropdown-meta">
                                {p.form} · {formatNaira(p.price)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        className="receive-stock-cell-input"
                        value={row.batch}
                        onChange={(e) => updateRow(index, { batch: e.target.value })}
                        placeholder="Batch #"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="receive-stock-cell-input"
                        value={row.expiry}
                        onChange={(e) => updateRow(index, { expiry: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="receive-stock-cell-input receive-stock-cell-input--num"
                        value={row.qty}
                        onChange={(e) => updateRow(index, { qty: e.target.value })}
                        placeholder="0"
                        min={0}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="receive-stock-cell-input receive-stock-cell-input--num"
                        value={row.cost}
                        onChange={(e) => updateRow(index, { cost: e.target.value })}
                        placeholder="0.00"
                        min={0}
                      />
                    </td>
                    <td className="receive-stock-cell-total">{rowTotal > 0 ? formatNaira(rowTotal) : "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="receive-stock-row-delete"
                        onClick={() => removeRow(index)}
                        aria-label="Remove row"
                      >
                        <Trash2 />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button type="button" className="receive-stock-add-row" onClick={addRow}>
          + Add Row
        </button>
      </div>

      <div className="receive-stock-footer">
        <div className="receive-stock-totals">
          <span className="receive-stock-totals-label">Computed Total</span>
          <span className="receive-stock-totals-value">{formatNaira(computedTotal)}</span>
          <span className="receive-stock-totals-count">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="receive-stock-crosscheck">
          <span className="receive-stock-label">Invoice Total (for cross-check)</span>
          <input
            className="receive-stock-input"
            value={invoiceTotalInput}
            onChange={(e) => setInvoiceTotalInput(e.target.value)}
            placeholder="Enter invoice total"
            inputMode="decimal"
          />
          {hasCrossCheck && (
            <span
              className={
                "receive-stock-crosscheck-hint" +
                (crossCheckMatches
                  ? " receive-stock-crosscheck-hint--ok"
                  : " receive-stock-crosscheck-hint--bad")
              }
            >
              {crossCheckMatches ? "Matches computed total" : "Doesn't match computed total"}
            </span>
          )}
        </div>

        <div className="receive-stock-footer-actions">
          <button type="button" className="receive-stock-draft-btn" onClick={handleSaveDraft}>
            Save Draft
          </button>
          <button type="button" className="receive-stock-submit-btn" disabled={!canSubmit} onClick={handleSubmit}>
            Submit Purchase
          </button>
        </div>
      </div>

      {uploadOpen && <UploadInvoiceModal onClose={() => setUploadOpen(false)} onParsed={handleParsed} />}

      {toast && <div className="receive-stock-toast">{toast}</div>}
    </div>
  );
}

export default ReceiveNewStock;
