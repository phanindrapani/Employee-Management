import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import HolidayManagement from './pages/HolidayManagement';
import LeaveRequests from './pages/LeaveRequests';
import EmployeeCRUD from './pages/EmployeeCRUD';
import DepartmentManagement from './pages/DepartmentManagement';
import TeamManagement from './pages/TeamManagement';
import ProjectManagement from './pages/ProjectManagement';
import CreateProject from './pages/CreateProject';
import Reports from './pages/Reports';
import ChangePassword from './pages/ChangePassword';
import ProjectReports from './pages/ProjectReports';
import EmployeePerformance from './pages/EmployeePerformance';
import LeaveSettings from './pages/LeaveSettings';
import Profile from './pages/Profile';
import RolesPermissions from './pages/RolesPermissions';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/login" />; // Admins only here

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="holidays" element={<HolidayManagement />} />
            <Route path="leaves" element={<LeaveRequests />} />
            <Route path="employees" element={<EmployeeCRUD />} />
            <Route path="departments" element={<DepartmentManagement />} />
            <Route path="teams" element={<TeamManagement />} />
            <Route path="projects" element={<ProjectManagement />} />
            <Route path="projects/create" element={<CreateProject />} />
            <Route path="projects/reports" element={<ProjectReports />} />
            <Route path="reports" element={<Reports />} />
            <Route path="leave-settings" element={<LeaveSettings />} />
            <Route path="settings/roles" element={<RolesPermissions />} />
            <Route path="settings/profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
