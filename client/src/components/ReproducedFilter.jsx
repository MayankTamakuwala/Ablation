import PropTypes from "prop-types";
import styles from "./ReproducedFilter.module.css";

const OPTIONS = [
  { value: "", label: "All", countKey: "all" },
  { value: "true", label: "Reproduced", countKey: "reproduced" },
  { value: "false", label: "Not reproduced", countKey: "notReproduced" },
];

export default function ReproducedFilter({ value, counts, onChange }) {
  return (
    <div className={styles.group} role="group" aria-label="Filter by reproduced">
      {OPTIONS.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.countKey}
            type="button"
            className={active ? styles.chip + " " + styles.chipActive : styles.chip}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            <span className={styles.count}>{counts[option.countKey] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

ReproducedFilter.propTypes = {
  value: PropTypes.string.isRequired,
  counts: PropTypes.objectOf(PropTypes.number).isRequired,
  onChange: PropTypes.func.isRequired,
};
