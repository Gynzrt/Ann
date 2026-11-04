import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './lib/auth';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Templates } from './pages/Templates';
import { Leaderboard } from './pages/Leaderboard';
import { Login, Register } from './pages/Auth';
import { PublicProfile } from './pages/PublicProfile';
import { NotFound } from './pages/NotFound';
import { Spinner } from './components/layout/Spinner';

const DashboardShell = lazy(() => import('./pages/dashboard/Shell'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Customize = lazy(() => import('./pages/dashboard/Customize'));
const Links = lazy(() => import('./pages/dashboard/Links'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));

function RequireAuth({ children }: { children: JSX.Element }) {
  const { account, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner full />;
  if (!account) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}

const page = (el: JSX.Element) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{el}</motion.div>
);

export function App() {
  const loc = useLocation();
  const top = loc.pathname.startsWith('/dashboard') ? 'dashboard' : loc.pathname;
  return (
    <Suspense fallback={<Spinner full />}>
      <AnimatePresence mode="wait">
        <Routes location={loc} key={top}>
          <Route path="/" element={page(<Home />)} />
          <Route path="/pricing" element={page(<Pricing />)} />
          <Route path="/templates" element={page(<Templates />)} />
          <Route path="/leaderboard" element={page(<Leaderboard />)} />
          <Route path="/login" element={page(<Login />)} />
          <Route path="/register" element={page(<Register />)} />
          <Route path="/dashboard" element={<RequireAuth><DashboardShell /></RequireAuth>}>
            <Route index element={<Overview />} />
            <Route path="customize" element={<Customize />} />
            <Route path="links" element={<Links />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/:username" element={<PublicProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
