import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock Firebase Firestore functions
const mockUnsubscribe = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: (...args) => {
    mockOnSnapshot(...args);
    return mockUnsubscribe;
  },
  addDoc: (...args) => mockAddDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  doc: vi.fn((db, collection, id) => ({ id, collection })),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  getFirestore: vi.fn(() => ({})),
}));

// Mock Firebase App
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));

// Mock useInventoryAuth
const mockUseInventoryAuth = vi.fn();
const mockCreateEmployee = vi.fn();
vi.mock('../../context/InventoryAuthContext', () => ({
  useInventoryAuth: () => mockUseInventoryAuth(),
}));

import { useEmployees } from '../useEmployees';
import {
  mockMasterUser,
  mockMasterProfile,
  mockEmployees,
} from '../../test/mocks/inventoryContexts';

describe('useEmployees Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateEmployee.mockResolvedValue({
      inviteCode: 'ABCD1234',
      invitationId: 'invite-123',
    });
    mockUseInventoryAuth.mockReturnValue({
      currentUser: mockMasterUser,
      userProfile: mockMasterProfile,
      createEmployee: mockCreateEmployee,
    });
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

      const { result } = renderHook(() => useEmployees());

      expect(result.current.loading).toBe(true);
      expect(result.current.employees).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should return empty employees if user is not authenticated', () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
        createEmployee: mockCreateEmployee,
      });

      const { result } = renderHook(() => useEmployees());

      expect(result.current.employees).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should return empty employees if user is not a master', () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: { uid: 'test-uid' },
        userProfile: { role: 'member' },
        createEmployee: mockCreateEmployee,
      });

      const { result } = renderHook(() => useEmployees());

      expect(result.current.employees).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Fetching Employees', () => {
    it('should fetch employees successfully', async () => {
      mockOnSnapshot.mockImplementation((query, successCallback) => {
        successCallback({
          docs: mockEmployees.map(employee => ({
            id: employee.id,
            data: () => employee,
          })),
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useEmployees());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.employees).toHaveLength(2);
      expect(result.current.employees[0].displayName).toBe('John Employee');
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Firebase error');
      mockOnSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        errorCallback(mockError);
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useEmployees());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load employees');
    });
  });

  describe('Creating Employees (Invitation System)', () => {
    it('should create employee invitation', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

      const { result } = renderHook(() => useEmployees());

      const newEmployee = {
        name: 'New Employee',
        email: 'newemployee@store.com',
        phone: '555-5555',
        assignedStoreId: 'store-123',
        storeName: 'Main Store',
      };

      let invitation;
      await act(async () => {
        invitation = await result.current.createEmployee(newEmployee);
      });

      expect(invitation.inviteCode).toBe('ABCD1234');
      expect(invitation.name).toBe('New Employee');
      expect(mockCreateEmployee).toHaveBeenCalledWith(newEmployee);
    });

    it('should throw error when non-master tries to create employee', async () => {
      mockUseInventoryAuth.mockReturnValue({
        currentUser: { uid: 'member-uid' },
        userProfile: { role: 'member' },
        createEmployee: mockCreateEmployee,
      });

      const { result } = renderHook(() => useEmployees());

      await expect(
        result.current.createEmployee({ name: 'Test' })
      ).rejects.toThrow('Only master accounts can create employees');
    });

    it('should track creating state during employee creation', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockCreateEmployee.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ inviteCode: 'TEST1234' }), 100))
      );

      const { result } = renderHook(() => useEmployees());

      let createPromise;
      act(() => {
        createPromise = result.current.createEmployee({
          name: 'Test',
          email: 'test@test.com',
        });
      });

      expect(result.current.creating).toBe(true);

      await act(async () => {
        await createPromise;
      });

      expect(result.current.creating).toBe(false);
    });
  });

  describe('Updating Employees', () => {
    it('should update employee details', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ assignedStoreId: 'store-123' }),
      });

      const { result } = renderHook(() => useEmployees());

      await act(async () => {
        await result.current.updateEmployee('employee-1', {
          phone: '555-9999',
        });
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should update store counts when changing employee assignment', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockUpdateDoc.mockResolvedValue(undefined);
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ assignedStoreId: 'store-123' }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ employeeCount: 5 }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ employeeCount: 2 }),
        });

      const { result } = renderHook(() => useEmployees());

      await act(async () => {
        await result.current.updateEmployee('employee-1', {
          assignedStoreId: 'store-456',
          assignedStoreName: 'Downtown Branch',
        });
      });

      // Should have updated both stores' employee counts
      expect(mockUpdateDoc).toHaveBeenCalledTimes(3);
    });
  });

  describe('Deleting Employees', () => {
    it('should delete employee and update store count', async () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
      mockDeleteDoc.mockResolvedValue(undefined);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ 
          assignedStoreId: 'store-123',
          employeeCount: 5,
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useEmployees());

      await act(async () => {
        await result.current.deleteEmployee('employee-1');
      });

      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', () => {
      mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

      const { unmount } = renderHook(() => useEmployees());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
