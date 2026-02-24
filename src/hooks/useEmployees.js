import { useState, useEffect } from 'react';
import { useInventoryAuth } from '../context/InventoryAuthContext';
import * as employeesRepo from '../backend/firestore/repositories/employeesRepository';

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const { currentUser, userProfile, createEmployee: createEmployeeInvitation } = useInventoryAuth();

  useEffect(() => {
    if (!currentUser || userProfile?.role !== 'master') {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const unsubscribe = employeesRepo.subscribeEmployees(
      currentUser.uid,
      (employeeData) => {
        setEmployees(employeeData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching employees:', err);
        setError('Failed to load employees');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  async function createEmployee(employeeData) {
    if (!currentUser || userProfile?.role !== 'master') {
      throw new Error('Only master accounts can create employees');
    }
    setCreating(true);
    try {
      const result = await createEmployeeInvitation(employeeData);
      return {
        name: employeeData.name,
        email: employeeData.email,
        inviteCode: result.inviteCode,
        invitationId: result.invitationId,
        storeName: employeeData.storeName,
      };
    } finally {
      setCreating(false);
    }
  }

  async function updateEmployee(employeeId, updates) {
    if (!currentUser) throw new Error('Not authenticated');
    const emp = employees.find((e) => e.id === employeeId);
    await employeesRepo.updateEmployee(employeeId, updates, {
      syncInventoryUsers: !!emp?.uid,
      inventoryUserUid: emp?.uid || null,
    });
  }

  async function toggleEmployeeActive(employeeId, isActive) {
    await updateEmployee(employeeId, { isActive });
  }

  async function deleteEmployee(employeeId) {
    if (!currentUser) throw new Error('Not authenticated');
    return employeesRepo.deleteEmployee(employeeId);
  }

  return {
    employees,
    loading,
    error,
    creating,
    createEmployee,
    updateEmployee,
    toggleEmployeeActive,
    deleteEmployee,
  };
}
