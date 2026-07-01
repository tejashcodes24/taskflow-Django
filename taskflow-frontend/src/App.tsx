import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { BoardPage } from '@/pages/BoardPage';
import { AssignedPage } from '@/pages/AssignesPage.';
import api from '@/lib/api';

// Layout wrapper for authenticated pages
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { setAuth, setInitialized } = useAuthStore();

  // On app load — try to restore session using the refresh cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.post('/auth/refresh');
        // Also fetch the user profile
        const userRes = await api.get('/users/me');
        setAuth(userRes.data, res.data.accessToken);
      } catch {
        // No valid session — user needs to log in
      } finally {
        setInitialized();
      }
    };

    restoreSession();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout><DashboardPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <AppLayout><ProjectsPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <AppLayout><BoardPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assigned"
          element={
            <ProtectedRoute>
              <AppLayout><AssignedPage /></AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}