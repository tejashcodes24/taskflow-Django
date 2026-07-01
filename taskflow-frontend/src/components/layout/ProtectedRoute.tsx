import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { PageSpinner } from '@/components/ui/Spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, isInitialized } = useAuthStore();

  // Still checking for existing session — show spinner
  if (!isInitialized) return <PageSpinner />;

  // No token after init — redirect to login
  if (!accessToken) return <Navigate to="/login" replace />;

  return <>{children}</>;
}