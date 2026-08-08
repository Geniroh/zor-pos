import { useState } from "react";
import { AlertTriangle, Info, Plus, Minus, Trash2 } from "lucide-react";
import type { SaleLine } from "./pos-data";
import { VAT_RATE, findProduct, formatNaira, productInfoExchange, productName } from "./pos-data";
import { interactionExchange, interactionsForLine, otherPid } from "./drug-interactions-data";
import { useAiAssist } from "../../context/AiAssistContext";
import "./SaleTable.css";

interface SaleTableProps {
  lines: SaleLine[];
  selectedKey: number | null;
  onSelectLine: (key: number) => void;
  onIncSelected: () => void;
  onDecSelected: () => void;
  onRemoveSelected: () => void;
  onChangePrice: (key: number, price: number) => void;
}

function SaleTable({
  lines,
  selectedKey,
  onSelectLine,
  onIncSelected,
  onDecSelected,
  onRemoveSelected,
  onChangePrice,
}: SaleTableProps) {
  const hasSelection = selectedKey !== null;
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [draftPrice, setDraftPrice] = useState("");
  const { openWithExchange } = useAiAssist();

  function startEditing(line: SaleLine) {
    setEditingKey(line.key);
    setDraftPrice(String(line.price));
  }

  function commitEditing(key: number) {
    onChangePrice(key, parseFloat(draftPrice) || 0);
    setEditingKey(null);
  }

  return (
    <div className="sale-table-row">
      <div className="sale-table">
        <div className="sale-table-header">
          <div>Product ID</div>
          <div>Product name</div>
          <div className="sale-table-align-right">Price</div>
          <div className="sale-table-align-center">Qty</div>
          <div className="sale-table-align-right">VAT</div>
          <div className="sale-table-align-right">Amount</div>
        </div>

        <div className="sale-table-body">
          {lines.length === 0 ? (
            <div className="sale-table-empty">
              <div className="sale-table-empty-icon" />
              <div className="sale-table-empty-title">No items on this sale yet</div>
              <div className="sale-table-empty-hint">
                Scan a barcode or search above — the item lands here instantly.
              </div>
            </div>
          ) : (
            lines.map((line) => {
              const amount = line.price * line.qty;
              const vatAmount = line.vat ? formatNaira(amount * VAT_RATE) : "—";
              const isEditingPrice = editingKey === line.key;
              const interactions = interactionsForLine(line.pid, lines);
              const product = findProduct(line.pid);
              return (
                <div
                  key={line.key}
                  className={`sale-table-line${line.key === selectedKey ? " sale-table-line--selected" : ""}`}
                  onClick={() => onSelectLine(line.key)}
                >
                  <div className="sale-table-mono sale-table-muted">{line.pid}</div>
                  <div className="sale-table-name">
                    <div className="sale-table-name-row">
                      <span className="sale-table-name-title">{line.name}</span>
                      {product && (
                        <button
                          type="button"
                          className="sale-table-info-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWithExchange(productInfoExchange(product));
                          }}
                          title={`What is ${product.name}?`}
                          aria-label={`What is ${product.name}?`}
                        >
                          <Info />
                        </button>
                      )}
                      {interactions.length > 0 && (
                        <button
                          type="button"
                          className="sale-table-interaction-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWithExchange(interactionExchange(interactions[0]));
                          }}
                          title={`Interacts with ${productName(otherPid(interactions[0], line.pid))} — click to ask AI Assist`}
                          aria-label={`Interacts with ${productName(otherPid(interactions[0], line.pid))}`}
                        >
                          <AlertTriangle />
                        </button>
                      )}
                    </div>
                    <span className="sale-table-name-sub">{line.form}</span>
                  </div>
                  {isEditingPrice ? (
                    <input
                      className="sale-table-price-input"
                      value={draftPrice}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setDraftPrice(e.target.value)}
                      onBlur={() => commitEditing(line.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEditing(line.key);
                        if (e.key === "Escape") setEditingKey(null);
                      }}
                    />
                  ) : (
                    <div
                      className="sale-table-mono sale-table-align-right sale-table-price"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(line);
                      }}
                      title="Click to edit price"
                    >
                      {formatNaira(line.price)}
                    </div>
                  )}
                  <div className="sale-table-mono sale-table-align-center sale-table-qty">{line.qty}</div>
                  <div className="sale-table-mono sale-table-align-right sale-table-muted">{vatAmount}</div>
                  <div className="sale-table-mono sale-table-align-right sale-table-amount">
                    {formatNaira(amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="sale-table-footer">
          <span>{lines.length ? `${lines.length} line(s) · selected row edits with the rail` : "Nothing posted yet"}</span>
          <span className="sale-table-mono">Click price to edit · Enter = add · rail = qty/remove</span>
        </div>
      </div>

      <div className="sale-table-rail">
        <button
          type="button"
          className="sale-table-rail-btn"
          disabled={!hasSelection}
          onClick={onIncSelected}
          aria-label="Increase quantity"
        >
          <Plus />
        </button>
        <button
          type="button"
          className="sale-table-rail-btn"
          disabled={!hasSelection}
          onClick={onDecSelected}
          aria-label="Decrease quantity"
        >
          <Minus />
        </button>
        <button
          type="button"
          className="sale-table-rail-btn sale-table-rail-btn--danger"
          disabled={!hasSelection}
          onClick={onRemoveSelected}
          aria-label="Remove line"
        >
          <Trash2 />
        </button>
      </div>
    </div>
  );
}

export default SaleTable;
