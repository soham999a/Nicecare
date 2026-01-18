import { vi } from 'vitest';

// Mock Auth Context values
export const mockAuthContextValue = {
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

// Mock Theme Context values
export const mockThemeContextValue = {
  theme: 'light',
  toggleTheme: vi.fn(),
};

// Create mock context providers
export const createMockAuthContext = (overrides = {}) => ({
  ...mockAuthContextValue,
  ...overrides,
});

export const createMockThemeContext = (overrides = {}) => ({
  ...mockThemeContextValue,
  ...overrides,
});
