import { useId, useState } from "react";
import PropTypes from "prop-types";
import ModelPicker from "./ModelPicker.jsx";
import { request } from "../lib/api.js";
import styles from "./ExperimentForm.module.css";

const STATUSES = ["planned", "running", "concluded", "abandoned"];

const BLANK = {
  title: "",
  question: "",
  dataset: "",
  baseModel: "",
  status: "planned",
  notes: "",
};

export default function ExperimentForm({ experiment = null, onSaved, onCancel }) {
  const editing = Boolean(experiment);

  const [fields, setFields] = useState(() =>
    editing
      ? {
          title: experiment.title,
          question: experiment.question,
          dataset: experiment.dataset,
          baseModel: experiment.baseModel,
          status: experiment.status,
          notes: experiment.notes || "",
        }
      : BLANK
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const id = useId();

  function set(name, nextValue) {
    setFields((current) => ({ ...current, [name]: nextValue }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!fields.baseModel) {
      setError("Base model is required. Search the catalog and pick one.");
      return;
    }

    setSaving(true);

    try {
      const saved = await request(
        editing ? "/api/experiments/" + experiment._id : "/api/experiments",
        { method: editing ? "PUT" : "POST", body: fields }
      );

      onSaved(saved);
    } catch (problem) {
      // The server names the offending field, and the typed values stay put
      // so nothing has to be retyped.
      setError(problem.message);
      setSaving(false);
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.heading}>
          {editing ? "Edit experiment" : "New experiment"}
        </h2>
        {editing && (
          <p className={styles.created}>
            created {new Date(experiment.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={id + "-title"}>
            Title *
          </label>
          <input
            className={styles.input}
            id={id + "-title"}
            value={fields.title}
            onChange={(event) => set("title", event.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={id + "-question"}>
            Research question *
          </label>
          <textarea
            className={styles.textarea}
            id={id + "-question"}
            value={fields.question}
            onChange={(event) => set("question", event.target.value)}
            maxLength={500}
            required
          />
        </div>

        <div className={styles.pair}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={id + "-dataset"}>
              Dataset *
            </label>
            <input
              className={styles.input}
              id={id + "-dataset"}
              value={fields.dataset}
              onChange={(event) => set("dataset", event.target.value)}
              maxLength={120}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={id + "-status"}>
              Status
            </label>
            <select
              className={styles.input}
              id={id + "-status"}
              value={fields.status}
              onChange={(event) => set("status", event.target.value)}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <ModelPicker
            value={fields.baseModel}
            onChange={(next) => set("baseModel", next)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={id + "-notes"}>
            Notes (optional)
          </label>
          <textarea
            className={styles.textarea}
            id={id + "-notes"}
            value={fields.notes}
            onChange={(event) => set("notes", event.target.value)}
            maxLength={2000}
          />
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button className={styles.submit} type="submit" disabled={saving}>
            {saving ? "Saving..." : editing ? "Save changes" : "Create experiment"}
          </button>
          <button className={styles.cancel} type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

ExperimentForm.propTypes = {
  experiment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    dataset: PropTypes.string.isRequired,
    baseModel: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    notes: PropTypes.string,
    createdAt: PropTypes.string,
  }),
  onSaved: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
