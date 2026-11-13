import { useEffect, useId, useState } from "react";
import ConfirmDialog from "./ConfirmDialog.jsx";
import ExperimentForm from "./ExperimentForm.jsx";
import StatusFilter from "./StatusFilter.jsx";
import ExperimentRow from "./ExperimentRow.jsx";
import Pagination from "./Pagination.jsx";
import { buildQuery, request } from "../lib/api.js";
import styles from "./ExperimentList.module.css";

const EMPTY_COUNTS = { all: 0, planned: 0, running: 0, concluded: 0, abandoned: 0 };

export default function ExperimentList() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [skip, setSkip] = useState(0);

  const [page, setPage] = useState({
    items: [],
    total: 0,
    counts: EMPTY_COUNTS,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // null is closed, "new" is the create form, an object is an edit.
  const [editing, setEditing] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const searchId = useId();

  // Typing fires one request per keystroke without this. The applied value is
  // what the query actually uses, so the input stays responsive either way.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Narrowing the result set while on page 3 would otherwise leave the viewer
  // past the end of a shorter list, looking at nothing.
  useEffect(() => {
    setSkip(0);
  }, [status, appliedSearch]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const query = buildQuery({ status, search: appliedSearch, skip });
        const result = await request("/api/experiments" + query);

        if (!cancelled) {
          setPage(result);
        }
      } catch (problem) {
        if (!cancelled) {
          setError(problem.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [status, appliedSearch, skip, reloadToken]);

  const filtering = status !== "" || appliedSearch !== "";

  async function handleDelete() {
    setDeleteBusy(true);
    setDeleteError("");

    try {
      await request("/api/experiments/" + deleting._id, { method: "DELETE" });

      // Removing the only row on a later page would otherwise leave the
      // viewer looking at an empty page that still has results before it.
      const lastOnPage = page.items.length === 1 && skip > 0;

      setDeleting(null);

      if (lastOnPage) {
        setSkip(Math.max(0, skip - page.limit));
      } else {
        setReloadToken((token) => token + 1);
      }
    } catch (problem) {
      setDeleteError(problem.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  function cancelDelete() {
    setDeleting(null);
    setDeleteError("");
  }

  function handleSaved() {
    setEditing(null);
    // A new experiment sorts to the top, so the first page is what to show.
    setSkip(0);
    setReloadToken((token) => token + 1);
  }

  if (editing) {
    return (
      <ExperimentForm
        experiment={editing === "new" ? null : editing}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.newButton}
          onClick={() => setEditing("new")}
        >
          + New experiment
        </button>
      </div>

      <div className={styles.controls}>
        <StatusFilter value={status} counts={page.counts} onChange={setStatus} />

        <label className="visuallyHidden" htmlFor={searchId}>
          Search experiments
        </label>
        <input
          className={styles.search}
          id={searchId}
          type="search"
          placeholder="Search title, question, dataset"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {loading && page.items.length === 0 && <p className={styles.message}>Loading...</p>}

      {!loading && !error && page.items.length === 0 && (
        <div className={styles.empty}>
          <h2 className={styles.emptyHeading}>
            {filtering ? "No experiments match this view" : "No experiments yet"}
          </h2>
          <p className={styles.emptyBody}>
            {filtering
              ? "Try a different status, or clear the search box."
              : "An experiment is a question you are trying to answer, plus the dataset and base model you are answering it with. Runs get logged against it once it exists."}
          </p>
        </div>
      )}

      {page.items.length > 0 && (
        <>
          <ul className={styles.list}>
            {page.items.map((experiment) => (
              <li key={experiment._id}>
                <ExperimentRow
                  experiment={experiment}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              </li>
            ))}
          </ul>

          <Pagination
            skip={skip}
            limit={page.limit}
            total={page.total}
            onChange={setSkip}
          />
        </>
      )}

      {deleting && (
        <ConfirmDialog
          heading="Delete experiment"
          subject={deleting.title}
          confirmLabel="Delete"
          error={deleteError}
          busy={deleteBusy}
          onConfirm={handleDelete}
          onCancel={cancelDelete}
        />
      )}
    </>
  );
}
