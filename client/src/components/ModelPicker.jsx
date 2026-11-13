import { useEffect, useId, useState } from "react";
import PropTypes from "prop-types";
import { buildQuery, request } from "../lib/api.js";
import styles from "./ModelPicker.module.css";

function formatDownloads(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M downloads";
  }

  if (count >= 1000) {
    return Math.round(count / 1000) + "K downloads";
  }

  return count + " downloads";
}

export default function ModelPicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const inputId = useId();

  useEffect(() => {
    const timer = setTimeout(() => setApplied(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (applied.length === 0) {
      setResults([]);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);

    async function search() {
      try {
        const payload = await request(
          "/api/models" + buildQuery({ search: applied, limit: 8 })
        );

        if (!cancelled) {
          setResults(payload.items);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }

    search();

    return () => {
      cancelled = true;
    };
  }, [applied]);

  function choose(model) {
    onChange(model._id);
    setQuery("");
    setResults([]);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={inputId}>
          Base model *
        </label>
        <input
          className={styles.input}
          id={inputId}
          type="search"
          placeholder="Type to search 1,000 models from the Hugging Face Hub"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {value && (
        <p className={styles.chosen}>
          <span className={styles.chosenValue}>{value}</span>
          <button type="button" className={styles.clear} onClick={() => onChange("")}>
            Change
          </button>
        </p>
      )}

      {applied.length > 0 && (
        <ul className={styles.results}>
          {searching && results.length === 0 && (
            <li>
              <p className={styles.hint}>Searching...</p>
            </li>
          )}

          {!searching && results.length === 0 && (
            <li>
              <p className={styles.hint}>No models match that.</p>
            </li>
          )}

          {results.map((model) => (
            <li key={model._id}>
              <button
                type="button"
                className={styles.result}
                onClick={() => choose(model)}
              >
                <span className={styles.resultId}>{model._id}</span>
                <span className={styles.resultMeta}>{model.task}</span>
                <span className={styles.resultMeta}>
                  {formatDownloads(model.downloads)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

ModelPicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
