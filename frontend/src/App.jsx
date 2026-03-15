import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { isLoggedIn } from './api';
import Login from './pages/Login';
import Curriculums from './pages/Curriculums';
import CurriculumVersions from './pages/CurriculumVersions';
import CurriculumItems from './pages/CurriculumItems';
import Schedules from './pages/Schedules';
import Relations from './pages/Relations';

function Layout({ children }) {
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem('token');
    navigate('/login');
  }
  return (
    <>
      <nav style={{ padding: '8px 16px', borderBottom: '1px solid #ccc', display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link to="/">Curriculums</Link>
        <Link to="/curriculum-versions">Versions</Link>
        <Link to="/curriculum-items">Items</Link>
        <Link to="/schedules">Schedules</Link>
        <Link to="/relations">Relations</Link>
        <button onClick={logout} style={{ marginLeft: 'auto' }}>Logout</button>
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
      <Route path="/login" element={isLoggedIn() ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><Curriculums /></Protected>} />
      <Route path="/curriculum-versions" element={<Protected><CurriculumVersions /></Protected>} />
      <Route path="/curriculum-items" element={<Protected><CurriculumItems /></Protected>} />
      <Route path="/schedules" element={<Protected><Schedules /></Protected>} />
      <Route path="/relations" element={<Protected><Relations /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
