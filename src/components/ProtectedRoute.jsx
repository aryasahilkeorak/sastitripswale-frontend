import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.js';

export default function ProtectedRoute({ children, admin = false, superadmin = false }) {
  const user = useAuth((s) => s.user);
  const accessToken = useAuth((s) => s.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  if (superadmin && user?.role !== 'superadmin') {
    return <Navigate to="/admin" replace />;
  }
  if (admin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
