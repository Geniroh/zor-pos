import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ImagePlus, Plus, ScanLine, X } from "lucide-react";
import { CATALOG, type Product } from "../components/pos/pos-data";
import Accordion from "../components/Accordion";
import "./AddProduct.css";

const CATEGORIES = [
  "Medicines",
  "Groceries",
  "Toiletries & Personal Care",
  "Beverages",
  "Household Supplies",
  "Baby Care",
];

const UNITS = ["Piece", "Pack", "Carton", "Box", "Bottle", "Strip", "Kg", "Litre"];

function generateBarcode(): string {
  let code = "615";
  for (let i = 0; i < 10; i++) code += Math.floor(Math.random() * 10);
  return code;
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="add-product-select-wrap">
      <select className="add-product-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="add-product-select-icon" />
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="add-product-card">
      <div className="add-product-card-title">{title}</div>
      {children}
    </div>
  );
}

function AddProduct() {
  const [name, setName] = useState("");
  const [nameOpen, setNameOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [vatExempt, setVatExempt] = useState(false);
  const [barcode, setBarcode] = useState("");

  const [pricingOpen, setPricingOpen] = useState(false);
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageDragOver, setImageDragOver] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);

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

  const nameSuggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return CATALOG.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [name]);

  function selectSuggestion(product: Product) {
    setName(product.name);
    setDescription(product.description);
    setVatExempt(!product.vat);
    setBarcode(product.barcode);
    setNameOpen(false);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...urls]);
  }

  function removeImage(index: number) {
    const url = images[index];
    if (url) URL.revokeObjectURL(url);
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    setSelectedImage((prev) => (next.length === 0 ? 0 : Math.min(prev, next.length - 1)));
  }

  function reset() {
    setName("");
    setDescription("");
    setSku("");
    setUnit("");
    setCategory("");
    setVatExempt(false);
    setBarcode("");
    setPricingOpen(false);
    setCostPrice("");
    setSellingPrice("");
    setReorderLevel("");
    setBatchNumber("");
    setExpiryDate("");
    images.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
  }

  const canSubmit = name.trim().length > 0 && category !== "" && sku.trim().length > 0 && unit !== "";

  function handleSubmit() {
    if (!canSubmit) return;
    flash("Product added · " + name.trim());
    reset();
  }

  function handleSaveDraft() {
    flash(name.trim() ? "Saved as draft · " + name.trim() : "Saved as draft");
  }

  return (
    <div className="add-product-page">
      <div className="add-product-topbar">
        <div>
          <div className="add-product-title">Add New Product</div>
          <div className="add-product-subtitle">Create a new item in your inventory</div>
        </div>
        <div className="add-product-topbar-actions">
          <button type="button" className="add-product-draft-btn" onClick={handleSaveDraft}>
            Save as Draft
          </button>
          <button type="button" className="add-product-submit" disabled={!canSubmit} onClick={handleSubmit}>
            Add Product
          </button>
        </div>
      </div>

      <div className="add-product-body">
        <div className="add-product-column">
          <Card title="General Information">
            <div className="add-product-field">
              <span className="add-product-label">Scan Barcode</span>
              <div className="add-product-barcode-row">
                <input
                  className="add-product-input"
                  value={barcode}
                  readOnly
                  placeholder="No barcode scanned yet"
                />
                <button type="button" className="add-product-scan-btn" onClick={scanBarcode}>
                  <ScanLine className="add-product-scan-icon" />
                  Scan
                </button>
              </div>
            </div>

            <div className="add-product-field add-product-field--name">
              <span className="add-product-label">Product name *</span>
              <input
                className="add-product-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameOpen(true);
                }}
                onFocus={() => setNameOpen(true)}
                onBlur={() => setTimeout(() => setNameOpen(false), 120)}
                placeholder="Start typing to search your catalog…"
                autoComplete="off"
                autoFocus
              />
              {nameOpen && nameSuggestions.length > 0 && (
                <div className="add-product-name-results">
                  {nameSuggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="add-product-name-result"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(product)}
                    >
                      <span className="add-product-name-result-title">{product.name}</span>
                      <span className="add-product-name-result-meta">
                        {product.form} · {product.id}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="add-product-field">
              <span className="add-product-label">
                Description <em>optional</em>
              </span>
              <textarea
                className="add-product-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Short description of the product…"
              />
            </div>

            <div className="add-product-row">
              <div className="add-product-field">
                <span className="add-product-label">SKU *</span>
                <input
                  className="add-product-input"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. PRD-1366"
                />
              </div>
              <div className="add-product-field">
                <span className="add-product-label">Unit *</span>
                <SelectField value={unit} onChange={setUnit} placeholder="Select unit" options={UNITS} />
              </div>
            </div>

            <label className="add-product-checkbox">
              <input type="checkbox" checked={vatExempt} onChange={(e) => setVatExempt(e.target.checked)} />
              VAT Exempt
            </label>
          </Card>

          <Accordion
            title="Pricing & Stock"
            badge="Optional"
            open={pricingOpen}
            onToggle={() => setPricingOpen((o) => !o)}
          >
            <div className="add-product-row">
              <div className="add-product-field">
                <span className="add-product-label">Cost Price</span>
                <input
                  className="add-product-input"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  inputMode="decimal"
                  placeholder="₦0.00"
                />
              </div>
              <div className="add-product-field">
                <span className="add-product-label">Selling Price</span>
                <input
                  className="add-product-input"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  inputMode="decimal"
                  placeholder="₦0.00"
                />
              </div>
            </div>
            <div className="add-product-row">
              <div className="add-product-field">
                <span className="add-product-label">Reorder Level</span>
                <input
                  className="add-product-input"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 10"
                />
              </div>
              <div className="add-product-field">
                <span className="add-product-label">Batch Number</span>
                <input
                  className="add-product-input"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BN-2291"
                />
              </div>
            </div>
            <div className="add-product-field">
              <span className="add-product-label">Expiry Date</span>
              <input
                type="date"
                className="add-product-input"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </Accordion>
        </div>

        <div className="add-product-column add-product-column--side">
          <Card title="Product Images">
            <div
              className={"add-product-image-main" + (imageDragOver ? " add-product-image-main--drag" : "")}
              onClick={() => mainInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setImageDragOver(true);
              }}
              onDragLeave={() => setImageDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setImageDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <input
                ref={mainInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {images.length > 0 ? (
                <>
                  <img src={images[selectedImage]} alt="" className="add-product-image-preview" />
                  <button
                    type="button"
                    className="add-product-image-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(selectedImage);
                    }}
                    aria-label="Remove photo"
                  >
                    <X className="add-product-image-remove-icon" />
                  </button>
                </>
              ) : (
                <div className="add-product-image-placeholder">
                  <ImagePlus className="add-product-image-icon" />
                  <span>Drop product photos, or click to upload</span>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="add-product-image-thumbs">
                {images.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    className={
                      "add-product-image-thumb" + (i === selectedImage ? " add-product-image-thumb--active" : "")
                    }
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Preview photo ${i + 1}`}
                  >
                    <img src={url} alt="" />
                  </button>
                ))}
                <button
                  type="button"
                  className="add-product-image-thumb add-product-image-thumb--add"
                  onClick={() => mainInputRef.current?.click()}
                  aria-label="Add another photo"
                >
                  <Plus className="add-product-image-thumb-add-icon" />
                </button>
              </div>
            )}

            <div className="add-product-image-hint">
              Drag and drop, or click to upload. Click a thumbnail to preview it above.
            </div>
          </Card>

          <Card title="Category">
            <div className="add-product-field">
              <span className="add-product-label">Product category *</span>
              <SelectField
                value={category}
                onChange={setCategory}
                placeholder="Select category"
                options={CATEGORIES}
              />
            </div>
          </Card>
        </div>
      </div>

      {toast && <div className="add-product-toast">{toast}</div>}
    </div>
  );
}

export default AddProduct;
