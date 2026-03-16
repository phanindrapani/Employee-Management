import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import Login from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import HolidayManagement from './pages/HolidayManagement';
import LeaveRequests from './pages/LeaveRequests';
import EmployeeCRUD from './pages/EmployeeCRUD';
import EmployeeDetails from './pages/EmployeeDetails';
import DepartmentManagement from './pages/DepartmentManagement';
import TeamManagement from './pages/TeamManagement';
import ProjectManagement from './pages/ProjectManagement';
import CreateProject from './pages/CreateProject';
import Reports from './pages/Reports';
import ChangePassword from './pages/ChangePassword';
import ProjectReports from './pages/ProjectReports';
import PerformanceDashboard from './pages/PerformanceDashboard';
import LeaveSettings from './pages/LeaveSettings';
import Profile from './pages/Profile';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import Clients from './pages/Clients';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  if (user.role === 'admin') return <AdminDashboard />;
  return <Navigate to="/profile" replace />;
};

import { ToastProvider } from './context/ToastContext';
import NotificationListener from './components/NotificationListener';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ConfirmationProvider>
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
                <Route index element={<RoleBasedDashboard />} />
                <Route path="holidays" element={<HolidayManagement />} />
                <Route path="leaves" element={<LeaveRequests />} />
                <Route path="employees" element={<EmployeeCRUD />} />
                <Route path="employees/:id" element={<EmployeeDetails />} />
                <Route path="departments" element={<DepartmentManagement />} />
                <Route path="teams" element={<TeamManagement />} />
                <Route path="projects" element={<ProjectManagement />} />
                <Route path="projects/create" element={<CreateProject />} />
                <Route path="projects/edit/:id" element={<CreateProject />} />
                <Route path="projects/reports" element={<ProjectReports />} />
                <Route path="reports" element={<Reports />} />
                <Route path="performance-dashboard" element={<PerformanceDashboard />} />
                <Route path="leave-settings" element={<LeaveSettings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="tickets/:id" element={<TicketDetail />} />
                <Route path="clients" element={<Clients />} />
                <Route path="change-password" element={<ChangePassword />} />
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </ConfirmationProvider>
    </SocketProvider>
    </AuthProvider>
  );
}

export default App;
