import { useEffect, useState } from "react";
import styles from "./App.module.css";

export default function App() {
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkApi() {
      try {
        const response = await fetch("/api/health");
        const payload = await response.json();

        if (!cancelled) {
          setApiStatus(payload.ok ? "reachable" : "unexpected response");
        }
      } catch {
        if (!cancelled) {
          setApiStatus("unreachable");
        }
      }
    }

    checkApi();

    // StrictMode mounts effects twice in development, so a late response from
    // the first mount must not write state after the second has taken over.
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.brand}>Ablation</span>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Ablation</h1>
        <p className={styles.tagline}>A log for machine learning experiments.</p>
        <p className={styles.status}>API: {apiStatus}</p>
      </main>
    </div>
  );
}
