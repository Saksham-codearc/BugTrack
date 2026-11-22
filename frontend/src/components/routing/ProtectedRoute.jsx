import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FullPageLoader } from '../ui/Spinner';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader label="Checking your session…" />;
  if (user) return <Navigate to="/" replace />;
  return children;
}
