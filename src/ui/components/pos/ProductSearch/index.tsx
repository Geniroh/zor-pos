import { useState } from "react";
import { AlertTriangle, Info, PackageSearch, Search, ScanLine } from "lucide-react";
import type { RefObject } from "react";
import type { Product, SaleLine } from "../pos-data";
import { formatNaira, productInfoExchange, productName } from "../pos-data";
import { interactionsForCandidate, interactionExchange, otherPid } from "../drug-interactions-data";
import { useAiAssist } from "../../../context/AiAssistContext";
import LogLostSaleModal, { type LostSaleDraft } from "../LogLostSaleModal";
import "./index.css";

interface ProductSearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: Product[];
  lines: SaleLine[];
  onAddProduct: (product: Product) => void;
  onScan: () => void;
  onLogLostSale: (draft: LostSaleDraft) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

function ProductSearch({
  query,
  onQueryChange,
  results,
  lines,
  onAddProduct,
  onScan,
  onLogLostSale,
  inputRef,
}: ProductSearchProps) {
  const hasQuery = query.trim().length > 0;
  const { openWithExchange } = useAiAssist();
  const [lostSaleOpen, setLostSaleOpen] = useState(false);

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

      {hasQuery && (
        <div className="product-search-results">
          {results.length > 0 ? (
            results.map((product) => {
              const interactions = interactionsForCandidate(product.id, lines);
              return (
                <div key={product.id} className="product-search-result" onClick={() => onAddProduct(product)}>
                  <span className="product-search-result-name">
                    <span className="product-search-result-name-row">
                      <span className="product-search-result-title">{product.name}</span>
                      <button
                        type="button"
                        className="product-search-info-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openWithExchange(productInfoExchange(product));
                        }}
                        title={`What is ${product.name}?`}
                        aria-label={`What is ${product.name}?`}
                      >
                        <Info />
                      </button>
                      {interactions.length > 0 && (
                        <button
                          type="button"
                          className="product-search-interaction-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWithExchange(interactionExchange(interactions[0]));
                          }}
                          title={`Interacts with ${productName(otherPid(interactions[0], product.id))} already in the sale`}
                          aria-label={`Interacts with ${productName(otherPid(interactions[0], product.id))}`}
                        >
                          <AlertTriangle />
                        </button>
                      )}
                    </span>
                    <span className="product-search-result-form">{product.form}</span>
                  </span>
                  <span className="product-search-result-id">{product.id}</span>
                  <span className="product-search-result-price">{formatNaira(product.price)}</span>
                  <span
                    className={`product-search-result-stock${product.stock < 10 ? " product-search-result-stock--low" : ""}`}
                  >
                    {product.stock} in stock
                  </span>
                </div>
              );
            })
          ) : (
            <div className="product-search-empty">No matches for &quot;{query}&quot;</div>
          )}

          <button type="button" className="product-search-lost-sale" onClick={() => setLostSaleOpen(true)}>
            <PackageSearch className="product-search-lost-sale-icon" />
            Can&apos;t find what they need? Log a lost sale
          </button>
        </div>
      )}

      {lostSaleOpen && (
        <LogLostSaleModal
          initialProduct={query}
          onClose={() => setLostSaleOpen(false)}
          onSubmit={onLogLostSale}
        />
      )}
    </div>
  );
}

export default ProductSearch;
