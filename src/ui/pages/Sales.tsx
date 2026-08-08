import { useEffect, useMemo, useRef, useState } from "react";
import ParkedStrip from "../components/pos/ParkedStrip";
import SaleInfoBar from "../components/pos/SaleInfoBar";
import ProductSearch from "../components/pos/ProductSearch";
import SaleTable from "../components/pos/SaleTable";
import LineEditor from "../components/pos/LineEditor";
import TotalsPanel from "../components/pos/TotalsPanel";
import CartPanel from "../components/pos/CartPanel";
import CheckoutModal, {
  type TenderState,
} from "../components/pos/CheckoutModal";
import StatsDrawer from "../components/pos/StatsDrawer";
import {
  CATALOG,
  INITIAL_PARKED,
  VAT_RATE,
  formatNaira,
  type ParkedSale,
  type Product,
  type SaleLine,
} from "../components/pos/pos-data";
import "./Sales.css";

const SERVED_BY = "Chibuzor Irobuisi";

const INITIAL_LINES: SaleLine[] = [
  {
    key: 1,
    pid: "PRD-1042",
    name: "Paracetamol 500mg",
    form: "Tablet · 10s card",
    price: 900,
    qty: 2,
    stock: 240,
    vat: true,
  },
  {
    key: 2,
    pid: "PRD-1204",
    name: "Cough Syrup 100ml",
    form: "Syrup · bottle",
    price: 1100,
    qty: 1,
    stock: 44,
    vat: true,
  },
];

function makeInvoiceNo() {
  return "INV-" + Date.now().toString().slice(-10);
}

function Sales() {
  const [lines, setLines] = useState<SaleLine[]>(INITIAL_LINES);
  const [seq, setSeq] = useState(3);
  const [selected, setSelected] = useState<number | null>(1);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountMode, setDiscountMode] = useState<"pct" | "amt">("amt");
  const [discountInput, setDiscountInput] = useState("0");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [tender, setTender] = useState<TenderState>({
    cash: "",
    pos: "",
    transfer: "",
    cheque: "",
  });
  const [parked, setParked] = useState<ParkedSale[]>(INITIAL_PARKED);

  const [invoiceNo] = useState(makeInvoiceNo);
  const saleDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const flash = (message: string) => {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2200);
  };

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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CATALOG.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.form.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  const selectedLine = useMemo(
    () => lines.find((l) => l.key === selected) ?? null,
    [lines, selected],
  );

  const gross = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.qty, 0),
    [lines],
  );

  const discount = useMemo(() => {
    const v = parseFloat(discountInput) || 0;
    const d = discountMode === "pct" ? (gross * v) / 100 : v;
    return Math.max(0, Math.min(d, gross));
  }, [discountInput, discountMode, gross]);

  const vatAmount = useMemo(() => {
    if (!gross) return 0;
    const ratio = 1 - discount / gross;
    const vatableGross = lines
      .filter((l) => l.vat)
      .reduce((sum, l) => sum + l.price * l.qty, 0);
    return vatableGross * ratio * VAT_RATE;
  }, [lines, gross, discount]);

  const total = gross - discount + vatAmount;

  function addProduct(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.pid === product.id);
      if (existing) {
        setSelected(existing.key);
        return prev.map((l) =>
          l.pid === product.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      const key = seq;
      setSeq(key + 1);
      setSelected(key);
      return [
        ...prev,
        {
          key,
          pid: product.id,
          name: product.name,
          form: product.form,
          price: product.price,
          qty: 1,
          stock: product.stock,
          vat: product.vat,
        },
      ];
    });
    setQuery("");
  }

  function bump(key: number, delta: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.key === key ? { ...l, qty: Math.max(1, l.qty + delta) } : l,
      ),
    );
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

  function openCheckout() {
    if (lines.length === 0) {
      flash("Add an item before checkout");
      return;
    }
    setCheckoutOpen(true);
  }

  function completeSale() {
    setCheckoutOpen(false);
    setLines([]);
    setSelected(null);
    setDiscountInput("0");
    setTender({ cash: "", pos: "", transfer: "", cheque: "" });
    flash("Sale completed · receipt printing");
  }

  function parkSale(kind: "Hold" | "Draft") {
    if (lines.length === 0) {
      flash("Nothing to " + kind.toLowerCase());
      return;
    }
    const entry: ParkedSale = {
      id: kind[0].toLowerCase() + Date.now(),
      kind,
      name: customer,
      meta: `${lines.length} item(s) · ${formatNaira(total)}`,
    };
    setParked((prev) => [entry, ...prev]);
    setLines([]);
    setSelected(null);
    setDiscountInput("0");
    flash(kind + "ed · " + customer);
  }

  function clearSale() {
    setLines([]);
    setSelected(null);
    setDiscountInput("0");
    flash("Sale cleared");
  }

  function resumeParked(sale: ParkedSale) {
    flash("Resumed " + sale.kind.toLowerCase() + " · " + sale.name);
  }

  const vatRatePct = VAT_RATE * 100;

  return (
    <div className="sales-page">
      <ParkedStrip parked={parked} onResume={resumeParked} />

      <div className="sales-main-grid">
        <div className="sales-left-column">
          <SaleInfoBar
            customer={customer}
            onSelectCustomer={setCustomer}
            saleDate={saleDate}
            servedBy={SERVED_BY}
            invoiceNo={invoiceNo}
          />

          <ProductSearch
            query={query}
            onQueryChange={setQuery}
            results={results}
            onAddProduct={addProduct}
            onScan={simulateScan}
            inputRef={searchInputRef}
          />

          <SaleTable
            lines={lines}
            selectedKey={selected}
            onSelectLine={setSelected}
            onIncSelected={() => selectedLine && bump(selectedLine.key, 1)}
            onDecSelected={() => selectedLine && bump(selectedLine.key, -1)}
            onRemoveSelected={() =>
              selectedLine && removeLine(selectedLine.key)
            }
          />

          <div className="sales-bottom-row">
            <LineEditor
              selectedLine={selectedLine}
              onChangePrice={(price) =>
                selectedLine &&
                setLines((prev) =>
                  prev.map((l) =>
                    l.key === selectedLine.key ? { ...l, price } : l,
                  ),
                )
              }
              onChangeQty={(qty) =>
                selectedLine &&
                setLines((prev) =>
                  prev.map((l) =>
                    l.key === selectedLine.key ? { ...l, qty } : l,
                  ),
                )
              }
              onPost={() =>
                flash(
                  selectedLine
                    ? selectedLine.name + " updated on the sale"
                    : "Select a line first",
                )
              }
            />

            <TotalsPanel
              lines={lines}
              gross={gross}
              discount={discount}
              vatAmount={vatAmount}
              vatRatePct={vatRatePct}
              total={total}
              discountOpen={discountOpen}
              onToggleDiscount={() => setDiscountOpen((o) => !o)}
              discountMode={discountMode}
              onSetDiscountMode={setDiscountMode}
              discountInput={discountInput}
              onChangeDiscountInput={setDiscountInput}
            />
          </div>
        </div>

        <div className="sales-right-column">
          <CartPanel
            lines={lines}
            selectedKey={selected}
            onSelectLine={setSelected}
            onInc={(key) => bump(key, 1)}
            onDec={(key) => bump(key, -1)}
            onRemove={removeLine}
            onHold={() => parkSale("Hold")}
            onClear={clearSale}
            onDraft={() => parkSale("Draft")}
            onCheckout={openCheckout}
            gross={gross}
            discount={discount}
            vatAmount={vatAmount}
            vatRatePct={vatRatePct}
            total={total}
          />
        </div>
      </div>

      <StatsDrawer
        open={drawerOpen}
        onToggle={() => setDrawerOpen((o) => !o)}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        customer={customer}
        lineCount={lines.length}
        invoiceNo={invoiceNo}
        total={total}
        tender={tender}
        onChangeTender={(key, value) =>
          setTender((prev) => ({ ...prev, [key]: value }))
        }
        onFillBalance={(key) => {
          const allocatedElsewhere = Object.entries(tender).reduce(
            (sum, [k, v]) => sum + (k === key ? 0 : parseFloat(v) || 0),
            0,
          );
          const remaining = Math.max(0, total - allocatedElsewhere);
          setTender((prev) => ({
            ...prev,
            [key]: String(Math.round(remaining * 100) / 100),
          }));
        }}
        onComplete={completeSale}
      />

      {toast && <div className="sales-toast">{toast}</div>}
    </div>
  );
}

export default Sales;
