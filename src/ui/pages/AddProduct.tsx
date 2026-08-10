import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanLine } from "lucide-react";
import "./AddProduct.css";

function generateBarcode(): string {
  let code = "615";
  for (let i = 0; i < 10; i++) code += Math.floor(Math.random() * 10);
  return code;
}

function AddProduct() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [form, setForm] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [vat, setVat] = useState(true);
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function flash(message: string) {
    setToast(message);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2200);
  }

  function scanBarcode() {
    setBarcode(generateBarcode());
    flash("Barcode scanned");
  }

  function reset() {
    setName("");
    setForm("");
    setBarcode("");
    setPrice("");
    setVat(true);
    setStock("");
    setDescription("");
  }

  const priceValue = parseFloat(price);
  const stockValue = parseInt(stock, 10);
  const canSubmit =
    name.trim().length > 0 &&
    form.trim().length > 0 &&
    !Number.isNaN(priceValue) &&
    priceValue > 0 &&
    !Number.isNaN(stockValue) &&
    stockValue >= 0;

  function handleSubmit() {
    if (!canSubmit) return;
    flash("Product added · " + name.trim());
    reset();
  }

  return (
    <div className="add-product-page">
      <div className="add-product-header">
        <h1>Add Product</h1>
        <p>Create a new product in your catalog.</p>
      </div>

      <div className="add-product-card">
        <div className="add-product-field">
          <span className="add-product-label">Product name *</span>
          <input
            className="add-product-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Paracetamol 500mg"
            autoFocus
          />
        </div>

        <div className="add-product-field">
          <span className="add-product-label">Form / packaging *</span>
          <input
            className="add-product-input"
            value={form}
            onChange={(e) => setForm(e.target.value)}
            placeholder="e.g. Tablet · 10s card"
          />
        </div>

        <div className="add-product-field">
          <span className="add-product-label">
            Barcode <em>optional</em>
          </span>
          <div className="add-product-barcode-row">
            <input
              className="add-product-input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or enter manually"
            />
            <button type="button" className="add-product-scan-btn" onClick={scanBarcode}>
              <ScanLine className="add-product-scan-icon" />
              Scan
            </button>
          </div>
        </div>

        <div className="add-product-row">
          <div className="add-product-field">
            <span className="add-product-label">Price (₦) *</span>
            <input
              className="add-product-input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>
          <div className="add-product-field">
            <span className="add-product-label">Initial stock *</span>
            <input
              className="add-product-input"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              inputMode="numeric"
              placeholder="0"
            />
          </div>
        </div>

        <label className="add-product-checkbox">
          <input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} />
          VAT applicable
        </label>

        <div className="add-product-field">
          <span className="add-product-label">
            Description <em>optional</em>
          </span>
          <textarea
            className="add-product-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What is this product used for?"
          />
        </div>

        <div className="add-product-footer">
          <button type="button" className="add-product-cancel" onClick={() => navigate("/dashboard/inventory")}>
            Cancel
          </button>
          <button type="button" className="add-product-submit" disabled={!canSubmit} onClick={handleSubmit}>
            Add product
          </button>
        </div>
      </div>

      {toast && <div className="add-product-toast">{toast}</div>}
    </div>
  );
}

export default AddProduct;
