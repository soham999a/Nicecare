import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import InventorySignupPage from '../../pages/inventory/InventorySignupPage';

const mockSignupMaster = vi.fn();
const mockSignupEmployee = vi.fn();
const mockCheckInvitation = vi.fn();
const mockToggleTheme = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../context/InventoryAuthContext', () => ({
  useInventoryAuth: () => ({
    signupMaster: mockSignupMaster,
    signupEmployee: mockSignupEmployee,
    checkInvitation: mockCheckInvitation,
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: mockToggleTheme,
  }),
}));

function renderPage() {
  return render(
    <BrowserRouter>
      <InventorySignupPage />
    </BrowserRouter>
  );
}

describe('InventorySignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders master signup form by default', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /create master account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your business name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@company\.com/i)).toBeInTheDocument();
  });

  it('switches to employee invite form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /staff \(invite\)/i }));
    expect(screen.getByRole('heading', { name: /join as staff/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter 8-character code/i)).toBeInTheDocument();
  });

  it('shows error when master passwords do not match', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/your business name/i), 'ABC Electronics');
    await user.type(screen.getByPlaceholderText(/name@company\.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/create a strong password/i), 'password123');
    await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password456');
    await user.click(screen.getByRole('button', { name: /create master account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockSignupMaster).not.toHaveBeenCalled();
  });

  it('submits master signup and navigates to verify email', async () => {
    const user = userEvent.setup();
    mockSignupMaster.mockResolvedValue({});
    renderPage();

    await user.type(screen.getByPlaceholderText(/your business name/i), 'ABC Electronics');
    await user.type(screen.getByPlaceholderText(/name@company\.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/create a strong password/i), 'password123');
    await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create master account/i }));

    await waitFor(() => {
      expect(mockSignupMaster).toHaveBeenCalledWith('test@example.com', 'password123', 'ABC Electronics');
      expect(mockNavigate).toHaveBeenCalledWith('/inventory/verify-email');
    });
  });

  it('calls toggleTheme from the theme button', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockToggleTheme).toHaveBeenCalled();
  });
});
