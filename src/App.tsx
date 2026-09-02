import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useFamily } from './hooks/useFamily';
import { useBaby } from './hooks/useBaby';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { withChunkReload } from './utils/lazy-route';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardPage } from './pages/DashboardPage';
import type { Family } from './types/events';

/**
 * Only the dashboard is on the first-paint path. The other four routes — and
 * the food seed, chart builders and recharts they pull in — load when the tab
 * is actually opened, which is what keeps the initial bundle off the wire on a
 * phone's first visit.
 */
const StatsPage = lazy(withChunkReload(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage }))));
const GrowthPage = lazy(withChunkReload(() => import('./pages/GrowthPage').then((m) => ({ default: m.GrowthPage }))));
const FoodPage = lazy(withChunkReload(() => import('./pages/FoodPage').then((m) => ({ default: m.FoodPage }))));
const SettingsPage = lazy(withChunkReload(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))));

/**
 * One boundary per route, not one around <Routes>.
 *
 * react-router wraps navigations in `startTransition`, and React deliberately
 * keeps the previous screen rather than showing the fallback of a boundary
 * that is already mounted — a shared boundary outside <Routes> would survive
 * every navigation and so never paint. A boundary that mounts with the route
 * does.
 */
function suspended(element: ReactNode) {
  return <Suspense fallback={<LoadingScreen minHeight="50vh" />}>{element}</Suspense>;
}

function AppContent() {
  const { user, loading: authLoading, allowed } = useAuth();
  const { family, loading: familyLoading, setFamily } = useFamily(user?.uid);

  const babyId = family?.babies[0] ?? null;
  const { baby } = useBaby(family?.id, babyId ?? undefined);

  if (authLoading || familyLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage allowed={allowed} />;
  }

  if (!family || family.babies.length === 0 || !babyId) {
    return (
      <SetupPage
        userId={user.uid}
        onComplete={(f: Family) => setFamily(f)}
      />
    );
  }

  return (
    <Layout babyName={baby?.firstName}>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              familyId={family.id}
              babyId={babyId}
              userId={user.uid}
              baby={baby}
            />
          }
        />
        <Route
          path="/food"
          element={suspended(
            <FoodPage
              familyId={family.id}
              babyId={babyId}
              userId={user.uid}
              baby={baby}
            />,
          )}
        />
        <Route
          path="/stats"
          element={suspended(
            <StatsPage
              familyId={family.id}
              babyId={babyId}
              baby={baby}
            />,
          )}
        />
        <Route
          path="/growth"
          element={suspended(
            <GrowthPage
              familyId={family.id}
              babyId={babyId}
              userId={user.uid}
              baby={baby}
            />,
          )}
        />
        <Route
          path="/settings"
          element={suspended(
            <SettingsPage
              familyId={family.id}
              babyId={babyId}
              baby={baby}
            />,
          )}
        />
      </Routes>
    </Layout>
  );
}

/**
 * `minHeight` is a parameter because this doubles as the pre-Layout splash and
 * as an in-Layout route fallback. A full 100dvh inside Layout's padded <main>,
 * under a sticky header and above a fixed nav, overflows the viewport and makes
 * the page scroll for the length of the load, then snap back.
 */
function LoadingScreen({ minHeight = '100dvh' }: { minHeight?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-size-lg)',
      }}
    >
      Loading...
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
