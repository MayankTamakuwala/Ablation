import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import styles from "./ConfirmDialog.module.css";

export default function ConfirmDialog({
  heading,
  subject,
  confirmLabel,
  error,
  busy,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  // showModal is what gives the focus trap, the inert background and Escape
  // to close. Rendering <dialog open> instead would provide none of them.
  useEffect(() => {
    const node = dialogRef.current;

    if (node && !node.open) {
      node.showModal();
    }
  }, []);

  function handleCancelEvent(event) {
    // Escape would close the element directly, leaving React still rendering
    // it. Closing is driven by the parent's state instead.
    event.preventDefault();

    if (!busy) {
      onCancel();
    }
  }

  return (
    <dialog className={styles.dialog} ref={dialogRef} onCancel={handleCancelEvent}>
      <h2 className={styles.heading}>{heading}</h2>

      <p className={styles.message}>
        <span className={styles.subject}>{subject}</span> will be removed. This cannot be
        undone.
      </p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.confirm}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Deleting..." : confirmLabel}
        </button>
        <button
          type="button"
          className={styles.cancel}
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </dialog>
  );
}

ConfirmDialog.propTypes = {
  heading: PropTypes.string.isRequired,
  subject: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string.isRequired,
  error: PropTypes.string,
  busy: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
