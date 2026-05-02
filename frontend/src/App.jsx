import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { isAuthenticatedSession, logout as apiLogout } from './api';
import AuthPage from './pages/auth/AuthPage';
import HomePage from './pages/HomePage';
import Curriculums from './pages/Curriculums';
import CurriculumItems from './pages/CurriculumItems';
import Schedules from './pages/Schedules';
import Relations from './pages/Relations';
import GuidePage from './pages/GuidePage';
import SettingsPage from './pages/SettingsPage';
import SampleCurriculumPage from './pages/SampleCurriculumPage';
import CurriculumDetailPage from './pages/CurriculumDetailPage';
import CreateCurriculumPage from './pages/wizard/CreateCurriculumPage';
import CurriculumPdfPreviewPage from './pages/CurriculumPdfPreviewPage';
import VersionDiffPage from './pages/VersionDiffPage';

// Apply saved theme immediately to avoid flash
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark');
  }
}

function Layout({ children }) {
  function logout() {
    apiLogout();
  }
  return (
    <>
      {/* Legacy nav kept minimal for non-dashboard pages */}
      <nav className="hidden" aria-hidden="true">
        <Link to="/">Home</Link>
        <Link to="/curriculums">Curriculums</Link>
        <Link to="/curriculum-items">Items</Link>
        <Link to="/schedules">Schedules</Link>
        <Link to="/relations">Relations</Link>
        <button onClick={logout}>Logout</button>
      </nav>
      {children}
    </>
  );
}

function Protected({ children }) {
  if (!isAuthenticatedSession()) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={isAuthenticatedSession() ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/register" element={isAuthenticatedSession() ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={<Protected><HomePage /></Protected>} />
      <Route path="/guide" element={<Protected><GuidePage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
      <Route path="/sample" element={<Protected><SampleCurriculumPage /></Protected>} />
      <Route path="/curriculum/new" element={<Protected><CreateCurriculumPage /></Protected>} />
      <Route path="/curriculum/:id" element={<Protected><CurriculumDetailPage /></Protected>} />
      <Route path="/curriculum/:id/pdf-preview" element={<Protected><CurriculumPdfPreviewPage /></Protected>} />
      <Route
        path="/curriculum/:curriculumId/diff/:versionAId/:versionBId"
        element={<Protected><VersionDiffPage /></Protected>}
      />

      {/* Legacy CRUD pages */}
      <Route path="/curriculums" element={<Protected><Curriculums /></Protected>} />
      <Route path="/curriculum-items" element={<Protected><CurriculumItems /></Protected>} />
      <Route path="/schedules" element={<Protected><Schedules /></Protected>} />
      <Route path="/relations" element={<Protected><Relations /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
