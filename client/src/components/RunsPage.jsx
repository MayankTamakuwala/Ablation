import { useId, useState } from "react";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog.jsx";
import Pagination from "./Pagination.jsx";
import ReproducedFilter from "./ReproducedFilter.jsx";
import RunForm from "./RunForm.jsx";
import RunTable from "./RunTable.jsx";
import useRuns from "../hooks/useRuns.js";
import { request } from "../lib/api.js";
import styles from "./RunsPage.module.css";

export default function RunsPage() {
  const runs = useRuns();
  const { page } = runs;
  const searchId = useId();

  // null when the form is closed, { run: null } to log a new run, and
  // { run } to edit one. The form can only be open for one of them at a time.
  const [editor, setEditor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleSave(fields) {
    if (editor.run) {
      await request("/api/runs/" + editor.run._id, { method: "PUT", body: fields });
      runs.reload();
    } else {
      await request("/api/runs", { method: "POST", body: fields });
      runs.showNewest();
    }

    setEditor(null);
  }

  function closeDeleteDialog() {
    setPendingDelete(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");

    try {
      await request("/api/runs/" + pendingDelete._id, { method: "DELETE" });

      if (editor && editor.run && editor.run._id === pendingDelete._id) {
        setEditor(null);
      }

      closeDeleteDialog();
      runs.reload();
    } catch (problem) {
      setDeleteError(problem.message);
    } finally {
      setDeleting(false);
    }
  }

  const formOpen = editor !== null;
  const empty = !runs.loading && !runs.error && page.items.length === 0;

  return (
    <>
      <div className={styles.controls}>
        <ReproducedFilter
          value={runs.reproduced}
          counts={page.counts}
          onChange={runs.setReproduced}
        />

        <label className="visuallyHidden" htmlFor={searchId}>
          Search runs
        </label>
        <input
          className={styles.search}
          id={searchId}
          type="search"
          placeholder="Search label or base model"
          value={runs.search}
          onChange={(event) => runs.setSearch(event.target.value)}
        />

        {!formOpen && (
          <button
            type="button"
            className={styles.primary}
            onClick={() => setEditor({ run: null })}
          >
            + Log run
          </button>
        )}
      </div>

      {formOpen && (
        <RunForm
          key={editor.run ? editor.run._id : "new"}
          run={editor.run}
          onSubmit={handleSave}
          onCancel={() => setEditor(null)}
        />
      )}

      {runs.error && (
        <p className={styles.error} role="alert">
          {runs.error}
        </p>
      )}

      {runs.loading && page.items.length === 0 && (
        <p className={styles.message}>Loading...</p>
      )}

      {empty && (
        <div className={styles.empty}>
          <h2 className={styles.emptyHeading}>
            {runs.filtering ? "No runs match this view" : "No runs logged yet"}
          </h2>
          <p className={styles.emptyBody}>
            {runs.filtering
              ? "Try a different filter, or clear the search box."
              : "A run is one training job: its hyperparameters, its results and whether you could reproduce it. Log one right after it finishes, while the terminal is still open."}
          </p>
          {runs.filtering ? (
            <button
              type="button"
              className={styles.secondary}
              onClick={runs.clearFilters}
            >
              Clear filters
            </button>
          ) : (
            !formOpen && (
              <button
                type="button"
                className={styles.primary}
                onClick={() => setEditor({ run: null })}
              >
                + Log run
              </button>
            )
          )}
        </div>
      )}

      {page.items.length > 0 && (
        <>
          <RunTable
            runs={page.items}
            sort={runs.sort}
            order={runs.order}
            onSort={runs.toggleSort}
            onEdit={(run) => setEditor({ run })}
            onDelete={setPendingDelete}
          />

          <Pagination
            skip={runs.skip}
            limit={page.limit}
            total={page.total}
            onChange={runs.setSkip}
          />
        </>
      )}

      <ConfirmDeleteDialog
        run={pendingDelete}
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
    </>
  );
}
