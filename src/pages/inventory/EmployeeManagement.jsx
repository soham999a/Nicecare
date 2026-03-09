import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useInventoryAuth } from '../../context/InventoryAuthContext';
import { useEmployees } from '../../hooks/useEmployees';
import { useStores } from '../../hooks/useStores';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function EmployeeManagement() {
  useEffect(() => {
    document.body.classList.add('edge-to-edge-page');
    return () => {
      document.body.classList.remove('edge-to-edge-page');
    };
  }, []);

  const { userProfile } = useInventoryAuth();
  const isMaster = userProfile?.role === 'master';
  const isManager = userProfile?.role === 'manager';

  if (!isMaster && !isManager) {
    return <Navigate to="/inventory/pos" replace />;
  }

  return (
    <EmployeeManagementContent
      userProfile={userProfile}
      isMaster={isMaster}
      isManager={isManager}
    />
  );
}

function EmployeeManagementContent({ userProfile, isMaster, isManager }) {
  const { employees, loading, error, creating, createEmployee, updateEmployee, toggleEmployeeActive, deleteEmployee } = useEmployees();
  const { stores } = useStores();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState(null);
  const getDefaultFormData = () => ({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    storeId: isManager ? (userProfile?.assignedStoreId || '') : '',
    storeName: isManager ? (userProfile?.assignedStoreName || '') : '',
  });
  const [formData, setFormData] = useState(() => getDefaultFormData());
  const [formError, setFormError] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function resetForm() {
    setFormData(getDefaultFormData());
    setEditingEmployee(null);
    setShowForm(false);
    setFormError('');
  }

  function openCreateForm() {
    setFormData(getDefaultFormData());
    setEditingEmployee(null);
    setFormError('');
    setShowForm(true);
  }

  function handleStoreChange(storeId) {
    const store = stores.find(s => s.id === storeId);
    setFormData({
      ...formData,
      storeId,
      storeName: store?.name || '',
    });
  }

  function handleEdit(employee) {
    setFormData({
      name: employee.displayName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role || 'member',
      storeId: employee.assignedStoreId || '',
      storeName: employee.assignedStoreName || '',
    });
    setEditingEmployee(employee);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Employee name is required');
      return;
    }

    if (!editingEmployee && !formData.email.trim()) {
      setFormError('Email is required for new employees');
      return;
    }

    if (!formData.storeId) {
      setFormError('Please assign the employee to a store');
      return;
    }

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          displayName: formData.name,
          phone: formData.phone,
          assignedStoreId: formData.storeId,
          assignedStoreName: formData.storeName,
        });
        resetForm();
      } else {
        const result = await createEmployee({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: isMaster ? formData.role : 'member',
          storeId: formData.storeId,
          storeName: formData.storeName,
        });
        setNewEmployeeCredentials(result);
        resetForm();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save employee');
    }
  }

  async function handleToggleActive(employee) {
    try {
      await toggleEmployeeActive(employee.id, !employee.isActive);
    } catch (err) {
      alert('Failed to update employee status: ' + err.message);
    }
  }

  async function handleDelete(employeeId, employeeName) {
    setDeleteConfirm({ id: employeeId, name: employeeName });
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;

    try {
      await deleteEmployee(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete employee: ' + err.message);
      setDeleteConfirm(null);
    }
  }

  const filteredEmployees = employees
    .filter((e) => (filterStore ? e.assignedStoreId === filterStore : true))
    .filter((e) => (filterRole ? (e.role || 'member') === filterRole : true));

  const visibleEmployees = isManager
    ? filteredEmployees.filter(e => e.role !== 'manager')
    : filteredEmployees;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Remove Employee"
        message={`Are you sure you want to remove "${deleteConfirm?.name}"? This will deactivate their account.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />

      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-50">Employee Management</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            {isMaster ? 'Manage employees across all stores' : 'Manage employees for your assigned store'}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50"
          onClick={() => {
            if (showForm) {
              resetForm();
              return;
            }
            openCreateForm();
          }}
          disabled={!isManager && stores.length === 0}
          title={showForm ? "Close form" : "Add new employee"}
        >
          {showForm ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            '+ Add Employee'
          )}
        </button>
      </div>

      {!isManager && stores.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          You need to create at least one store before adding employees.
          <a href="/inventory/stores" className="font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 ml-1">Create a store</a>
        </div>
      )}

      {/* New Employee Invitation Modal */}
      {newEmployeeCredentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-fade-in">
          <ModalSuccessContent 
            credentials={newEmployeeCredentials} 
            onClose={() => setNewEmployeeCredentials(null)} 
          />
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-5 shadow-card animate-fade-in-up">
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-50 mb-4">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">{formError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Full Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Email {!editingEmployee && '*'}</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john@company.com"
                  disabled={editingEmployee}
                  required={!editingEmployee}
                />
                {editingEmployee && (
                  <span className="text-xs text-slate-400 dark:text-gray-500">Email cannot be changed</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>

              {isMaster && !editingEmployee && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Role *</label>
                  <select
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              )}

              {!isManager ? (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Assigned Store *</label>
                  <select
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    value={formData.storeId}
                    onChange={(e) => handleStoreChange(e.target.value)}
                    required
                  >
                    <option value="">Select a store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">Assigned Store *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50"
                    value={userProfile?.assignedStoreName || 'Unassigned'}
                    readOnly
                  />
                  <p className="text-xs text-slate-400 dark:text-gray-500">
                    Managers can only assign employees to their own store.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50" disabled={creating}>
                {creating ? 'Creating...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
              </button>
              <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      {!isManager && stores.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-gray-400">Filter by Store:</label>
            <select
              className="px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
            >
              <option value="">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          {isMaster && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600 dark:text-gray-400">Filter by Role:</label>
              <select
                className="px-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="manager">Managers</option>
                <option value="member">Members</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Employees List */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-50">Your Employees</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            {visibleEmployees.length} employees
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 dark:text-gray-500">Loading employees...</div>
        ) : error ? (
          <div className="flex items-center justify-center p-12 text-red-600 dark:text-red-400">{error}</div>
        ) : visibleEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-gray-500 space-y-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-300">No employees yet</h3>
            <p className="text-sm">{filterStore ? 'No employees in this store' : 'Add employees to your store'}</p>
            {!filterStore && ((!isManager && stores.length > 0) || (isManager && !!userProfile?.assignedStoreId)) && (
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-700 text-white mt-2" onClick={openCreateForm}>
                + Add Employee
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Assigned Store</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {visibleEmployees.map((employee) => (
                  <tr key={employee.id} className={`hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors ${!employee.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                          {employee.displayName?.charAt(0).toUpperCase() || 'E'}
                        </div>
                        <strong className="text-slate-900 dark:text-gray-50">{employee.displayName}</strong>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        (employee.role || 'member') === 'manager'
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                          : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300'
                      }`}>
                        {(employee.role || 'member') === 'manager' ? 'Manager' : 'Member'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-gray-300">{employee.email}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-gray-400">{employee.phone || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {employee.assignedStoreName || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        employee.isActive
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-center px-5 py-3">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          onClick={() => handleEdit(employee)}
                          title="Edit"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            employee.isActive
                              ? 'text-slate-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              : 'text-slate-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                          }`}
                          onClick={() => handleToggleActive(employee)}
                          title={employee.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {employee.isActive ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="p-2 rounded-lg text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          onClick={() => handleDelete(employee.id, employee.displayName)}
                          title="Delete"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function ModalSuccessContent({ credentials, onClose }) {
  const [copiedType, setCopiedType] = useState(null);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const signupLink = `${window.location.origin}/inventory/signup?type=employee&code=${credentials.inviteCode}`;
  const invitedRoleLabel = credentials.role === 'manager' ? 'manager' : 'employee';

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl max-w-lg w-full shadow-xl animate-fade-in-scale overflow-hidden">
      <div className="flex flex-col items-center pt-8 pb-4 px-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>

      <div className="text-center px-6 pb-4 space-y-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-gray-50">Invitation Ready!</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400">
          Invitation created for <strong className="text-slate-900 dark:text-gray-50">{credentials.name}</strong> ({invitedRoleLabel}). Share the details below.
        </p>
        
        <div className="bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-4 mt-4 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">Email Address</label>
              <span className="block text-sm text-slate-900 dark:text-gray-50 mt-0.5">{credentials.email}</span>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-gray-700 pt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <label className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">Invitation Code</label>
              <span className="block text-sm font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{credentials.inviteCode}</span>
            </div>
            <button 
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copiedType === 'code'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => handleCopy(credentials.inviteCode, 'code')}
            >
              {copiedType === 'code' ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-gray-700 pt-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label className="text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wider">Direct Signup Link</label>
              <input 
                readOnly 
                className="block w-full text-xs text-slate-500 dark:text-gray-400 bg-transparent border-none p-0 mt-0.5 truncate focus:outline-none"
                value={signupLink}
              />
            </div>
            <button 
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copiedType === 'link'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={() => handleCopy(signupLink, 'link')}
            >
              {copiedType === 'link' ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="pt-3 space-y-1.5 text-xs text-slate-400 dark:text-gray-500">
          <div className="flex items-center justify-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Expires in 7 days</span>
          </div>
          <p>The invited staff member can sign up using an existing account or create a new one using this link.</p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-gray-700">
        <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-700 text-white" onClick={onClose}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
