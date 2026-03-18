import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { isLoggedIn, logout as apiLogout } from './api';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/HomePage';
import Curriculums from './pages/Curriculums';
import CurriculumVersions from './pages/CurriculumVersions';
import CurriculumItems from './pages/CurriculumItems';
import Schedules from './pages/Schedules';
import Relations from './pages/Relations';
import GuidePage from './pages/GuidePage';
import SettingsPage from './pages/SettingsPage';
import SampleCurriculumPage from './pages/SampleCurriculumPage';
import CurriculumDetailPage from './pages/CurriculumDetailPage';

function Layout({ children }) {
  const navigate = useNavigate();
  function logout() {
    apiLogout();
    navigate('/login');
  }
  return (
    <>
      {/* Legacy nav kept minimal for non-dashboard pages */}
      <nav className="hidden" aria-hidden="true">
        <Link to="/">Home</Link>
        <Link to="/curriculums">Curriculums</Link>
        <Link to="/curriculum-versions">Versions</Link>
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
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn() ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isLoggedIn() ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<Protected><HomePage /></Protected>} />
      <Route path="/guide" element={<Protected><GuidePage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
      <Route path="/sample" element={<Protected><SampleCurriculumPage /></Protected>} />
      <Route path="/curriculum/:id" element={<Protected><CurriculumDetailPage /></Protected>} />

      {/* Legacy CRUD pages */}
      <Route path="/curriculums" element={<Protected><Curriculums /></Protected>} />
      <Route path="/curriculum-versions" element={<Protected><CurriculumVersions /></Protected>} />
      <Route path="/curriculum-items" element={<Protected><CurriculumItems /></Protected>} />
      <Route path="/schedules" element={<Protected><Schedules /></Protected>} />
      <Route path="/relations" element={<Protected><Relations /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
