import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useFamily } from './hooks/useFamily';
import { useBaby } from './hooks/useBaby';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { StatsPage } from './pages/StatsPage';
import { GrowthPage } from './pages/GrowthPage';
import { SettingsPage } from './pages/SettingsPage';
import type { Family } from './types/events';

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
