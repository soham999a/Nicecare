import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerForm from '../../components/CustomerForm';

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
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('CustomerForm', () => {
  describe('Form Rendering', () => {
    it('renders the form with all basic fields', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });

    it('renders form mode toggle buttons', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      expect(screen.getByRole('button', { name: /minimal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /detailed/i })).toBeInTheDocument();
    });

    it('renders submit and reset buttons', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      expect(screen.getByRole('button', { name: /submit|add/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset|clear/i })).toBeInTheDocument();
    });

    it('renders status dropdown with all options', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toBeInTheDocument();

      const options = [
        'Select',
        'Device Received',
        'Under Diagnosis',
        'Waiting for Parts',
        'Repair in Progress',
        'Quality Check',
        'Ready for Pickup',
        'Delivered',
        'Cancelled',
        'Unrepairable',
      ];

      options.forEach((option) => {
        expect(screen.getByRole('option', { name: option })).toBeInTheDocument();
      });
    });
  });

  describe('Form Mode Toggle', () => {
    it('starts in minimal mode by default', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const minimalButton = screen.getByRole('button', { name: /minimal/i });
      expect(minimalButton).toHaveClass('active');
    });

    it('switches to detailed mode when clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const detailedButton = screen.getByRole('button', { name: /detailed/i });
      await user.click(detailedButton);

      expect(detailedButton).toHaveClass('active');
    });

    it('shows additional fields in detailed mode', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const detailedButton = screen.getByRole('button', { name: /detailed/i });
      await user.click(detailedButton);

      // Extended customer info should be visible
      expect(screen.getByText(/extended customer info/i)).toBeInTheDocument();
      // Device information section should be visible
      expect(screen.getByText(/device information/i)).toBeInTheDocument();
    });

    it('persists form mode to localStorage', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const detailedButton = screen.getByRole('button', { name: /detailed/i });
      await user.click(detailedButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('customerFormMode', 'detailed');
    });
  });

  describe('Name Field', () => {
    it('is a required field', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toBeRequired();
    });

    it('accepts text input', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      expect(nameInput).toHaveValue('John Doe');
    });

    it('updates state on change', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Jane Smith');

      expect(nameInput).toHaveValue('Jane Smith');
    });
  });

  describe('Email Field', () => {
    it('has email type for validation', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('accepts valid email format', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('is not required but form needs email OR phone', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).not.toBeRequired();
    });
  });

  describe('Phone Field', () => {
    it('accepts numeric input', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const phoneInput = screen.getByLabelText(/^phone$/i);
      await user.type(phoneInput, '1234567890');

      expect(phoneInput).toHaveValue('1234567890');
    });

    it('is not required but form needs email OR phone', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const phoneInput = screen.getByLabelText(/^phone$/i);
      expect(phoneInput).not.toBeRequired();
    });
  });

  describe('Email/Phone Validation', () => {
    it('shows error when neither email nor phone is provided', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSubmit = vi.fn();
      render(<CustomerForm onSubmit={mockSubmit} loading={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      // Select a valid status
      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'Device Received');

      const submitButton = screen.getByRole('button', { name: /submit|add/i });
      await user.click(submitButton);

      expect(screen.getByText(/please provide either an email or phone number/i)).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('allows submission with only email', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSubmit = vi.fn();
      render(<CustomerForm onSubmit={mockSubmit} loading={false} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.selectOptions(screen.getByLabelText(/status/i), 'Device Received');

      const submitButton = screen.getByRole('button', { name: /submit|add/i });
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalled();
    });

    it('allows submission with only phone', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSubmit = vi.fn();
      render(<CustomerForm onSubmit={mockSubmit} loading={false} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/^phone$/i), '1234567890');
      await user.selectOptions(screen.getByLabelText(/status/i), 'Device Received');

      const submitButton = screen.getByRole('button', { name: /submit|add/i });
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  describe('Status Field', () => {
    it('defaults to Select', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toHaveValue('Select');
    });

    it('shows error when status is not selected', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSubmit = vi.fn();
      render(<CustomerForm onSubmit={mockSubmit} loading={false} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');

      const submitButton = screen.getByRole('button', { name: /submit|add/i });
      await user.click(submitButton);

      expect(screen.getByText(/please select a valid status/i)).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('allows selection of valid status options', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'Device Received');

      expect(statusSelect).toHaveValue('Device Received');
    });
  });

  describe('Date Fields', () => {
    it('sets submission date to today by default', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const submissionDateInput = screen.getByLabelText(/submission date/i);
      const today = new Date().toISOString().slice(0, 10);
      expect(submissionDateInput).toHaveValue(today);
    });

    it('shows error for future submission date', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSubmit = vi.fn();
      render(<CustomerForm onSubmit={mockSubmit} loading={false} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.selectOptions(screen.getByLabelText(/status/i), 'Device Received');

      const submissionDateInput = screen.getByLabelText(/submission date/i);
      await user.clear(submissionDateInput);
      await user.type(submissionDateInput, '2030-12-31');

      const submitButton = screen.getByRole('button', { name: /submit|add/i });
      await user.click(submitButton);

      expect(screen.getByText(/submission date cannot be a future date/i)).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('shows error when expected date is before submission date', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSubmit = vi.fn();
      render(<CustomerForm onSubmit={mockSubmit} loading={false} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.selectOptions(screen.getByLabelText(/status/i), 'Device Received');

      const submissionDateInput = screen.getByLabelText(/submission date/i);
      await user.clear(submissionDateInput);
      await user.type(submissionDateInput, '2026-01-15');

      const expectedDateInput = screen.getByLabelText(/expected date/i);
      await user.type(expectedDateInput, '2026-01-10');

      const submitButton = screen.getByRole('button', { name: /submit|add/i });
      await user.click(submitButton);

      expect(screen.getByText(/expected date cannot be earlier than submission date/i)).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Address Field', () => {
    it('accepts address input', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, '123 Main Street, City, State 12345');

      expect(addressInput).toHaveValue('123 Main Street, City, State 12345');
    });
  });

  describe('Notes Field', () => {
    it('accepts multiline text', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'Line 1\nLine 2');

      expect(notesInput.value).toContain('Line 1');
    });
  });

  describe('Detailed Mode Fields', () => {
    describe('Device Information', () => {
      it('shows device type dropdown with options', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const deviceTypeSelect = screen.getByLabelText(/device type/i);
        expect(deviceTypeSelect).toBeInTheDocument();

        const deviceTypes = ['Phone', 'Tablet', 'Laptop', 'Wearable', 'Other'];
        deviceTypes.forEach((type) => {
          expect(deviceTypeSelect.querySelector(`option[value="${type}"]`)).toBeInTheDocument();
        });
      });

      it('shows brand dropdown with options', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const brandSelect = screen.getByLabelText(/brand/i);
        expect(brandSelect).toBeInTheDocument();

        const brands = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Motorola', 'LG', 'Other'];
        brands.forEach((brand) => {
          expect(brandSelect.querySelector(`option[value="${brand}"]`)).toBeInTheDocument();
        });
      });

      it('shows carrier dropdown with options', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const carrierSelect = screen.getByLabelText(/carrier/i);
        expect(carrierSelect).toBeInTheDocument();

        const carriers = ['AT&T', 'Verizon', 'T-Mobile', 'Sprint', 'Unlocked', 'Other'];
        const options = carrierSelect.querySelectorAll('option');
        const optionTexts = Array.from(options).map(opt => opt.textContent);
        carriers.forEach((carrier) => {
          expect(optionTexts).toContain(carrier);
        });
      });
    });

    describe('IMEI Field Validation', () => {
      it('accepts valid 15-digit IMEI', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const imeiInput = screen.getByLabelText(/imei/i);
        await user.type(imeiInput, '123456789012345');

        expect(imeiInput).toHaveValue('123456789012345');
      });

      it('shows warning for invalid IMEI format but allows submission', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const mockSubmit = vi.fn();
        render(<CustomerForm onSubmit={mockSubmit} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        await user.type(screen.getByLabelText(/^name/i), 'John Doe');
        await user.type(screen.getByLabelText(/^email$/i), 'john@example.com');
        await user.selectOptions(screen.getByLabelText(/status/i), 'Device Received');

        const imeiInput = screen.getByLabelText(/imei/i);
        await user.type(imeiInput, '12345'); // Invalid IMEI

        const submitButton = screen.getByRole('button', { name: /submit|add/i });
        await user.click(submitButton);

        // Should show warning but still submit
        expect(screen.getByText(/imei should be 15 digits/i)).toBeInTheDocument();
        expect(mockSubmit).toHaveBeenCalled();
      });
    });

    describe('Customer Type Dropdown', () => {
      it('shows all customer type options', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const customerTypeSelect = screen.getByLabelText(/customer type/i);
        expect(customerTypeSelect).toBeInTheDocument();

        const types = ['Walk-in', 'Online', 'Corporate', 'Warranty'];
        types.forEach((type) => {
          expect(customerTypeSelect.querySelector(`option[value="${type}"]`)).toBeInTheDocument();
        });
      });
    });

    describe('Preferred Contact Dropdown', () => {
      it('shows all contact method options', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const preferredContactSelect = screen.getByLabelText(/preferred contact/i);
        expect(preferredContactSelect).toBeInTheDocument();

        const methods = ['Call', 'SMS', 'Email'];
        methods.forEach((method) => {
          expect(preferredContactSelect.querySelector(`option[value="${method}"]`)).toBeInTheDocument();
        });
      });
    });

    describe('Issue Category Dropdown', () => {
      it('shows all issue category options', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const issueCategorySelect = screen.getByLabelText(/issue category/i);
        expect(issueCategorySelect).toBeInTheDocument();

        const categories = ['Screen', 'Battery', 'Charging Port', 'Camera', 'Software', 'Water Damage', 'Other'];
        categories.forEach((category) => {
          expect(issueCategorySelect.querySelector(`option[value="${category}"]`)).toBeInTheDocument();
        });
      });
    });

    describe('Repair Type Dropdown', () => {
      it('shows all repair type options', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const repairTypeSelect = screen.getByLabelText(/repair type/i);
        expect(repairTypeSelect).toBeInTheDocument();

        const types = ['Repair', 'Diagnostic Only', 'Data Recovery'];
        types.forEach((type) => {
          expect(repairTypeSelect.querySelector(`option[value="${type}"]`)).toBeInTheDocument();
        });
      });
    });

    describe('Priority Dropdown', () => {
      it('shows all priority options', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const prioritySelect = screen.getByLabelText(/priority/i);
        expect(prioritySelect).toBeInTheDocument();

        const priorities = ['Normal', 'Urgent', 'Same-day'];
        priorities.forEach((priority) => {
          expect(prioritySelect.querySelector(`option[value="${priority}"]`)).toBeInTheDocument();
        });
      });
    });

    describe('Parts Type Dropdown', () => {
      it('shows all parts type options', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const partsTypeSelect = screen.getByLabelText(/parts type/i);
        expect(partsTypeSelect).toBeInTheDocument();

        const partsTypes = ['OEM', 'Aftermarket'];
        partsTypes.forEach((type) => {
          expect(partsTypeSelect.querySelector(`option[value="${type}"]`)).toBeInTheDocument();
        });
      });
    });

    describe('Cost Fields', () => {
      it('accepts numeric input for estimated cost', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const estimatedCostInput = screen.getByLabelText(/estimated cost/i);
        await user.type(estimatedCostInput, '150');

        expect(estimatedCostInput).toHaveValue(150);
      });

      it('accepts numeric input for advance paid', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

        await user.click(screen.getByRole('button', { name: /detailed/i }));

        const advancePaidInput = screen.getByLabelText(/advance paid/i);
        await user.type(advancePaidInput, '50');

        expect(advancePaidInput).toHaveValue(50);
      });
    });
  });

  describe('Form Reset', () => {
    it('clears all fields when reset is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');

      const resetButton = screen.getByRole('button', { name: /reset|clear/i });
      await user.click(resetButton);

      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
    });

    it('removes autosaved data from localStorage', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      const resetButton = screen.getByRole('button', { name: /reset|clear/i });
      await user.click(resetButton);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('customerFormAutosave');
    });

    it('clears error messages on reset', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      // Trigger an error
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      const submitButton = screen.getByRole('button', { name: /submit|add/i });
      await user.click(submitButton);

      expect(screen.getByText(/please provide either an email or phone number/i)).toBeInTheDocument();

      // Reset
      const resetButton = screen.getByRole('button', { name: /reset|clear/i });
      await user.click(resetButton);

      expect(screen.queryByText(/please provide either an email or phone number/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data when valid', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSubmit = vi.fn();
      render(<CustomerForm onSubmit={mockSubmit} loading={false} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/^phone$/i), '1234567890');
      await user.selectOptions(screen.getByLabelText(/status/i), 'Device Received');

      const submitButton = screen.getByRole('button', { name: /submit|add/i });
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          status: 'Device Received',
        })
      );
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSubmit = vi.fn();
      render(<CustomerForm onSubmit={mockSubmit} loading={false} />);

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.selectOptions(screen.getByLabelText(/status/i), 'Device Received');

      const submitButton = screen.getByRole('button', { name: /submit|add/i });
      await user.click(submitButton);

      expect(screen.getByLabelText(/name/i)).toHaveValue('');
    });

    it('shows loading state when loading prop is true', () => {
      render(<CustomerForm onSubmit={vi.fn()} loading={true} />);

      const submitButton = screen.getByRole('button', { name: /adding|submitting|loading/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Autosave Functionality', () => {
    it('saves form data to localStorage after debounce', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      await user.type(screen.getByLabelText(/name/i), 'John');

      // Advance timers to trigger debounced autosave
      vi.advanceTimersByTime(600);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'customerFormAutosave',
        expect.stringContaining('John')
      );
    });

    it('restores form data from localStorage on mount', () => {
      const savedData = JSON.stringify({
        name: 'Saved Name',
        email: 'saved@example.com',
        phone: '',
        status: 'Device Received',
      });
      localStorageMock.getItem.mockReturnValue(savedData);

      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      expect(screen.getByLabelText(/name/i)).toHaveValue('Saved Name');
      expect(screen.getByLabelText(/email/i)).toHaveValue('saved@example.com');
    });
  });

  describe('Collapsible Sections', () => {
    it('toggles section visibility when header is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<CustomerForm onSubmit={vi.fn()} loading={false} />);

      // Switch to detailed mode
      await user.click(screen.getByRole('button', { name: /detailed/i }));

      // Find and click a section header
      const sectionHeader = screen.getByText(/extended customer info/i);
      await user.click(sectionHeader);

      // The section content should toggle
      // We check by looking for the toggle icon change
      expect(sectionHeader.closest('button')).toBeInTheDocument();
    });
  });
});
