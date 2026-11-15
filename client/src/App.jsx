import { useCallback, useEffect, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import ExperimentList from "./components/ExperimentList.jsx";
import RunsPage from "./components/RunsPage.jsx";
import SignInForm from "./components/SignInForm.jsx";
import { request } from "./lib/api.js";
import styles from "./App.module.css";

const TITLES = { experiments: "Experiments", runs: "Runs" };

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [view, setView] = useState("experiments");

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const result = await request("/api/auth/me");

        if (!cancelled) {
          setUser(result.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    loadSession();

    // StrictMode double mounts effects in development, so a response from the
    // discarded first mount must not write state after the second took over.
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setView("experiments");
    }
  }, []);

  // The session check runs before anything renders, otherwise a signed in
  // visitor sees the sign in screen flash before being replaced.
  if (checkingSession) {
    return <p className={styles.loading}>Loading...</p>;
  }

  if (!user) {
    return <SignInForm onSignedIn={setUser} />;
  }

  return (
    <div className={styles.page}>
      <AppHeader user={user} view={view} onNavigate={setView} onSignOut={handleSignOut} />

      <main className={styles.main}>
        <h1 className={styles.title}>{TITLES[view]}</h1>
        {view === "runs" ? <RunsPage /> : <ExperimentList />}
      </main>
    </div>
  );
}
