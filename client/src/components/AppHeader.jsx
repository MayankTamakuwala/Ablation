import PropTypes from "prop-types";
import styles from "./AppHeader.module.css";

export default function AppHeader({ user, onSignOut }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.brand}>Ablation</span>

        <nav className={styles.nav} aria-label="Sections">
          <span className={styles.navItem}>Experiments</span>
          <span className={styles.navItemMuted}>Runs</span>
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
  onSignOut: PropTypes.func.isRequired,
};
