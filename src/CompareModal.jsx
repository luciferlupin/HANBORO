import React from "react";

export function CompareModal({ comparedProducts, onRemove, onClear, onClose, onSelectProduct }) {
  if (!comparedProducts || comparedProducts.length === 0) return null;

  return (
    <div className="compare-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="compare-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="compare-modal-top">
          <div className="compare-title-group">
            <span className="compare-tag">HOROLOGICAL COMPARISON</span>
            <h3 className="compare-heading">Compare Timepiece Specifications</h3>
          </div>
          <div className="compare-top-actions">
            <button type="button" className="compare-clear-btn" onClick={onClear}>
              Clear All ({comparedProducts.length})
            </button>
            <button type="button" className="compare-close-btn" onClick={onClose} aria-label="Close Comparison">
              ✕
            </button>
          </div>
        </div>

        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="compare-spec-col">Metric</th>
                {comparedProducts.map((p) => (
                  <th key={p.id} className="compare-product-col">
                    <div className="compare-card-head">
                      <button
                        type="button"
                        className="compare-remove-item"
                        onClick={() => onRemove(p.id)}
                        title="Remove from comparison"
                      >
                        ✕
                      </button>
                      <div
                        className="compare-thumb-wrap"
                        onClick={() => {
                          onClose();
                          onSelectProduct(p);
                        }}
                      >
                        <img src={p.image} alt={p.name} className="compare-thumb-img" />
                      </div>
                      <span className="compare-sku-badge">REF. {p.sku}</span>
                      <h4
                        className="compare-item-name"
                        onClick={() => {
                          onClose();
                          onSelectProduct(p);
                        }}
                      >
                        {p.name}
                      </h4>
                      <span className="compare-item-price">{p.price}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="metric-label">Collection</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val">{p.collectionName}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Caliber / Movement</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val highlight-red">{p.specs.movement}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Beat Frequency</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val">{p.specs.frequency}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Power Reserve</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val highlight-bold">{p.specs.powerReserve}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Jewels</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val">{p.specs.jewels}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Case Material</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val">{p.specs.caseMaterial}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Case Dimensions</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val">{p.specs.caseDimensions}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Crystal Glass</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val">{p.specs.glass}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Water Resistance</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val highlight-bold">{p.specs.waterResistance}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Strap & Buckle</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val">{p.specs.strap}</td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Key Complications</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val">
                    <div className="compare-tag-list">
                      {p.specs.complications?.map((c, i) => (
                        <span key={i} className="mini-tag">{c}</span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="metric-label">Action</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="metric-val">
                    <button
                      type="button"
                      className="compare-inspect-btn"
                      onClick={() => {
                        onClose();
                        onSelectProduct(p);
                      }}
                    >
                      View Full Dossier ↗
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
