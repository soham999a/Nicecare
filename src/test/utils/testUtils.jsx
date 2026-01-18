import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock implementations for contexts
const mockAuthContext = {
  currentUser: {
    uid: 'test-uid-123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
  },
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
  resendVerification: vi.fn(),
  loading: false,
};

const mockThemeContext = {
  theme: 'light',
  toggleTheme: vi.fn(),
};

// Create wrapper with all providers
const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// Custom render function with providers
const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };

// Export mock contexts for overriding in tests
export { mockAuthContext, mockThemeContext };

// Helper function to create mock submit handler
export const createMockSubmitHandler = () => vi.fn();

// Helper function to create mock customer data
export const createMockCustomer = (overrides = {}) => ({
  id: 'customer-123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  address: '123 Main St',
  submissionDate: '2026-01-15',
  expectedDate: '2026-01-20',
  status: 'Device Received',
  notes: 'Test notes',
  alternatePhone: '',
  customerType: 'Walk-in',
  preferredContact: 'Call',
  deviceType: 'Phone',
  brand: 'Apple',
  model: 'iPhone 14',
  imei: '123456789012345',
  carrier: 'AT&T',
  issueCategory: 'Screen',
  issueDescription: 'Cracked screen',
  repairType: 'Repair',
  priority: 'Normal',
  estimatedCost: '150',
  advancePaid: '50',
  partsType: 'OEM',
  deviceReceivedDate: '2026-01-15',
  repairStartDate: '2026-01-16',
  technicalStaffName: 'Tech Mike',
  ...overrides,
});
