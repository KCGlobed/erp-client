import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './routes/LoginPage';
import { UsersPage } from './routes/UsersPage';
import { RolesPage } from './routes/RolesPage';
import { PermissionsPage } from './routes/PermissionsPage';
import { LogsPage } from './routes/LogsPage';
import { CoursesPage } from './routes/CoursesPage';
import { CohortsPage } from './routes/CohortsPage';
import { TimetablePage } from './routes/TimetablePage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/users" replace />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="cohorts" element={<CohortsPage />} />
            <Route path="timetable" element={<TimetablePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
