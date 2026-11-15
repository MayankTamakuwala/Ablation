import { useEffect, useId, useRef } from "react";
import PropTypes from "prop-types";
import runShape from "../lib/runShape.js";
import styles from "./ConfirmDeleteDialog.module.css";

// A native dialog, so the browser supplies the focus trap, Escape to close
// and the inert background. Open whenever a run is pending deletion.
export default function ConfirmDeleteDialog({
  run = null,
  busy,
  error,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (run && !dialog.open) {
      dialog.showModal();
      // Start on the safe choice, not the destructive one.
      cancelRef.current?.focus();
    } else if (!run && dialog.open) {
      dialog.close();
    }
  }, [run]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape. The parent owns the open state, so let it do the closing.
        event.preventDefault();
        if (!busy) {
          onCancel();
        }
      }}
    >
      {run && (
        <div className={styles.body}>
          <h2 id={titleId} className={styles.title}>
            Delete this run?
          </h2>
          <p className={styles.text}>
            This permanently removes <strong>{run.experimentLabel}</strong> (seed{" "}
            {run.seed}, accuracy {run.accuracy.toFixed(4)}). It cannot be undone.
          </p>

          <p className={styles.error} role="alert">
            {error}
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.confirm}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? "Deleting..." : "Delete run"}
            </button>
            <button
              ref={cancelRef}
              type="button"
              className={styles.cancel}
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

ConfirmDeleteDialog.propTypes = {
  run: runShape,
  busy: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
