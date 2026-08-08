import type { SaleLine } from "./pos-data";
import { formatNaira } from "./pos-data";
import "./LineEditor.css";

interface LineEditorProps {
  selectedLine: SaleLine | null;
  onChangePrice: (price: number) => void;
  onChangeQty: (qty: number) => void;
  onPost: () => void;
}

function LineEditor({ selectedLine, onChangePrice, onChangeQty, onPost }: LineEditorProps) {
  const amount = selectedLine ? selectedLine.price * selectedLine.qty : 0;
  const serverQty = selectedLine ? selectedLine.stock - selectedLine.qty : 0;

  return (
    <div className="line-editor">
      <div className="line-editor-header">
        <span className="line-editor-label">Line editor</span>
        <span className="line-editor-selected">{selectedLine ? selectedLine.name : "No line selected"}</span>
      </div>

      <div className="line-editor-grid">
        <span className="line-editor-field-label">Sell price</span>
        <input
          className="line-editor-input"
          value={selectedLine ? String(selectedLine.price) : "0"}
          disabled={!selectedLine}
          onChange={(e) => onChangePrice(parseFloat(e.target.value) || 0)}
        />

        <span className="line-editor-field-label">Qty to sell</span>
        <input
          className="line-editor-input"
          value={selectedLine ? String(selectedLine.qty) : "1"}
          disabled={!selectedLine}
          onChange={(e) => onChangeQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />

        <span className="line-editor-field-label">Amount</span>
        <div className="line-editor-static">{formatNaira(amount)}</div>

        <span className="line-editor-field-label">Server qty</span>
        <div className="line-editor-static line-editor-static--between">
          <span>{selectedLine ? serverQty : 0}</span>
          <span className="line-editor-static-hint">in stock</span>
        </div>
      </div>

      <button type="button" className="line-editor-post" disabled={!selectedLine} onClick={onPost}>
        Post to sale
      </button>
    </div>
  );
}

export default LineEditor;
