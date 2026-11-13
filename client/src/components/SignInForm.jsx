import { useId, useState } from "react";
import PropTypes from "prop-types";
import { request } from "../lib/api.js";
import styles from "./SignInForm.module.css";

export default function SignInForm({ onSignedIn }) {
  const [mode, setMode] = useState("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // useId keeps label/input pairs unique without hand written ids, which
  // matters because this form renders twice in StrictMode.
  const fieldId = useId();
  const registering = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = registering
        ? { username, password, displayName }
        : { username, password };

      const result = await request(
        registering ? "/api/auth/register" : "/api/auth/login",
        { method: "POST", body: payload }
      );

      onSignedIn(result.user);
    } catch (problem) {
      setError(problem.message);
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(registering ? "signin" : "register");
    setError("");
  }

  return (
    <div className={styles.screen}>
      <div className={styles.masthead}>
        <h1 className={styles.wordmark}>Ablation</h1>
        <p className={styles.tagline}>a log for machine learning experiments</p>
      </div>

      <section className={styles.card}>
        <h2 className={styles.heading}>{registering ? "Create account" : "Sign in"}</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId + "-username"}>
              Username
            </label>
            <input
              className={styles.input}
              id={fieldId + "-username"}
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          {registering && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor={fieldId + "-display"}>
                Display name
              </label>
              <input
                className={styles.input}
                id={fieldId + "-display"}
                name="displayName"
                autoComplete="nickname"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor={fieldId + "-password"}>
              Password
            </label>
            <input
              className={styles.input}
              id={fieldId + "-password"}
              name="password"
              type="password"
              autoComplete={registering ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? "Working..." : registering ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className={styles.switch}>
          {registering ? "Already have an account? " : "No account yet? "}
          <button className={styles.switchButton} type="button" onClick={switchMode}>
            {registering ? "Sign in" : "Create one"}
          </button>
        </p>
      </section>

      <div className={styles.demo}>
        <p className={styles.demoLabel}>Demo account</p>
        <p className={styles.demoValue}>demo / ablation2026</p>
      </div>
    </div>
  );
}

SignInForm.propTypes = {
  onSignedIn: PropTypes.func.isRequired,
};
