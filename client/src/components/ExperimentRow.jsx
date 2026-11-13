import PropTypes from "prop-types";
import styles from "./ExperimentRow.module.css";

export default function ExperimentRow({ experiment, onEdit }) {
  const { title, question, dataset, baseModel, status } = experiment;

  return (
    <article className={styles.row}>
      <h3 className={styles.title}>{title}</h3>
      <span className={styles.status + " " + styles[status]}>{status}</span>
      <p className={styles.question}>{question}</p>
      <p className={styles.meta}>
        <span>{baseModel}</span>
        <span>{dataset}</span>
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.edit} onClick={() => onEdit(experiment)}>
          Edit
        </button>
      </div>
    </article>
  );
}

ExperimentRow.propTypes = {
  experiment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    dataset: PropTypes.string.isRequired,
    baseModel: PropTypes.string.isRequired,
    status: PropTypes.oneOf(["planned", "running", "concluded", "abandoned"]).isRequired,
    notes: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
};
