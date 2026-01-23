import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock useInventoryAuth
const mockLogout = vi.fn();
const mockUseInventoryAuth = vi.fn();
vi.mock('../../../context/InventoryAuthContext', () => ({
  useInventoryAuth: () => mockUseInventoryAuth(),
}));

// Mock useTheme
vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

import InventoryNavbar from '../InventoryNavbar';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('InventoryNavbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Master User Navigation', () => {
    beforeEach(() => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: { uid: 'master-123', email: 'master@store.com' },
        userProfile: { 
          role: 'master', 
          displayName: 'Store Owner',
          businessName: 'Test Store',
        },
        logout: mockLogout,
      });
    });

    it('should render navigation links for master user', () => {
      renderWithRouter(<InventoryNavbar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Stores')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Employees')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    it('should display business name', () => {
      renderWithRouter(<InventoryNavbar />);

      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('should display user profile info', () => {
      renderWithRouter(<InventoryNavbar />);

      expect(screen.getByText('Store Owner')).toBeInTheDocument();
    });

    it('should call logout when logout button is clicked', () => {
      renderWithRouter(<InventoryNavbar />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Member User Navigation', () => {
    beforeEach(() => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: { uid: 'member-456', email: 'employee@store.com' },
        userProfile: { 
          role: 'member', 
          displayName: 'John Employee',
          assignedStoreName: 'Main Store',
        },
        logout: mockLogout,
      });
    });

    it('should render limited navigation for member user', () => {
      renderWithRouter(<InventoryNavbar />);

      expect(screen.getByText('POS')).toBeInTheDocument();
      expect(screen.getByText('My Sales')).toBeInTheDocument();
    });

    it('should NOT show stores and employees links for member', () => {
      renderWithRouter(<InventoryNavbar />);

      expect(screen.queryByText('Stores')).not.toBeInTheDocument();
      expect(screen.queryByText('Employees')).not.toBeInTheDocument();
    });

    it('should display assigned store name', () => {
      renderWithRouter(<InventoryNavbar />);

      expect(screen.getByText('John Employee')).toBeInTheDocument();
    });
  });

  describe('No User', () => {
    it('should handle no user gracefully', () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
        logout: mockLogout,
      });

      renderWithRouter(<InventoryNavbar />);

      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });
  });
});
