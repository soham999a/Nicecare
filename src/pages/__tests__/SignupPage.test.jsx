import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SignupPage from '../../pages/SignupPage';

// Mock the context hooks
const mockSignup = vi.fn();
const mockToggleTheme = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
    currentUser: null,
    loading: false,
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: mockToggleTheme,
  }),
}));

const renderSignupPage = () => {
  return render(
    <BrowserRouter>
      <SignupPage />
    </BrowserRouter>
  );
};

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders the signup form', () => {
      renderSignupPage();

      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    });

    it('renders business name input field', () => {
      renderSignupPage();

      const businessNameInput = screen.getByLabelText(/shop.*business name/i);
      expect(businessNameInput).toBeInTheDocument();
      expect(businessNameInput).toHaveAttribute('type', 'text');
    });

    it('renders email input field', () => {
      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('renders password input field', () => {
      renderSignupPage();

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('renders confirm password input field', () => {
      renderSignupPage();

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    it('renders sign up button', () => {
      renderSignupPage();

      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('renders sign in link', () => {
      renderSignupPage();

      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders theme toggle button', () => {
      renderSignupPage();

      const themeButton = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(themeButton).toBeInTheDocument();
    });
  });

  describe('Business Name Field', () => {
    it('is required', () => {
      renderSignupPage();

      const businessNameInput = screen.getByLabelText(/shop.*business name/i);
      expect(businessNameInput).toBeRequired();
    });

    it('accepts text input', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const businessNameInput = screen.getByLabelText(/shop.*business name/i);
      await user.type(businessNameInput, 'ABC Electronics');

      expect(businessNameInput).toHaveValue('ABC Electronics');
    });

    it('has placeholder text', () => {
      renderSignupPage();

      const businessNameInput = screen.getByPlaceholderText(/abc electronics/i);
      expect(businessNameInput).toBeInTheDocument();
    });
  });

  describe('Email Field', () => {
    it('is required', () => {
      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeRequired();
    });

    it('accepts email input', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('has email type for browser validation', () => {
      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('has placeholder text', () => {
      renderSignupPage();

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      expect(emailInput).toBeInTheDocument();
    });
  });

  describe('Password Field', () => {
    it('is required', () => {
      renderSignupPage();

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toBeRequired();
    });

    it('accepts password input', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('masks password input', () => {
      renderSignupPage();

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('has placeholder indicating minimum length', () => {
      renderSignupPage();

      const passwordInput = screen.getByPlaceholderText(/at least 6 characters/i);
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe('Confirm Password Field', () => {
    it('is required', () => {
      renderSignupPage();

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toBeRequired();
    });

    it('accepts password input', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'password123');

      expect(confirmPasswordInput).toHaveValue('password123');
    });

    it('masks password input', () => {
      renderSignupPage();

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Password Validation', () => {
    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password456');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it('shows error when password is less than 6 characters', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), '12345');
      await user.type(screen.getByLabelText(/confirm password/i), '12345');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it('allows exactly 6 character password', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValue({});
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), '123456');
      await user.type(screen.getByLabelText(/confirm password/i), '123456');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls signup with email, password, and display name on submit', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValue({});
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'password123', 'ABC Electronics');
      });
    });

    it('navigates to verify-email page on successful signup', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValue({});
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/verify-email');
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockSignup.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error for email already in use', async () => {
      const user = userEvent.setup();
      mockSignup.mockRejectedValue({ code: 'auth/email-already-in-use' });
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
      });
    });

    it('displays error for invalid email', async () => {
      const user = userEvent.setup();
      mockSignup.mockRejectedValue({ code: 'auth/invalid-email' });
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      // Use a valid email format so form submits, but mock returns invalid-email error
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('displays error for weak password', async () => {
      const user = userEvent.setup();
      mockSignup.mockRejectedValue({ code: 'auth/weak-password' });
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is too weak/i)).toBeInTheDocument();
      });
    });

    it('displays generic error for unknown error codes', async () => {
      const user = userEvent.setup();
      mockSignup.mockRejectedValue({ code: 'auth/unknown-error' });
      renderSignupPage();

      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
      });
    });

    it('clears validation error on new submit attempt', async () => {
      const user = userEvent.setup();
      mockSignup.mockResolvedValue({});
      renderSignupPage();

      // First attempt with mismatched passwords
      await user.type(screen.getByLabelText(/shop.*business name/i), 'ABC Electronics');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password456');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();

      // Fix the password and submit again
      await user.clear(screen.getByLabelText(/confirm password/i));
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Theme Toggle', () => {
    it('calls toggleTheme when theme button is clicked', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const themeButton = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(themeButton);

      expect(mockToggleTheme).toHaveBeenCalled();
    });
  });

  describe('Navigation Links', () => {
    it('sign in link points to correct route', () => {
      renderSignupPage();

      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderSignupPage();

      expect(screen.getByLabelText(/shop.*business name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('form fields are focusable', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const businessNameInput = screen.getByLabelText(/shop.*business name/i);
      await user.click(businessNameInput);

      expect(businessNameInput).toHaveFocus();
    });

    it('can navigate form with keyboard', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const businessNameInput = screen.getByLabelText(/shop.*business name/i);
      await user.click(businessNameInput);
      await user.tab();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveFocus();
    });
  });
});
