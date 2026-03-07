import React, { useState, useMemo, useEffect } from 'react';
import EditCustomerModal from './EditCustomerModal';

// --- SVG Icons Components ---
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const IconChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
);
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block align-middle"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block align-middle"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);
const IconWrench = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block align-middle"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
);
const IconDollar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block align-middle"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block align-middle"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const IconArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);

// --- Helper Functions ---
const STATUS_OPTIONS = [
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

const displayValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-sm text-slate-400 dark:text-gray-600 italic">N/A</span>;
  }
  return <span className="text-sm text-slate-700 dark:text-gray-300">{value}</span>;
};

const formatCurrency = (value) => {
  if (!value) return <span className="text-sm text-slate-400 dark:text-gray-600 italic">N/A</span>;
  return <span className="text-sm text-slate-700 dark:text-gray-300">${parseFloat(value).toFixed(2)}</span>;
};

const getStatusBadgeClasses = (status) => {
  const base = 'inline-block px-2.5 py-1 rounded-full text-xs font-medium';
  const map = {
    'Device Received': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Under Diagnosis': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Waiting for Parts': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Repair in Progress': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Quality Check': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Ready for Pickup': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Delivered': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Unrepairable': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
  return `${base} ${map[status] || 'bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-300'}`;
};

const StatusBadge = ({ status }) => {
  return (
    <span className={getStatusBadgeClasses(status)}>
      {status}
    </span>
  );
};

export default function CustomerTable({ customers, onUpdateStatus, onUpdateCustomer, onDelete, updatingCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;

    const term = searchTerm.toLowerCase();
    return customers.filter((customer) => {
      return (
        customer.name?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.imei?.toLowerCase().includes(term) ||
        customer.model?.toLowerCase().includes(term)
      );
    });
  }, [customers, searchTerm]);

  useEffect(() => {
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
    if (currentPage > totalPages) {
      const t = setTimeout(() => setCurrentPage(totalPages), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [filteredCustomers, currentPage]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  function toggleExpand(id) {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function _hasDetailedData(customer) {
    return (
      customer.deviceType ||
      customer.brand ||
      customer.model ||
      customer.imei ||
      customer.issueCategory ||
      customer.estimatedCost ||
      customer.customerType
    );
  }

  function handleExport() {
    const headers = [
      'Name', 'Email', 'Phone', 'Address', 'Alternate Phone', 'Customer Type', 'Preferred Contact',
      'Device Type', 'Brand', 'Model', 'IMEI', 'Carrier',
      'Issue Category', 'Issue Description', 'Repair Type', 'Priority', 'Technical Staff Name',
      'Estimated Cost', 'Advance Paid', 'Parts Type',
      'Submission Date', 'Expected Date', 'Device Received Date by Technical Staff', 'Repair Start Date',
      'Status', 'Notes'
    ];
    const rows = filteredCustomers.map((c) => {
      return [
        c.name || '',
        c.email || '',
        c.phone || '',
        c.address || '',
        c.alternatePhone || '',
        c.customerType || '',
        c.preferredContact || '',
        c.deviceType || '',
        c.brand || '',
        c.model || '',
        c.imei || '',
        c.carrier || '',
        c.issueCategory || '',
        c.issueDescription || '',
        c.repairType || '',
        c.priority || '',
        c.technicalStaffName || '',
        c.estimatedCost || '',
        c.advancePaid || '',
        c.partsType || '',
        c.submissionDate || '',
        c.expectedDate || '',
        c.deviceReceivedDate || '',
        c.repairStartDate || '',
        c.status || '',
        c.notes || '',
      ].map((v) => (v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v));
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  // --- Updated Delete Logic ---
  function handleDeleteRequest(id) {
    setDeleteConfirmId(id);
  }

  function confirmDelete() {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }

  function cancelDelete() {
    setDeleteConfirmId(null);
  }

  function handleEdit(customer) {
    setModalCustomer(customer);
    setShowEditModal(true);
  }

  async function handleSaveEdit(formData) {
    try {
      await onUpdateCustomer(modalCustomer.id, formData);
      setShowEditModal(false);
      setModalCustomer(null);
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  }

  function handleCancelEdit() {
    setShowEditModal(false);
    setModalCustomer(null);
  }

  if (customers.length === 0) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-50 mb-4">Submitted Customer Details</h3>
        <div className="text-center text-slate-400 dark:text-gray-500 py-8">No records yet. Add your first customer!</div>
      </section>
    );
  }

  return (
    <>
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-50 mb-4">Submitted Customer Details</h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconSearch />
          </div>
          <input
            className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="Search by Name, Phone or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 font-medium transition-colors whitespace-nowrap flex items-center gap-2 justify-center"
          onClick={handleExport}
        >
          <IconDownload /> Export to CSV
        </button>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center text-slate-400 dark:text-gray-500 py-8">No matching records found</div>
      ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-b border-slate-200 dark:border-gray-700 font-medium"></th>
                <th className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-b border-slate-200 dark:border-gray-700 font-medium">Name</th>
                <th className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-b border-slate-200 dark:border-gray-700 font-medium">Contact</th>
                <th className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-b border-slate-200 dark:border-gray-700 font-medium">Dates</th>
                <th className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-b border-slate-200 dark:border-gray-700 font-medium">Status</th>
                <th className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-b border-slate-200 dark:border-gray-700 font-medium">Notes</th>
                <th className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-b border-slate-200 dark:border-gray-700 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-gray-700/50">
                      <button
                        className="bg-transparent border-none cursor-pointer text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 transition-colors"
                        onClick={() => toggleExpand(customer.id)}
                        title={expandedRows.has(customer.id) ? 'Collapse details' : 'Expand details'}
                      >
                        {expandedRows.has(customer.id) ? <IconChevronDown /> : <IconChevronRight />}
                      </button>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-gray-700/50">
                      <span className="font-semibold text-slate-900 dark:text-gray-50">{customer.name}</span>
                      {customer.customerType && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">{customer.customerType}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-gray-700/50">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-700 dark:text-gray-300">{customer.phone || '—'}</span>
                        <span className="text-slate-500 dark:text-gray-400 text-xs">{customer.email || '—'}</span>
                      </div>
                      
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-gray-700/50">
                      <div className="text-sm">
                        <span className="text-slate-400 dark:text-gray-500 text-xs font-medium">In:</span> <span className="text-slate-700 dark:text-gray-300">{customer.submissionDate}</span>
                        <br />
                        <span className="text-slate-400 dark:text-gray-500 text-xs font-medium">Due:</span> <span className="text-slate-700 dark:text-gray-300">{customer.expectedDate || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-gray-700/50">
                      {editingStatusId === customer.id ? (
                        <select
                          className="px-2 py-1 border border-slate-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={customer.status}
                          onChange={(e) => {
                            onUpdateStatus(customer.id, e.target.value);
                            setEditingStatusId(null);
                          }}
                          onBlur={() => setEditingStatusId(null)}
                          autoFocus
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          className="bg-transparent border-none cursor-pointer"
                          onClick={() => setEditingStatusId(customer.id)}
                          title="Click to change status"
                        >
                          <StatusBadge status={customer.status} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-gray-700/50">
                      <span className="text-slate-500 dark:text-gray-400 text-sm max-w-[150px] truncate block">{customer.notes || '—'}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-100 dark:border-gray-700/50">
                      <div className="flex gap-2">
                        <button
                          className="p-1.5 text-slate-600 dark:text-gray-300 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => handleEdit(customer)}
                          title="Edit Customer"
                        >
                          <IconEdit />
                        </button>
                        <button
                          className="p-1.5 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          onClick={() => handleDeleteRequest(customer.id)}
                          title="Delete Record"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(customer.id) && (
                    <tr className="bg-slate-50 dark:bg-gray-800/50">
                      <td colSpan="7">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 pb-2 border-b border-slate-200 dark:border-gray-700 flex items-center"><IconUser /> Customer Info</h4>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Customer Type</span>
                              {displayValue(customer.customerType)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Preferred Contact</span>
                              {displayValue(customer.preferredContact)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Alternate Phone</span>
                              {displayValue(customer.alternatePhone)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Address</span>
                              {displayValue(customer.address)}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 pb-2 border-b border-slate-200 dark:border-gray-700 flex items-center"><IconPhone /> Device Info</h4>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Device Type</span>
                              {displayValue(customer.deviceType)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Brand / Model</span>
                              {displayValue(customer.brand && customer.model ? `${customer.brand} ${customer.model}` : customer.brand || customer.model)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">IMEI / Serial</span>
                              {displayValue(customer.imei)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Carrier</span>
                              {displayValue(customer.carrier)}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 pb-2 border-b border-slate-200 dark:border-gray-700 flex items-center"><IconWrench /> Repair Details</h4>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Issue Category</span>
                              {displayValue(customer.issueCategory)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Repair Type</span>
                              {displayValue(customer.repairType)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Priority</span>
                              {displayValue(customer.priority)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Issue Description</span>
                              {displayValue(customer.issueDescription)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Technical Staff</span>
                              {displayValue(customer.technicalStaffName)}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 pb-2 border-b border-slate-200 dark:border-gray-700 flex items-center"><IconDollar /> Cost & Parts</h4>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Estimated Cost</span>
                              {formatCurrency(customer.estimatedCost)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Advance Paid</span>
                              {formatCurrency(customer.advancePaid)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Balance Due</span>
                              {customer.estimatedCost ? (
                                <span className="text-sm text-slate-700 dark:text-gray-300">
                                  ${(parseFloat(customer.estimatedCost || 0) - parseFloat(customer.advancePaid || 0)).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400 dark:text-gray-600 italic">N/A</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Parts Type</span>
                              {displayValue(customer.partsType)}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 pb-2 border-b border-slate-200 dark:border-gray-700 flex items-center"><IconCalendar /> Timeline</h4>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Submitted</span>
                              {displayValue(customer.submissionDate)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Device Received</span>
                              {displayValue(customer.deviceReceivedDate)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Repair Started</span>
                              {displayValue(customer.repairStartDate)}
                            </div>
                            <div className="flex flex-col gap-0.5 mb-2">
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">Expected Completion</span>
                              {displayValue(customer.expectedDate)}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCustomers.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <IconArrowLeft /> Prev
            </button>
            <span className="text-sm text-slate-600 dark:text-gray-400">
              Page {currentPage} of {Math.ceil(filteredCustomers.length / itemsPerPage)}
            </span>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={currentPage >= Math.ceil(filteredCustomers.length / itemsPerPage)}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next <IconArrowRight />
            </button>
          </div>
        )}
        </>
      )}
    </section>

      {showEditModal && modalCustomer && (
        <EditCustomerModal
          customer={modalCustomer}
          onSave={handleSaveEdit}
          onClose={handleCancelEdit}
          loading={updatingCustomer}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-gray-700 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-full">
                <IconAlert />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Record?</h3>
              <p className="text-slate-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete this record?
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-lg shadow-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    );
}