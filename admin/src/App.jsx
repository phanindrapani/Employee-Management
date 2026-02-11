import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/Layout/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import HolidayManagement from './pages/HolidayManagement';
import LeaveRequests from './pages/LeaveRequests';
import EmployeeCRUD from './pages/EmployeeCRUD';

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
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
