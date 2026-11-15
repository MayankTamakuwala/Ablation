import PropTypes from "prop-types";
import styles from "./AppHeader.module.css";

const SECTIONS = [
  { id: "experiments", label: "Experiments" },
  { id: "runs", label: "Runs" },
];

export default function AppHeader({ user, view, onNavigate, onSignOut }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.brand}>Ablation</span>

        <nav className={styles.nav} aria-label="Sections">
          {SECTIONS.map((section) => {
            const current = section.id === view;

            return (
              <button
                key={section.id}
                type="button"
                className={
                  styles.navButton +
                  " " +
                  (current ? styles.navItem : styles.navItemMuted)
                }
                aria-current={current ? "page" : undefined}
                onClick={() => onNavigate(section.id)}
              >
                {section.label}
              </button>
            );
          })}
        </nav>

        <span className={styles.spacer} />

        <span className={styles.user}>{user.displayName || user.username}</span>
        <button className={styles.signOut} type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}

AppHeader.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string,
  }).isRequired,
  view: PropTypes.oneOf(["experiments", "runs"]).isRequired,
  onNavigate: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
};
