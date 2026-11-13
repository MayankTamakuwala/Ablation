import PropTypes from "prop-types";
import styles from "./StatusFilter.module.css";

const OPTIONS = [
  { value: "", label: "All", countKey: "all" },
  { value: "planned", label: "Planned", countKey: "planned" },
  { value: "running", label: "Running", countKey: "running" },
  { value: "concluded", label: "Concluded", countKey: "concluded" },
  { value: "abandoned", label: "Abandoned", countKey: "abandoned" },
];

export default function StatusFilter({ value, counts, onChange }) {
  return (
    // A group of real buttons rather than a select. Five options with a count
    // beside each take less room shown than hidden behind a control that has
    // to be opened before it can be read.
    <div className={styles.group} role="group" aria-label="Filter by status">
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

StatusFilter.propTypes = {
  value: PropTypes.string.isRequired,
  counts: PropTypes.objectOf(PropTypes.number).isRequired,
  onChange: PropTypes.func.isRequired,
};
