import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.js';

export default function ProtectedRoute({ children, admin = false }) {
  const user = useAuth((s) => s.user);
  const accessToken = useAuth((s) => s.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (admin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
