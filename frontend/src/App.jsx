import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import EditCustomer from './pages/EditCustomer';
import CustomerDetail from './pages/CustomerDetail';
import ServiceVisits from './pages/ServiceVisits';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AIInsights from './pages/AIInsights';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"                 element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index                           element={<Navigate to="/dashboard" />} />
          <Route path="dashboard"               element={<Dashboard />} />
          <Route path="customers"               element={<Customers />} />
          <Route path="customers/add"           element={<AddCustomer />} />
          <Route path="customers/:id"           element={<CustomerDetail />} />
          <Route path="customers/edit/:id"      element={<EditCustomer />} />
          <Route path="service"                 element={<ServiceVisits />} />
          <Route path="payments"               element={<Payments />} />
          <Route path="reports"                element={<Reports />} />
          <Route path="settings"               element={<Settings />} />
          <Route path="ai"                  element={<AIInsights />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}