import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Salad,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from '../services/auth';
import { OfflineBanner } from './OfflineBanner';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
  babyName?: string;
}

export function Layout({ children, babyName }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <OfflineBanner />

      {/* ─── Desktop Sidebar ─── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <span className={styles.sidebarLogo}>BT</span>
        </div>
        <nav className={styles.sidebarNav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.sidebarItem} ${isActive ? styles.sidebarActive : ''}`
            }
            aria-label="Dashboard"
          >
            <LayoutDashboard size={22} />

          </NavLink>
          <NavLink
            to="/food"
            className={({ isActive }) =>
              `${styles.sidebarItem} ${isActive ? styles.sidebarActive : ''}`
            }
            aria-label="Food"
          >
            <Salad size={22} />

          </NavLink>
          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `${styles.sidebarItem} ${isActive ? styles.sidebarActive : ''}`
            }
            aria-label="Statistics"
          >
            <BarChart3 size={22} />

          </NavLink>
          <NavLink
            to="/growth"
            className={({ isActive }) =>
              `${styles.sidebarItem} ${isActive ? styles.sidebarActive : ''}`
            }
            aria-label="Growth"
          >
            <TrendingUp size={22} />

          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${styles.sidebarItem} ${isActive ? styles.sidebarActive : ''}`
            }
            aria-label="Settings"
          >
            <Settings size={22} />

          </NavLink>
        </nav>
        <button
          className={styles.sidebarItem}
          onClick={() => { signOut().catch(() => { /* Auth listener handles state */ }); }}
          aria-label="Log out"
        >
          <LogOut size={22} />

        </button>
      </aside>

      {/* ─── Mobile Header ─── */}
      <header className={styles.header}>
        <span className={styles.brand}>{babyName ? `${babyName}'s Tracker` : 'Baby Tracker'}</span>
        <button
          className={styles.logoutBtn}
          onClick={() => { signOut().catch(() => { /* Auth listener handles state */ }); }}
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* ─── Main Content ─── */}
      <main className={styles.main}>{children}</main>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className={styles.nav}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <LayoutDashboard size={22} />
          <span>Timeline</span>
        </NavLink>
        <NavLink
          to="/food"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <Salad size={22} />
          <span>Food</span>
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
        <NavLink
          to="/growth"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <TrendingUp size={22} />
          <span>Growth</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <Settings size={22} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
