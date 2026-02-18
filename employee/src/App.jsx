import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import ApplyLeave from './pages/Employee/ApplyLeave';
import LeaveHistory from './pages/Employee/LeaveHistory';
import HolidayCalendar from './pages/Employee/HolidayCalendar';
import Notifications from './pages/Employee/Notifications';
import ChangePassword from './pages/ChangePassword';
import Unauthorized from './pages/Unauthorized';
import MyProjects from './pages/Employee/MyProjects';
import MyTasks from './pages/Employee/MyTasks';
import Profile from './pages/Employee/Profile';
import Documents from './pages/Employee/Documents';
import Attendance from './pages/Employee/Attendance';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

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

              <Route path="/" element={
                <PrivateRoute allowedRoles={['employee', 'team-lead']}>
                  <DashboardLayout />
                </PrivateRoute>
              }>
                <Route index element={<EmployeeDashboard />} />
                <Route path="apply-leave" element={<ApplyLeave />} />
                <Route path="leave-history" element={<LeaveHistory />} />
                <Route path="holidays" element={<HolidayCalendar />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="projects" element={<MyProjects />} />
                <Route path="tasks" element={<MyTasks />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="documents" element={<Documents />} />
                <Route path="profile" element={<Profile />} />
                <Route path="change-password" element={<ChangePassword />} />
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
