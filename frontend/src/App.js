import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/custom.css';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
import Features from './pages/Features';
import PublicPricing from './pages/PublicPricing';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import CustomerWizard from './pages/CustomerWizard';
import Settings from './pages/Settings';
import Superadmin from './pages/Superadmin';
import Billing from './pages/Billing';
import BillingSuccess from './pages/BillingSuccess';
import BillingCancel from './pages/BillingCancel';
import LOPDSettings from './pages/LOPDSettings';
import DataRequests from './pages/DataRequests';
import AuditLog from './pages/AuditLog';
import DataRequestForm from './pages/DataRequestForm';
import UserManagement from './pages/UserManagement';
import ChangePassword from './pages/ChangePassword';
import AffiliateManagement from './pages/AffiliateManagement';
import AffiliateDashboard from './pages/AffiliateDashboard';
import MyAffiliates from './pages/MyAffiliates';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Páginas públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<PublicPricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/billing/success" element={<BillingSuccess />} />
          <Route path="/billing/cancel" element={<BillingCancel />} />
          <Route path="/lopd/request" element={<DataRequestForm />} />
          
          {/* Páginas privadas */}
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="superadmin" element={<Superadmin />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/new" element={<CustomerWizard />} />
            <Route path="products" element={<Products />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/new" element={<CreateInvoice />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="billing" element={<Billing />} />
            <Route path="lopd" element={<LOPDSettings />} />
            <Route path="lopd/requests" element={<DataRequests />} />
            <Route path="lopd/audit" element={<AuditLog />} />
            <Route path="affiliates" element={<AffiliateManagement />} />
            <Route path="affiliate-dashboard" element={<AffiliateDashboard />} />
            <Route path="my-affiliates" element={<MyAffiliates />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer 
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
