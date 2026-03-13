import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { InventoryAuthProvider } from './context/InventoryAuthContext';

// Landing Page
import LandingPage from './pages/LandingPage';
import WirelessPOSLanding from './pages/WirelessPOSLanding';

// Inventory Components
import InventoryProtectedRoute from './components/inventory/InventoryProtectedRoute';
import InventoryLayout from './components/inventory/InventoryLayout';
import InventoryLoginPage from './pages/inventory/InventoryLoginPage';
import InventorySignupPage from './pages/inventory/InventorySignupPage';
import InventoryForgotPasswordPage from './pages/inventory/InventoryForgotPasswordPage';
import InventoryVerifyEmailPage from './pages/inventory/InventoryVerifyEmailPage';
import CompleteRegistrationPage from './pages/inventory/CompleteRegistrationPage';
import MasterDashboard from './pages/inventory/MasterDashboard';
import StoreManagement from './pages/inventory/StoreManagement';
import EmployeeManagement from './pages/inventory/EmployeeManagement';
import ProductManagement from './pages/inventory/ProductManagement';
import SalesReports from './pages/inventory/SalesReports';
import ApiDocsPage from './pages/inventory/ApiDocsPage';
import MemberPOS from './pages/inventory/MemberPOS';
import MemberSales from './pages/inventory/MemberSales';
import CRMPage from './pages/inventory/CRMPage';
import DataMigrationHub from './pages/inventory/DataMigrationHub';


function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* WirelessPOS Landing Page */}
          <Route path="/wireless" element={<WirelessPOSLanding />} />

          {/* Legacy auth routes - redirect to inventory */}
          <Route path="/login" element={<Navigate to="/inventory/login" replace />} />
          <Route path="/signup" element={<Navigate to="/inventory/signup" replace />} />
          <Route path="/dashboard" element={<Navigate to="/inventory/dashboard" replace />} />
          <Route path="/verify-email" element={<Navigate to="/inventory/verify-email" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/inventory/forgot-password" replace />} />

          {/* ===== Inventory Routes (single app: Inventory + POS + CRM) ===== */}
          <Route path="/inventory/*" element={
            <InventoryAuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<InventoryLoginPage />} />
                <Route path="/signup" element={<InventorySignupPage />} />
                <Route path="/forgot-password" element={<InventoryForgotPasswordPage />} />
                <Route path="/verify-email" element={<InventoryVerifyEmailPage />} />
                <Route path="/complete-registration" element={<CompleteRegistrationPage />} />

                {/* Authenticated routes wrapped in persistent layout */}
                <Route path="*" element={
                  <InventoryLayout>
                    <Routes>
                      {/* Master routes */}
                      <Route
                        path="/dashboard"
                        element={
                          <InventoryProtectedRoute>
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
                          <InventoryProtectedRoute>
                            <EmployeeManagement />
                          </InventoryProtectedRoute>
                        }
                      />
                      <Route
                        path="/products"
                        element={
                          <InventoryProtectedRoute>
                            <ProductManagement />
                          </InventoryProtectedRoute>
                        }
                      />
                      <Route
                        path="/sales"
                        element={
                          <InventoryProtectedRoute>
                            <SalesReports />
                          </InventoryProtectedRoute>
                        }
                      />
                      <Route
                        path="/data-migration-hub"
                        element={
                          <InventoryProtectedRoute requireMaster={true}>
                            <DataMigrationHub />
                          </InventoryProtectedRoute>
                        }
                      />
                      {/* Member routes */}
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

                      {/* CRM - both master and member (store-scoped for member) */}
                      <Route
                        path="/crm"
                        element={
                          <InventoryProtectedRoute>
                            <CRMPage />
                          </InventoryProtectedRoute>
                        }
                      />

                      {/* Default redirect within inventory */}
                      <Route path="/" element={<Navigate to="/inventory/login" replace />} />
                      <Route path="*" element={<Navigate to="/inventory/login" replace />} />
                    </Routes>
                  </InventoryLayout>
                } />

                {/* Standalone route without navbar */}
                <Route
                  path="/api-docs"
                  element={
                    <InventoryProtectedRoute requireMaster={true}>
                      <ApiDocsPage />
                    </InventoryProtectedRoute>
                  }
                />
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
