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
    if (!currentUser || !userProfile || (userProfile.role !== 'master' && userProfile.role !== 'manager')) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const isMaster = userProfile.role === 'master';
    const ownerUidForTenant = isMaster
      ? currentUser.uid
      : (userProfile.ownerUid || userProfile.masterUid);

    const storeIdForManager = isMaster ? null : userProfile.assignedStoreId || null;

    // Managers need ownerUid and assignedStoreId; skip query if missing to avoid permission errors
    if (!isMaster && (!ownerUidForTenant || !storeIdForManager)) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7555/ingest/14177494-399b-47b1-a251-61383150f196',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b7d8d0'},body:JSON.stringify({sessionId:'b7d8d0',runId:'initial',hypothesisId:'H1',location:'src/hooks/useEmployees.js',message:'Employees query resolved',data:{role:userProfile?.role||null,isMaster,hasOwnerUid:!!ownerUidForTenant,hasAssignedStoreId:!!storeIdForManager},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const unsubscribe = employeesRepo.subscribeEmployees(
      {
        ownerUid: ownerUidForTenant,
        storeId: storeIdForManager,
        onData: (employeeData) => {
          setEmployees(employeeData);
          setLoading(false);
          setError(null);
        },
        onError: (err) => {
          // #region agent log
          fetch('http://127.0.0.1:7555/ingest/14177494-399b-47b1-a251-61383150f196',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b7d8d0'},body:JSON.stringify({sessionId:'b7d8d0',runId:'initial',hypothesisId:'H4',location:'src/hooks/useEmployees.js',message:'Employees query failed',data:{role:userProfile?.role||null,errorCode:err?.code||null,errorMessage:err?.message||String(err)},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          console.error('Error fetching employees:', err);
          setError('Failed to load employees');
          setLoading(false);
        },
      }
    );

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  async function createEmployee(employeeData) {
    if (!currentUser || !userProfile || (userProfile.role !== 'master' && userProfile.role !== 'manager')) {
      throw new Error('Only master and manager accounts can create employees');
    }
    setCreating(true);
    try {
      let dataForInvite = { ...employeeData };

      // Managers can only invite members into their own store
      if (userProfile.role === 'manager') {
        dataForInvite = {
          ...dataForInvite,
          role: 'member',
          storeId: userProfile.assignedStoreId,
          storeName: userProfile.assignedStoreName || employeeData.storeName || '',
        };
      }

      const result = await createEmployeeInvitation(dataForInvite);
      return {
        name: dataForInvite.name,
        email: dataForInvite.email,
        role: dataForInvite.role || 'member',
        inviteCode: result.inviteCode,
        invitationId: result.invitationId,
        storeName: dataForInvite.storeName,
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
