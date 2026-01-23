import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { InventoryAuthProvider } from './context/InventoryAuthContext';

// CRM Components
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';

// Landing Page
import LandingPage from './pages/LandingPage';

// Inventory Components
import InventoryProtectedRoute from './components/inventory/InventoryProtectedRoute';
import InventoryLoginPage from './pages/inventory/InventoryLoginPage';
import InventorySignupPage from './pages/inventory/InventorySignupPage';
import InventoryForgotPasswordPage from './pages/inventory/InventoryForgotPasswordPage';
import InventoryVerifyEmailPage from './pages/inventory/InventoryVerifyEmailPage';
import MasterDashboard from './pages/inventory/MasterDashboard';
import StoreManagement from './pages/inventory/StoreManagement';
import EmployeeManagement from './pages/inventory/EmployeeManagement';
import ProductManagement from './pages/inventory/ProductManagement';
import SalesReports from './pages/inventory/SalesReports';
import MemberPOS from './pages/inventory/MemberPOS';
import MemberSales from './pages/inventory/MemberSales';

import './styles/theme.css';
import './styles/landing.css';
import './styles/inventory.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* ===== CRM Routes ===== */}
          <Route path="/crm/*" element={
            <AuthProvider>
              <Routes>
                {/* CRM Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* CRM Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* CRM Default redirect */}
                <Route path="/" element={<Navigate to="/crm/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/crm/dashboard" replace />} />
              </Routes>
            </AuthProvider>
          } />

          {/* Legacy CRM routes - redirect to new paths */}
          <Route path="/login" element={<Navigate to="/crm/login" replace />} />
          <Route path="/signup" element={<Navigate to="/crm/signup" replace />} />
          <Route path="/dashboard" element={<Navigate to="/crm/dashboard" replace />} />

          {/* ===== Inventory Routes ===== */}
          <Route path="/inventory/*" element={
            <InventoryAuthProvider>
              <Routes>
                {/* Inventory Public routes */}
                <Route path="/login" element={<InventoryLoginPage />} />
                <Route path="/signup" element={<InventorySignupPage />} />
                <Route path="/forgot-password" element={<InventoryForgotPasswordPage />} />
                <Route path="/verify-email" element={<InventoryVerifyEmailPage />} />

                {/* Inventory Master routes */}
                <Route
                  path="/dashboard"
                  element={
                    <InventoryProtectedRoute requireMaster={true}>
                      <MasterDashboard />
                    </InventoryProtectedRoute>
                  }
                />
                <Route
                  path="/stores"
                  element={
                    <InventoryProtectedRoute requireMaster={true}>
                      <StoreManagement />
                    </InventoryProtectedRoute>
                  }
                />
                <Route
                  path="/employees"
                  element={
                    <InventoryProtectedRoute requireMaster={true}>
                      <EmployeeManagement />
                    </InventoryProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <InventoryProtectedRoute requireMaster={true}>
                      <ProductManagement />
                    </InventoryProtectedRoute>
                  }
                />
                <Route
                  path="/sales"
                  element={
                    <InventoryProtectedRoute requireMaster={true}>
                      <SalesReports />
                    </InventoryProtectedRoute>
                  }
                />

                {/* Inventory Member routes */}
                <Route
                  path="/pos"
                  element={
                    <InventoryProtectedRoute>
                      <MemberPOS />
                    </InventoryProtectedRoute>
                  }
                />
                <Route
                  path="/my-sales"
                  element={
                    <InventoryProtectedRoute>
                      <MemberSales />
                    </InventoryProtectedRoute>
                  }
                />

                {/* Inventory Default redirect */}
                <Route path="/" element={<Navigate to="/inventory/login" replace />} />
                <Route path="*" element={<Navigate to="/inventory/login" replace />} />
              </Routes>
            </InventoryAuthProvider>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
