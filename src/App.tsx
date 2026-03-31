import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useFamily } from './hooks/useFamily';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AddEventPage } from './pages/AddEventPage';
import { StatsPage } from './pages/StatsPage';
import type { Family } from './types/events';

function AppContent() {
  const { user, loading: authLoading, allowed } = useAuth();
  const { family, loading: familyLoading, setFamily } = useFamily(user?.uid);

  if (authLoading || familyLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage allowed={allowed} />;
  }

  if (!family || family.babies.length === 0) {
    return (
      <SetupPage
        userId={user.uid}
        onComplete={(f: Family) => setFamily(f)}
      />
    );
  }

  const babyId = family.babies[0];

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={<DashboardPage familyId={family.id} babyId={babyId} />}
        />
        <Route
          path="/add"
          element={
            <AddEventPage
              familyId={family.id}
              babyId={babyId}
              userId={user.uid}
            />
          }
        />
        <Route
          path="/stats"
          element={<StatsPage familyId={family.id} babyId={babyId} />}
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
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
