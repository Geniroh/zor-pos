import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import SalesActionPills from "../../components/pos/SalesActionPills";
import HeldSalesView from "../../components/pos/HeldSalesView";
import ProductSearch from "../../components/pos/ProductSearch";
import type { LostSaleDraft } from "../../components/pos/LogLostSaleModal";
import SaleTable from "../../components/pos/SaleTable";
import SaleSummaryPanel from "../../components/pos/SaleSummaryPanel";
import CheckoutModal, { type TenderState } from "../../components/pos/CheckoutModal";
import StatsDrawer from "../../components/pos/StatsDrawer";
import { useSidebar } from "../../context/SidebarContext";
import {
  CATALOG,
  CUSTOMERS,
  INITIAL_PARKED,
  VAT_RATE,
  type Customer,
  type ParkedSale,
  type Product,
  type SaleLine,
} from "../../components/pos/pos-data";
import "./index.css";

const SERVED_BY = "Chibuzor Irobuisi";
const DEFAULT_CUSTOMER = "Walk-in Customer";

const INITIAL_LINES: SaleLine[] = [
  { key: 1, pid: "PRD-1042", name: "Paracetamol 500mg", form: "Tablet · 10s card", price: 900, qty: 2, stock: 240, vat: true },
  { key: 2, pid: "PRD-1204", name: "Cough Syrup 100ml", form: "Syrup · bottle", price: 1100, qty: 1, stock: 44, vat: true },
];

function makeInvoiceNo() {
  return "INV-" + Date.now().toString().slice(-10);
}

type View = "sale" | "held";

function Sales() {
  const { collapsed: sidebarCollapsed, toggleCollapsed: toggleSidebarCollapsed } = useSidebar();
  const summaryCollapsed = !sidebarCollapsed;

  // "New Sale" on a customer's detail page navigates here with their name in
  // router state; read once on mount so the sale opens already attributed.
  const location = useLocation();
  const seededCustomer = (location.state as { customerName?: string } | null)?.customerName;

  const [view, setView] = useState<View>("sale");
  const [lines, setLines] = useState<SaleLine[]>(INITIAL_LINES);
  const [seq, setSeq] = useState(1000);
  const [selected, setSelected] = useState<number | null>(1);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState(seededCustomer ?? DEFAULT_CUSTOMER);
  const [customers, setCustomers] = useState<Customer[]>(() =>
    seededCustomer && !CUSTOMERS.some((c) => c.name === seededCustomer)
      ? [...CUSTOMERS, { name: seededCustomer, phone: "—" }]
      : CUSTOMERS,
  );
  const [discountMode, setDiscountMode] = useState<"pct" | "amt">("amt");
  const [discountInput, setDiscountInput] = useState("0");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [tender, setTender] = useState<TenderState>({ cash: "", pos: "", transfer: "", cheque: "" });
  const [parked, setParked] = useState<ParkedSale[]>(INITIAL_PARKED);

  const [invoiceNo, setInvoiceNo] = useState(makeInvoiceNo);
  const saleDate = useMemo(
    () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    [],
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = (message: string) => {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2200);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CATALOG.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.form.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  const selectedLine = useMemo(() => lines.find((l) => l.key === selected) ?? null, [lines, selected]);

  const gross = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.qty, 0), [lines]);

  const discount = useMemo(() => {
    const v = parseFloat(discountInput) || 0;
    const d = discountMode === "pct" ? (gross * v) / 100 : v;
    return Math.max(0, Math.min(d, gross));
  }, [discountInput, discountMode, gross]);

  const vatAmount = useMemo(() => {
    if (!gross) return 0;
    const ratio = 1 - discount / gross;
    const vatableGross = lines.filter((l) => l.vat).reduce((sum, l) => sum + l.price * l.qty, 0);
    return vatableGross * ratio * VAT_RATE;
  }, [lines, gross, discount]);

  const total = gross - discount + vatAmount;

  function addProduct(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.pid === product.id);
      if (existing) {
        setSelected(existing.key);
        return prev.map((l) => (l.pid === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      const key = seq;
      setSeq(key + 1);
      setSelected(key);
      return [
        ...prev,
        { key, pid: product.id, name: product.name, form: product.form, price: product.price, qty: 1, stock: product.stock, vat: product.vat },
      ];
    });
    setQuery("");
  }

  function bump(key: number, delta: number) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, qty: Math.max(1, l.qty + delta) } : l)));
  }

  function changePrice(key: number, price: number) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, price } : l)));
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l.key !== key));
    setSelected((s) => (s === key ? null : s));
  }

  function simulateScan() {
    const product = CATALOG[Math.floor(Math.random() * CATALOG.length)];
    addProduct(product);
    flash("Scanned · " + product.name);
  }

  function logLostSale(draft: LostSaleDraft) {
    setQuery("");
    flash("Logged lost sale · " + draft.product);
  }

  function openCheckout() {
    if (lines.length === 0) {
      flash("Add an item before checkout");
      return;
    }
    setCheckoutOpen(true);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCheckoutOpen(false);
      if (event.key === "F3") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "F5") {
        event.preventDefault();
        openCheckout();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length]);

  function completeSale() {
    setCheckoutOpen(false);
    setLines([]);
    setSelected(null);
    setDiscountInput("0");
    setTender({ cash: "", pos: "", transfer: "", cheque: "" });
    flash("Sale completed · receipt printing");
  }

  function holdSale() {
    if (lines.length === 0) {
      flash("Nothing to hold");
      return;
    }
    const entry: ParkedSale = {
      id: "h" + Date.now(),
      customer,
      servedBy: SERVED_BY,
      heldAt: Date.now(),
      lines,
    };
    setParked((prev) => [entry, ...prev]);
    setLines([]);
    setSelected(null);
    setDiscountInput("0");
    flash("Held · " + customer);
  }

  function applyDiscount(mode: "pct" | "amt", value: string) {
    setDiscountMode(mode);
    setDiscountInput(value);
  }

  function addCustomer(newCustomer: Customer) {
    setCustomers((prev) => [...prev, newCustomer]);
  }

  function clearSale() {
    setLines([]);
    setSelected(null);
    setDiscountInput("0");
    flash("Sale cleared");
  }

  function newSale() {
    setLines([]);
    setSelected(null);
    setDiscountInput("0");
    setCustomer(DEFAULT_CUSTOMER);
    setQuery("");
    setTender({ cash: "", pos: "", transfer: "", cheque: "" });
    setCheckoutOpen(false);
    setInvoiceNo(makeInvoiceNo());
    setView("sale");
    flash("New sale started");
  }

  function resumeHeld(sale: ParkedSale) {
    const base = seq;
    const renumbered = sale.lines.map((l, i) => ({ ...l, key: base + i }));
    setSeq(base + renumbered.length);
    setLines(renumbered);
    setSelected(renumbered[0]?.key ?? null);
    setCustomer(sale.customer);
    setParked((prev) => prev.filter((p) => p.id !== sale.id));
    setView("sale");
    flash("Resumed · " + sale.customer);
  }

  const vatRatePct = VAT_RATE * 100;
  const isHeldView = view === "held";

  return (
    <div className="sales-page">
      <SalesActionPills
        isHeldViewActive={isHeldView}
        heldCount={parked.length}
        onNewSale={newSale}
        onToggleHeldView={() => setView((v) => (v === "held" ? "sale" : "held"))}
        onOpenHistory={() => window.electronAPI?.openSalesHistory()}
      />

      {isHeldView ? (
        <HeldSalesView sales={parked} onResume={resumeHeld} />
      ) : (
        <div className={`sales-main-grid${summaryCollapsed ? " sales-main-grid--summary-collapsed" : ""}`}>
          <div className="sales-left-column">
            <ProductSearch
              query={query}
              onQueryChange={setQuery}
              results={results}
              lines={lines}
              onAddProduct={addProduct}
              onScan={simulateScan}
              onLogLostSale={logLostSale}
              inputRef={searchInputRef}
            />

            <SaleTable
              lines={lines}
              selectedKey={selected}
              onSelectLine={setSelected}
              onIncSelected={() => selectedLine && bump(selectedLine.key, 1)}
              onDecSelected={() => selectedLine && bump(selectedLine.key, -1)}
              onRemoveSelected={() => selectedLine && removeLine(selectedLine.key)}
              onChangePrice={changePrice}
            />
          </div>

          <div className="sales-right-column">
            <SaleSummaryPanel
              lineCount={lines.length}
              customer={customer}
              customers={customers}
              onSelectCustomer={setCustomer}
              onAddCustomer={addCustomer}
              saleDate={saleDate}
              servedBy={SERVED_BY}
              invoiceNo={invoiceNo}
              onHold={holdSale}
              onClear={clearSale}
              onCheckout={openCheckout}
              gross={gross}
              discount={discount}
              vatAmount={vatAmount}
              vatRatePct={vatRatePct}
              total={total}
              discountMode={discountMode}
              discountInput={discountInput}
              onApplyDiscount={applyDiscount}
              collapsed={summaryCollapsed}
              onToggleCollapsed={toggleSidebarCollapsed}
            />
          </div>
        </div>
      )}

      <StatsDrawer open={drawerOpen} onToggle={() => setDrawerOpen((o) => !o)} />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        customer={customer}
        lineCount={lines.length}
        invoiceNo={invoiceNo}
        saleDate={saleDate}
        servedBy={SERVED_BY}
        total={total}
        tender={tender}
        onChangeTender={(key, value) => setTender((prev) => ({ ...prev, [key]: value }))}
        onFillBalance={(key) => {
          const allocatedElsewhere = Object.entries(tender).reduce(
            (sum, [k, v]) => sum + (k === key ? 0 : parseFloat(v) || 0),
            0,
          );
          const remaining = Math.max(0, total - allocatedElsewhere);
          setTender((prev) => ({ ...prev, [key]: String(Math.round(remaining * 100) / 100) }));
        }}
        onComplete={completeSale}
      />

      {toast && <div className="sales-toast">{toast}</div>}
    </div>
  );
}

export default Sales;
