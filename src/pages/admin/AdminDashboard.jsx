import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { wirelessDb } from '../../config/firebaseWireless';
import Papa from 'papaparse';
import EditRequestModal from '../../components/admin/EditRequestModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [deletingRequest, setDeletingRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching demo requests from wirelessDb...');
      const q = query(collection(wirelessDb, 'demoRequests'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot size:', querySnapshot.size);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      console.log('Fetched requests:', requestsData);
      setRequests(requestsData);
    } catch (err) {
      console.error('Error fetching requests:', err);
      console.error('Error details:', err.message, err.code);
      setError('Failed to load demo requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('wirelessAdminAuth');
    sessionStorage.removeItem('wirelessAdminEmail');
    navigate('/admin/login');
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
  };

  const handleDelete = (request) => {
    setDeletingRequest(request);
  };

  const handleUpdateRequest = async (id, updatedData) => {
    try {
      const requestRef = doc(wirelessDb, 'demoRequests', id);
      await updateDoc(requestRef, {
        ...updatedData,
        updatedAt: new Date()
      });
      await fetchRequests();
      setEditingRequest(null);
    } catch (err) {
      alert('Failed to update request. Please try again.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRequest) return;
    
    try {
      await deleteDoc(doc(wirelessDb, 'demoRequests', deletingRequest.id));
      await fetchRequests();
      setDeletingRequest(null);
    } catch (err) {
      alert('Failed to delete request. Please try again.');
    }
  };

  const handleExportCSV = () => {
    const csvData = requests.map(req => ({
      'First Name': req.firstName || '',
      'Last Name': req.lastName || '',
      'Email': req.email || '',
      'Phone': req.phone || '',
      'Company': req.company || '',
      'Store Count': req.storeCount || '',
      'Location': req.location || '',
      'Monthly Revenue': req.monthlyRevenue || '',
      'Google Profile': req.googleProfileLink || '',
      'POS System': req.posSystem || '',
      'Current System': req.currentSystem || '',
      'Timeframe': req.timeframe || '',
      'Top Problems': req.topProblems || '',
      'Message': req.message || '',
      'Status': req.status || '',
      'Source': req.source || '',
      'Created At': req.createdAt ? new Date(req.createdAt).toLocaleString() : ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `demo-requests-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Demo Requests</h1>
                <p className="text-sm text-gray-600">Manage WirelessPOS demo submissions</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              disabled={requests.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-6 text-sm">
            <div>
              <span className="text-gray-600">Total Requests:</span>
              <span className="ml-2 font-semibold text-gray-900">{requests.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Filtered:</span>
              <span className="ml-2 font-semibold text-gray-900">{filteredRequests.length}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-gray-600 font-medium">Loading requests...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-12 text-center">
            <div className="text-red-600 font-semibold mb-2">{error}</div>
            <button
              onClick={fetchRequests}
              className="text-blue-600 hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 font-medium">No demo requests found</p>
            <p className="text-sm text-gray-500 mt-1">Requests will appear here when users submit the demo form</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {request.firstName} {request.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{request.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{request.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{request.company}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{request.location || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          request.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status || 'new'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(request)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(request)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editingRequest && (
        <EditRequestModal
          request={editingRequest}
          onClose={() => setEditingRequest(null)}
          onSave={handleUpdateRequest}
        />
      )}

      {deletingRequest && (
        <DeleteConfirmModal
          request={deletingRequest}
          onClose={() => setDeletingRequest(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
