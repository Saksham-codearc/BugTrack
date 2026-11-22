import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { ProjectsProvider } from './context/ProjectsContext';
import AppShell from './components/layout/AppShell';
import ProtectedRoute, { PublicOnlyRoute } from './components/routing/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectLayout from './pages/ProjectLayout';
import BoardPage from './pages/BoardPage';
import TicketListPage from './pages/TicketListPage';
import TeamPage from './pages/TeamPage';
import SettingsPage from './pages/SettingsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import MyTicketsPage from './pages/MyTicketsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <ProjectsProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />

              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="my-tickets" element={<MyTicketsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="projects/:projectId" element={<ProjectLayout />}>
                  <Route index element={<Navigate to="board" replace />} />
                  <Route path="board" element={<BoardPage />} />
                  <Route path="list" element={<TicketListPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </ProjectsProvider>
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
