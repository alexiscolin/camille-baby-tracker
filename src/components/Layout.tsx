import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  LogOut,
} from 'lucide-react';
import { signOut } from '../services/auth';
import { OfflineBanner } from './OfflineBanner';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <OfflineBanner />
      <main className={styles.main}>{children}</main>
      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <LayoutDashboard size={22} />
          <span>Today</span>
        </NavLink>
        <NavLink
          to="/add"
          className={({ isActive }) =>
            `${styles.navItem} ${styles.navAdd} ${isActive ? styles.active : ''}`
          }
        >
          <PlusCircle size={32} />
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <BarChart3 size={22} />
          <span>Stats</span>
        </NavLink>
        <button
          className={styles.navItem}
          onClick={() => { signOut().catch(() => { /* Auth listener handles state */ }); }}
        >
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
