import PropTypes from "prop-types";
import styles from "./ExperimentRow.module.css";

export default function ExperimentRow({ experiment }) {
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
  }).isRequired,
};
