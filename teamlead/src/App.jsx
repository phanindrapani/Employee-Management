import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MyTeam from './pages/MyTeam';
import TeamProjects from './pages/TeamProjects';
import TaskManagement from './pages/TaskManagement';
import LeaveOverview from './pages/LeaveOverview';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import MyProfile from './pages/MyProfile';
import ChangePassword from './pages/ChangePassword';
import TeamPerformance from './pages/TeamPerformance';
import WorkLogs from './pages/WorkLogs';

import { ToastProvider } from './context/ToastContext';
import NotificationListener from './components/NotificationListener';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <NotificationListener />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Team Lead Protected Routes */}
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="team" element={<MyTeam />} />
                <Route path="projects" element={<TeamProjects />} />
                <Route path="tasks" element={<TaskManagement />} />
                <Route path="leaves" element={<LeaveOverview />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<MyProfile />} />
                <Route path="change-password" element={<ChangePassword />} />
                <Route path="worklogs" element={<WorkLogs />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
