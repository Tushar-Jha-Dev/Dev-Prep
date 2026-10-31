import React, { useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

/**
 * DevPrep - Shared Accessible Modal Component (`Modal.jsx`)
 * 
 * Standards & Design Specifications:
 * 1. React Portal: Always renders directly into `document.body` to avoid
 *    parent stacking contexts, transforms, or overflow clipping.
 * 2. Viewport Overlay: Fixed position, dims background, z-index: 1000.
 * 3. Fixed Header & Footer: Header (title + close) and footer (actions) stay
 *    docked; only the modal body scrolls. Body has 24px padding.
 * 4. Dialog Sizing: Centered, max-width 640px, max-height 90vh, 10px radius,
 *    --surface background, 1px border.
 * 5. Keyboard & Focus Management:
 *    - Closes on Escape and backdrop click (with confirmation if unsaved changes exist).
 *    - Locks body scroll while open.
 *    - Traps Tab key focus inside the dialog.
 *    - Restores focus to the trigger element upon closing.
 * 6. Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
 * 7. Animations: 150ms fade and scale-in (respects prefers-reduced-motion).
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'danger'
  onConfirm,
  isLoading = false,
  maxWidth = '640px',
  hasUnsavedChanges = false,
  ariaLabelledBy = 'modal-dialog-title'
}) {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Close attempt with unsaved changes guard
  const handleAttemptClose = useCallback(() => {
    if (isLoading) return;
    if (hasUnsavedChanges) {
      const confirmDismiss = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them and close?'
      );
      if (!confirmDismiss) return;
    }
    onClose();
  }, [hasUnsavedChanges, isLoading, onClose]);

  // Backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleAttemptClose();
    }
  };

  // Lock body scroll and trap keyboard focus
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Set initial focus
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const firstInput = dialogRef.current.querySelector(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
        );
        if (firstInput) {
          firstInput.focus();
        } else if (confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        } else {
          const focusable = dialogRef.current.querySelectorAll(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) focusable[0].focus();
        }
      }
    }, 50);

    // Keydown listener for Esc and Tab focus trap
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleAttemptClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll(
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleAttemptClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-portal-overlay"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="modal-dialog-box"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
      >
        {/* Fixed Header */}
        <div className="modal-dialog-header">
          <h3 id={ariaLabelledBy} className="modal-dialog-title">
            {title}
          </h3>
          <button
            type="button"
            className="modal-dialog-close-btn"
            onClick={handleAttemptClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-dialog-body">
          {children}
        </div>

        {/* Fixed Footer */}
        {(footer !== undefined || onConfirm) && (
          <div className="modal-dialog-footer">
            {footer !== undefined ? (
              footer
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAttemptClose}
                  disabled={isLoading}
                >
                  {cancelText}
                </button>
                <button
                  ref={confirmBtnRef}
                  type="button"
                  className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={onConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : confirmText}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
