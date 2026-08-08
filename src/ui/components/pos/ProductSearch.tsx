import { Search, ScanLine } from "lucide-react";
import type { RefObject } from "react";
import type { Product } from "./pos-data";
import { formatNaira } from "./pos-data";
import "./ProductSearch.css";

interface ProductSearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: Product[];
  onAddProduct: (product: Product) => void;
  onScan: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

function ProductSearch({ query, onQueryChange, results, onAddProduct, onScan, inputRef }: ProductSearchProps) {
  const showResults = results.length > 0;

  return (
    <div className="product-search">
      <div className="product-search-bar">
        <Search className="product-search-icon" />
        <input
          ref={inputRef}
          className="product-search-input"
          placeholder="Scan barcode or search product by name, ID or generic…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) onAddProduct(results[0]);
          }}
        />
        <kbd className="product-search-kbd">F3</kbd>
        <button type="button" className="product-search-scan" onClick={onScan}>
          <ScanLine className="product-search-scan-icon" />
          Scan
        </button>
      </div>

      {showResults && (
        <div className="product-search-results">
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              className="product-search-result"
              onClick={() => onAddProduct(product)}
            >
              <span className="product-search-result-name">
                <span className="product-search-result-title">{product.name}</span>
                <span className="product-search-result-form">{product.form}</span>
              </span>
              <span className="product-search-result-id">{product.id}</span>
              <span className="product-search-result-price">{formatNaira(product.price)}</span>
              <span
                className={`product-search-result-stock${product.stock < 10 ? " product-search-result-stock--low" : ""}`}
              >
                {product.stock} in stock
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductSearch;
