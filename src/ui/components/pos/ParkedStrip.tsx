import type { ParkedSale } from "./pos-data";
import "./ParkedStrip.css";

interface ParkedStripProps {
  parked: ParkedSale[];
  onResume: (sale: ParkedSale) => void;
}

function ParkedStrip({ parked, onResume }: ParkedStripProps) {
  if (parked.length === 0) return null;

  return (
    <div className="parked-strip">
      <span className="parked-strip-label">Parked</span>
      {parked.map((sale) => (
        <button
          key={sale.id}
          type="button"
          className="parked-chip"
          onClick={() => onResume(sale)}
        >
          <span className="parked-chip-text">
            <span className="parked-chip-name">{sale.name}</span>
            <span className="parked-chip-meta">{sale.meta}</span>
          </span>
          <span className={`parked-chip-tag parked-chip-tag--${sale.kind.toLowerCase()}`}>
            {sale.kind}
          </span>
        </button>
      ))}
      <button type="button" className="parked-strip-view-all">
        View all →
      </button>
    </div>
  );
}

export default ParkedStrip;
