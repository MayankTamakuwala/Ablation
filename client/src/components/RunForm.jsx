import { useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import ModelPicker from "./ModelPicker.jsx";
import runShape from "../lib/runShape.js";
import styles from "./RunForm.module.css";

// Listed in the order a person reads them off a command line, then the
// results. Each is a decision about what a run must record.
const NUMBER_FIELDS = [
  { name: "learningRate", label: "Learning rate", step: "any" },
  { name: "batchSize", label: "Batch size", step: "1" },
  { name: "epochs", label: "Epochs", step: "1" },
  { name: "seed", label: "Seed", step: "1" },
  { name: "accuracy", label: "Accuracy (0 to 1)", step: "any" },
  { name: "loss", label: "Loss", step: "any" },
  { name: "durationMinutes", label: "Duration (minutes)", step: "any" },
];

function toValues(run) {
  return {
    experimentLabel: run ? run.experimentLabel : "",
    baseModel: run ? run.baseModel : "",
    learningRate: run ? String(run.learningRate) : "",
    batchSize: run ? String(run.batchSize) : "",
    epochs: run ? String(run.epochs) : "",
    seed: run ? String(run.seed) : "",
    accuracy: run ? String(run.accuracy) : "",
    loss: run ? String(run.loss) : "",
    durationMinutes: run ? String(run.durationMinutes) : "",
    reproduced: run ? run.reproduced : false,
  };
}

// Names the first empty required field, so the message says what to fix. The
// server stays the authority on ranges and types.
function firstMissing(values) {
  if (values.experimentLabel.trim() === "") {
    return "Experiment label is required";
  }

  if (values.baseModel === "") {
    return "Base model is required. Pick one from the list.";
  }

  const empty = NUMBER_FIELDS.find((field) => values[field.name].trim() === "");
  return empty ? empty.label.replace(/ \(.*\)$/, "") + " is required" : "";
}

function toPayload(values) {
  const payload = {
    experimentLabel: values.experimentLabel.trim(),
    baseModel: values.baseModel,
    reproduced: values.reproduced,
  };

  NUMBER_FIELDS.forEach((field) => {
    payload[field.name] = Number(values[field.name]);
  });

  return payload;
}

/**
 * One form, two modes. Editing reuses the create form, so there is no modal
 * to trap focus in and nothing to restore when it closes. Three things
 * change: the heading, the submit label, and Cancel (which both modes have).
 */
export default function RunForm({ run = null, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toValues(run));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const idPrefix = useId();
  const labelRef = useRef(null);
  const editing = run !== null;

  // Opening the form puts the cursor in its first field.
  useEffect(() => {
    labelRef.current?.focus();
  }, []);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Nothing is cleared on a failed submit: the values live in state, and
    // only the message changes.
    const missing = firstMissing(values);

    if (missing) {
      setError(missing);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onSubmit(toPayload(values));
    } catch (problem) {
      setError(problem.message);
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>{editing ? "Edit run" : "Log a run"}</h2>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={idPrefix + "-label"}>
          Experiment label <span aria-hidden="true">*</span>
        </label>
        <input
          ref={labelRef}
          id={idPrefix + "-label"}
          className={styles.input}
          type="text"
          required
          maxLength={120}
          value={values.experimentLabel}
          onChange={(event) => setField("experimentLabel", event.target.value)}
        />
      </div>

      <ModelPicker
        value={values.baseModel}
        onChange={(id) => setField("baseModel", id)}
      />

      <div className={styles.grid}>
        {NUMBER_FIELDS.map((field) => (
          <div key={field.name} className={styles.field}>
            <label className={styles.label} htmlFor={idPrefix + "-" + field.name}>
              {field.label} <span aria-hidden="true">*</span>
            </label>
            <input
              id={idPrefix + "-" + field.name}
              className={styles.numberInput}
              type="number"
              inputMode="decimal"
              step={field.step}
              required
              value={values[field.name]}
              onChange={(event) => setField(field.name, event.target.value)}
            />
          </div>
        ))}
      </div>

      <label className={styles.check}>
        <input
          type="checkbox"
          checked={values.reproduced}
          onChange={(event) => setField("reproduced", event.target.checked)}
        />
        Reproduced
      </label>

      <p className={styles.error} role="alert">
        {error}
      </p>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Saving..." : editing ? "Save changes" : "Save run"}
        </button>
        <button
          type="button"
          className={styles.cancel}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

RunForm.propTypes = {
  run: runShape,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
