import React, { useEffect } from "react";

export function DeleteWatchModal({
  isOpen,
  watch,
  onClose,
  onConfirm,
}) {
  // Lock background body scroll and pause Lenis while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    window.__hanboro_lenis?.stop();

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove("modal-open");
      window.__hanboro_lenis?.start();
    };
  }, [isOpen]);

  if (!isOpen || !watch) return null;

  return (
    <div className="delete-modal-overlay" role="dialog" aria-modal="true" data-lenis-prevent="true">
      <div className="delete-modal-backdrop" onClick={onClose} />

      <div className="delete-modal-dialog" data-lenis-prevent="true">
        <div className="delete-modal-header">
          <div className="delete-warning-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="delete-header-texts">
            <h3>Archive & Delete Timepiece</h3>
            <p className="delete-sub">Are you sure you want to remove this reference from the boutique catalog?</p>
          </div>
        </div>

        <div className="delete-modal-preview-box">
          <div className="delete-watch-thumb">
            <img src={watch.image} alt={watch.name} />
          </div>
          <div className="delete-watch-meta">
            <span className="delete-sku-badge">REF. {watch.sku}</span>
            <h4 className="delete-watch-name">{watch.name}</h4>
            <span className="delete-watch-price">{watch.price}</span>
            <span className="delete-watch-series">{watch.collectionName}</span>
          </div>
        </div>

        <p className="delete-consequence-note">
          ⚠️ This action will immediately unpublish this timepiece from the client shop, search indices, and remove it from active carts.
        </p>

        <div className="delete-modal-footer">
          <button
            type="button"
            className="delete-cancel-btn"
            onClick={onClose}
          >
            Keep Timepiece
          </button>

          <button
            type="button"
            className="delete-confirm-btn"
            onClick={() => {
              onConfirm(watch.id || watch.sku);
              onClose();
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Confirm Deletion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
