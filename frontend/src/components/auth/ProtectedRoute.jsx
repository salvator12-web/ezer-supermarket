import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Wraps admin/rider routes. Redirects to /login if not signed in, or to the
// correct area if signed in with the wrong role (e.g. a rider hitting /dashboard).
export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, loading, role: userRole } = useAuth();

  if (loading) {
    return <div className="auth-loading">Loading…</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role && userRole !== role) {
    return <Navigate to={userRole === 'admin' ? '/dashboard' : '/rider'} replace />;
  }
  return children;
}
