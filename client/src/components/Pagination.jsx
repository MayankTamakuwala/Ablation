import PropTypes from "prop-types";
import styles from "./Pagination.module.css";

export default function Pagination({ skip, limit, total, onChange }) {
  const first = total === 0 ? 0 : skip + 1;
  const last = Math.min(skip + limit, total);

  return (
    <nav className={styles.bar} aria-label="Pagination">
      <p className={styles.range}>
        Showing {first} to {last} of {total}
      </p>

      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(Math.max(0, skip - limit))}
        disabled={skip === 0}
      >
        Previous
      </button>

      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(skip + limit)}
        disabled={last >= total}
      >
        Next
      </button>
    </nav>
  );
}

Pagination.propTypes = {
  skip: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
