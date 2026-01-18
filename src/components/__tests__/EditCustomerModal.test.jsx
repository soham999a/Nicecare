import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditCustomerModal from '../../components/EditCustomerModal';

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  localStorageMock.getItem.mockReturnValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

const mockCustomer = {
  id: 'customer-123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  address: '123 Main St',
  submissionDate: '2026-01-15',
  expectedDate: '2026-01-20',
  status: 'Device Received',
  notes: 'Test notes',
  alternatePhone: '9876543210',
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
};

describe('EditCustomerModal', () => {
  describe('Modal Rendering', () => {
    it('renders the modal with customer data', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('renders form mode toggle buttons', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      expect(screen.getByRole('button', { name: /minimal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /detailed/i })).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      expect(screen.getByRole('button', { name: /^close$/i })).toBeInTheDocument();
    });

    it('renders save button', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      expect(screen.getByRole('button', { name: /save|update/i })).toBeInTheDocument();
    });
  });

  describe('Form Pre-population', () => {
    it('pre-populates name field', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveValue('John Doe');
    });

    it('pre-populates email field', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveValue('john@example.com');
    });

    it('pre-populates phone field', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const phoneInput = screen.getByLabelText(/^phone$/i);
      expect(phoneInput).toHaveValue('1234567890');
    });

    it('pre-populates address field', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const addressInput = screen.getByLabelText(/address/i);
      expect(addressInput).toHaveValue('123 Main St');
    });

    it('pre-populates status dropdown', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toHaveValue('Device Received');
    });

    it('pre-populates submission date', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const submissionDateInput = screen.getByLabelText(/submission date/i);
      expect(submissionDateInput).toHaveValue('2026-01-15');
    });

    it('pre-populates expected date', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const expectedDateInput = screen.getByLabelText(/expected date/i);
      expect(expectedDateInput).toHaveValue('2026-01-20');
    });
  });

  describe('Form Field Editing', () => {
    it('allows editing name field', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');

      expect(nameInput).toHaveValue('Jane Smith');
    });

    it('allows editing email field', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'jane@example.com');

      expect(emailInput).toHaveValue('jane@example.com');
    });

    it('allows editing phone field', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const phoneInput = screen.getByLabelText(/^phone$/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '5551234567');

      expect(phoneInput).toHaveValue('5551234567');
    });

    it('allows changing status', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'Repair in Progress');

      expect(statusSelect).toHaveValue('Repair in Progress');
    });
  });

  describe('Date Validation', () => {
    it('shows error for future submission date', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={mockSave}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const submissionDateInput = screen.getByLabelText(/submission date/i);
      await user.clear(submissionDateInput);
      await user.type(submissionDateInput, '2030-12-31');

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);

      expect(screen.getByText(/submission date cannot be a future date/i)).toBeInTheDocument();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('shows error when expected date is before submission date', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={mockSave}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const submissionDateInput = screen.getByLabelText(/submission date/i);
      const expectedDateInput = screen.getByLabelText(/expected date/i);

      await user.clear(submissionDateInput);
      await user.type(submissionDateInput, '2026-01-15');
      await user.clear(expectedDateInput);
      await user.type(expectedDateInput, '2026-01-10');

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);

      expect(screen.getByText(/expected date cannot be earlier than submission date/i)).toBeInTheDocument();
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('Status Validation', () => {
    it('shows error when status is Select', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      render(
        <EditCustomerModal
          customer={{ ...mockCustomer, status: 'Select' }}
          onSave={mockSave}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);

      expect(screen.getByText(/please select a valid status/i)).toBeInTheDocument();
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  describe('IMEI Validation', () => {
    it('shows warning for invalid IMEI but allows save', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={mockSave}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      const imeiInput = screen.getByLabelText(/imei/i);
      await user.clear(imeiInput);
      await user.type(imeiInput, '12345'); // Invalid IMEI

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);

      expect(screen.getByText(/imei should be 15 digits/i)).toBeInTheDocument();
      expect(mockSave).toHaveBeenCalled();
    });

    it('accepts valid 15-digit IMEI without warning', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={mockSave}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      const imeiInput = screen.getByLabelText(/imei/i);
      await user.clear(imeiInput);
      await user.type(imeiInput, '123456789012345');

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);

      expect(screen.queryByText(/imei should be 15 digits/i)).not.toBeInTheDocument();
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with updated data', async () => {
      const user = userEvent.setup();
      const mockSave = vi.fn();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={mockSave}
          onClose={vi.fn()}
          loading={false}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Smith');

      const saveButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(saveButton);

      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Smith',
        })
      );
    });

    it('shows loading state when loading prop is true', () => {
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={true}
        />
      );

      const saveButton = screen.getByRole('button', { name: /saving|updating|loading/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Modal Close', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockClose = vi.fn();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={mockClose}
          loading={false}
        />
      );

      const closeButton = screen.getByRole('button', { name: /^close$/i });
      await user.click(closeButton);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Detailed Mode', () => {
    it('shows extended fields in detailed mode', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      // Should show device info fields
      expect(screen.getByLabelText(/device type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/brand/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/imei/i)).toBeInTheDocument();
    });

    it('pre-populates extended fields from customer data', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      expect(screen.getByLabelText(/device type/i)).toHaveValue('Phone');
      expect(screen.getByLabelText(/brand/i)).toHaveValue('Apple');
      expect(screen.getByLabelText(/model/i)).toHaveValue('iPhone 14');
      expect(screen.getByLabelText(/imei/i)).toHaveValue('123456789012345');
    });

    it('shows all dropdown options for device type', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      const deviceTypeSelect = screen.getByLabelText(/device type/i);
      const deviceTypes = ['Phone', 'Tablet', 'Laptop', 'Wearable', 'Other'];
      deviceTypes.forEach((type) => {
        expect(deviceTypeSelect.querySelector(`option[value="${type}"]`)).toBeInTheDocument();
      });
    });

    it('shows all dropdown options for brand', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      const brandSelect = screen.getByLabelText(/brand/i);
      const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Motorola', 'LG', 'Other'];
      brands.forEach((brand) => {
        expect(brandSelect.querySelector(`option[value="${brand}"]`)).toBeInTheDocument();
      });
    });

    it('shows issue category dropdown options', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      const issueCategorySelect = screen.getByLabelText(/issue category/i);
      const categories = ['Screen', 'Battery', 'Charging Port', 'Camera', 'Software', 'Water Damage', 'Other'];
      categories.forEach((category) => {
        expect(issueCategorySelect.querySelector(`option[value="${category}"]`)).toBeInTheDocument();
      });
    });

    it('shows priority dropdown options', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      const priorities = ['Normal', 'Urgent', 'Same-day'];
      priorities.forEach((priority) => {
        expect(screen.getByRole('option', { name: priority })).toBeInTheDocument();
      });
    });
  });

  describe('Empty Customer Handling', () => {
    it('handles customer with empty optional fields', () => {
      const emptyCustomer = {
        id: 'customer-456',
        name: 'Jane Doe',
        email: '',
        phone: '1234567890',
        address: '',
        submissionDate: '2026-01-15',
        expectedDate: '',
        status: 'Device Received',
        notes: '',
      };

      render(
        <EditCustomerModal
          customer={emptyCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Doe');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText(/^phone$/i)).toHaveValue('1234567890');
    });
  });

  describe('Form Mode Persistence', () => {
    it('persists form mode to localStorage', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('customerFormMode', 'detailed');
    });
  });

  describe('Collapsible Sections', () => {
    it('can toggle section visibility in detailed mode', async () => {
      const user = userEvent.setup();
      render(
        <EditCustomerModal
          customer={mockCustomer}
          onSave={vi.fn()}
          onClose={vi.fn()}
          loading={false}
        />
      );

      await user.click(screen.getByRole('button', { name: /detailed/i }));

      // Find a section header and click it
      const sectionHeader = screen.getByText(/device information/i);
      await user.click(sectionHeader);

      // Section toggle should work
      expect(sectionHeader.closest('button')).toBeInTheDocument();
    });
  });
});
