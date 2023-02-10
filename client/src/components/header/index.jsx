import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import styles from "./index.module.css";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className={styles.header}>
      <div className={styles.title} onClick={() => navigate("/")}>
        <img src="/vite.svg" alt="" />
        <span>Typeracer</span>
      </div>
      <nav className={styles.nav}>
        {location.pathname === "/practice" ||
        location.pathname === "/friendly" ||
        location.pathname === "/global" ? (
          <Link to="/" className={styles.navItem}>
            <span className="material-icons-outlined">logout</span>
            Leave
          </Link>
        ) : (
          <Link to="/login" className={styles.navItem}>
            <span className="material-icons-outlined">login</span>
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
