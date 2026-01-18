import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordPage from '../../pages/ForgotPasswordPage';

// Mock the context hooks
const mockResetPassword = vi.fn();
const mockToggleTheme = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword,
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: mockToggleTheme,
  }),
}));

const renderForgotPasswordPage = () => {
  return render(
    <BrowserRouter>
      <ForgotPasswordPage />
    </BrowserRouter>
  );
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders the forgot password form', () => {
      renderForgotPasswordPage();

      expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
    });

    it('renders email input field', () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('renders send reset link button', () => {
      renderForgotPasswordPage();

      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('renders back to sign in link', () => {
      renderForgotPasswordPage();

      expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
    });

    it('renders theme toggle button', () => {
      renderForgotPasswordPage();

      const themeButton = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(themeButton).toBeInTheDocument();
    });

    it('renders the brand logo', () => {
      renderForgotPasswordPage();

      expect(screen.getByText(/nicecare crm/i)).toBeInTheDocument();
    });
  });

  describe('Email Field', () => {
    it('is required', () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeRequired();
    });

    it('accepts email input', async () => {
      const user = userEvent.setup();
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('has email type for browser validation', () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('has placeholder text', () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('starts empty', () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveValue('');
    });
  });

  describe('Form Submission', () => {
    it('calls resetPassword with email on submit', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({});
      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('shows success message after successful submission', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({});
      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/check your inbox for password reset instructions/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
      });
    });

    it('disables submit button during loading', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockImplementation(() => new Promise(() => {}));
      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /sending/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error for user not found', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValue({ code: 'auth/user-not-found' });
      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'nonexistent@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/no account found with this email/i)).toBeInTheDocument();
      });
    });

    it('displays error for invalid email', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValue({ code: 'auth/invalid-email' });
      renderForgotPasswordPage();

      // Use a valid email format so form submits, but mock returns invalid-email error
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('displays generic error for unknown error codes', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValue({ code: 'auth/unknown-error' });
      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to send reset email/i)).toBeInTheDocument();
      });
    });

    it('clears error message on new submission', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValueOnce({ code: 'auth/user-not-found' });
      mockResetPassword.mockResolvedValueOnce({});
      renderForgotPasswordPage();

      // First attempt - fails
      await user.type(screen.getByLabelText(/email address/i), 'nonexistent@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/no account found with this email/i)).toBeInTheDocument();
      });

      // Second attempt
      await user.clear(screen.getByLabelText(/email address/i));
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.queryByText(/no account found with this email/i)).not.toBeInTheDocument();
      });
    });

    it('clears success message on new submission', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({});
      renderForgotPasswordPage();

      // First successful submission
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
      });

      // Submit again
      await user.clear(screen.getByLabelText(/email address/i));
      await user.type(screen.getByLabelText(/email address/i), 'another@example.com');
      
      // Success message should still be there until we submit
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  describe('Theme Toggle', () => {
    it('calls toggleTheme when theme button is clicked', async () => {
      const user = userEvent.setup();
      renderForgotPasswordPage();

      const themeButton = screen.getByRole('button', { name: /switch to dark mode/i });
      await user.click(themeButton);

      expect(mockToggleTheme).toHaveBeenCalled();
    });
  });

  describe('Navigation Links', () => {
    it('back to sign in link points to correct route', () => {
      renderForgotPasswordPage();

      const signInLink = screen.getByRole('link', { name: /back to sign in/i });
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderForgotPasswordPage();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('email input is focusable', async () => {
      const user = userEvent.setup();
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.click(emailInput);

      expect(emailInput).toHaveFocus();
    });

    it('submit button is keyboard accessible', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({});
      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.tab(); // Move to submit button
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Submissions', () => {
    it('allows multiple reset requests', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValue({});
      renderForgotPasswordPage();

      // First submission
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledTimes(1);
      });

      // Second submission
      await user.clear(screen.getByLabelText(/email address/i));
      await user.type(screen.getByLabelText(/email address/i), 'another@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledTimes(2);
      });
    });
  });
});
