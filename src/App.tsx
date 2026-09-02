import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useFamily } from './hooks/useFamily';
import { useBaby } from './hooks/useBaby';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
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
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const GrowthPage = lazy(() => import('./pages/GrowthPage').then((m) => ({ default: m.GrowthPage })));
const FoodPage = lazy(() => import('./pages/FoodPage').then((m) => ({ default: m.FoodPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

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
      <Suspense fallback={<LoadingScreen />}>
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
            element={
              <FoodPage
                familyId={family.id}
                babyId={babyId}
                userId={user.uid}
                baby={baby}
              />
            }
          />
          <Route
            path="/stats"
            element={
              <StatsPage
                familyId={family.id}
                babyId={babyId}
                baby={baby}
              />
            }
          />
          <Route
            path="/growth"
            element={
              <GrowthPage
                familyId={family.id}
                babyId={babyId}
                userId={user.uid}
                baby={baby}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                familyId={family.id}
                babyId={babyId}
                baby={baby}
              />
            }
          />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
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
