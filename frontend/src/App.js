import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import AddPayment from './pages/AddPayment';
import EditPayment from './pages/EditPayment';
import Leaders from './pages/Leaders';
import ManageViewers from './pages/ManageViewers';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Only superadmin can add/edit/delete
const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, isSuperAdmin } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const { theme } = useApp();
  return (
    <>
      <Toaster position="top-center" toastOptions={{
        duration: 3000,
        style: {
          background: theme === 'dark' ? '#1f2937' : '#fff',
          color: theme === 'dark' ? '#f3f4f6' : '#111827',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
          borderRadius: '12px', padding: '14px 18px',
          fontSize: '15px', fontWeight: '500',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
      }} />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="payments" element={<Payments />} />
          <Route path="add" element={<SuperAdminRoute><AddPayment /></SuperAdminRoute>} />
          <Route path="edit/:id" element={<SuperAdminRoute><EditPayment /></SuperAdminRoute>} />
          <Route path="leaders" element={<SuperAdminRoute><Leaders /></SuperAdminRoute>} />
          <Route path="viewers" element={<SuperAdminRoute><ManageViewers /></SuperAdminRoute>} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => (
  <AppProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppProvider>
);

export default App;
