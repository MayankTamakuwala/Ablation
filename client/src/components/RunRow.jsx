import PropTypes from "prop-types";
import runShape from "../lib/runShape.js";
import styles from "./RunRow.module.css";

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function RunRow({ run, onEdit, onDelete }) {
  const description = run.experimentLabel + ", seed " + run.seed;

  // Cell order is the reading order and the tab order: the run, its
  // measurements, then the controls, with delete always last.
  return (
    <tr className={styles.row}>
      <th scope="row" className={styles.run}>
        <span className={styles.label}>{run.experimentLabel}</span>
        <span className={styles.model}>{run.baseModel}</span>
      </th>
      <td className={styles.date}>{dateFormat.format(new Date(run.createdAt))}</td>
      <td className={styles.number}>{run.learningRate}</td>
      <td className={styles.number}>{run.batchSize}</td>
      <td className={styles.number}>{run.epochs}</td>
      <td className={styles.number}>{run.seed}</td>
      <td className={styles.number}>{run.accuracy.toFixed(4)}</td>
      <td className={styles.number}>{run.loss.toFixed(4)}</td>
      <td className={styles.number}>{run.durationMinutes}</td>
      <td className={styles.reproduced}>{run.reproduced ? "Yes" : "No"}</td>
      <td className={styles.actions}>
        <button
          type="button"
          className={styles.edit}
          aria-label={"Edit run " + description}
          onClick={() => onEdit(run)}
        >
          Edit
        </button>
        <button
          type="button"
          className={styles.delete}
          aria-label={"Delete run " + description}
          onClick={() => onDelete(run)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

RunRow.propTypes = {
  run: runShape.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
