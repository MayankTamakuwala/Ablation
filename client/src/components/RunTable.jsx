import PropTypes from "prop-types";
import RunRow from "./RunRow.jsx";
import runShape from "../lib/runShape.js";
import styles from "./RunTable.module.css";

// Every column here is on the server's sort allowlist.
const COLUMNS = [
  { key: "createdAt", label: "Logged" },
  { key: "learningRate", label: "Learning rate", numeric: true },
  { key: "batchSize", label: "Batch size", numeric: true },
  { key: "epochs", label: "Epochs", numeric: true },
  { key: "seed", label: "Seed", numeric: true },
  { key: "accuracy", label: "Accuracy", numeric: true },
  { key: "loss", label: "Loss", numeric: true },
  { key: "durationMinutes", label: "Duration (min)", numeric: true },
];

function ariaSort(active, order) {
  if (!active) {
    return "none";
  }
  return order === "asc" ? "ascending" : "descending";
}

export default function RunTable({ runs, sort, order, onSort, onEdit, onDelete }) {
  return (
    // A table can be wider than a phone. It scrolls inside its own region, so
    // the page never scrolls sideways, and the region is focusable so a
    // keyboard user can scroll it too.
    <div className={styles.scroll} role="region" aria-label="Logged runs" tabIndex={0}>
      <table className={styles.table}>
        <caption className="visuallyHidden">Logged training runs</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.head}>
              Run
            </th>
            {COLUMNS.map((column) => {
              const active = column.key === sort;

              return (
                <th
                  key={column.key}
                  scope="col"
                  className={column.numeric ? styles.headNumeric : styles.head}
                  aria-sort={ariaSort(active, order)}
                >
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => onSort(column.key)}
                  >
                    {column.label}
                    <span className={styles.arrow} aria-hidden="true">
                      {active ? (order === "asc" ? "↑" : "↓") : ""}
                    </span>
                  </button>
                </th>
              );
            })}
            <th scope="col" className={styles.head}>
              Reproduced
            </th>
            <th scope="col" className={styles.head}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <RunRow key={run._id} run={run} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

RunTable.propTypes = {
  runs: PropTypes.arrayOf(runShape).isRequired,
  sort: PropTypes.string.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  onSort: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
