import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import NotificationListener from './components/NotificationListener';
import Login from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamPerformance from './pages/TeamPerformance';
import Projects from './pages/Projects';
import TasksOverview from './pages/TasksOverview';
import WorkLogs from './pages/WorkLogs';
import Leaves from './pages/Leaves';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Tickets from './pages/Tickets';
import CreateProject from './pages/CreateProject';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <NotificationListener />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }>
                <Route index element={<ManagerDashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/create" element={<CreateProject />} />
                <Route path="projects/edit/:id" element={<CreateProject />} />
                <Route path="tasks" element={<TasksOverview />} />
                <Route path="team-performance" element={<TeamPerformance />} />
                <Route path="work-logs" element={<WorkLogs />} />
                <Route path="leaves" element={<Leaves />} />
                <Route path="profile" element={<Profile />} />
                <Route path="change-password" element={<ChangePassword />} />
                <Route path="tickets" element={<Tickets />} />
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
