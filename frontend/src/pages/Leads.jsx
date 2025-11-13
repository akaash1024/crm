import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchLeads, createLead, deleteLead, updateLeadStatus } from '../store/slices/leadSlice';
import { fetchUsers } from '../store/slices/userSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import './Leads.css';

const Leads = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { leads, pagination, isLoading } = useSelector((state) => state.leads);
  const { users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'New',
    source: '',
    estimatedValue: 0,
    notes: '',
    assignedToId: user?.id || ''
  });

  useEffect(() => {
    dispatch(fetchLeads(filters));
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      dispatch(fetchUsers({ limit: 100 }));
    }
  }, [dispatch, filters, user]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleStatusFilter = (e) => {
    setFilters({ ...filters, status: e.target.value, page: 1 });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await dispatch(deleteLead(id)).unwrap();
        toast.success('Lead deleted successfully');
      } catch (error) {
        toast.error(error || 'Failed to delete lead');
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await dispatch(updateLeadStatus({ id, status })).unwrap();
      toast.success('Lead status updated successfully');
    } catch (error) {
      toast.error(error || 'Failed to update lead status');
    }
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createLead(formData)).unwrap();
      toast.success('Lead created successfully');
      setShowCreateModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        title: '',
        status: 'New',
        source: '',
        estimatedValue: 0,
        notes: '',
        assignedToId: user?.id || ''
      });
      dispatch(fetchLeads(filters));
    } catch (error) {
      toast.error(error || 'Failed to create lead');
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      New: '#3498db',
      Contacted: '#f39c12',
      Qualified: '#9b59b6',
      Proposal: '#1abc9c',
      Negotiation: '#e67e22',
      Won: '#27ae60',
      Lost: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  if (isLoading && !leads.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="leads-page">
      <div className="leads-header">
        <h1 className="page-title">Leads</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Lead
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Lead</h2>
            <form onSubmit={handleCreateLead}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estimated Value</label>
                  <input
                    type="number"
                    name="estimatedValue"
                    value={formData.estimatedValue}
                    onChange={handleFormChange}
                    min="0"
                  />
                </div>
              </div>
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <div className="form-group">
                  <label>Assign To</label>
                  <select
                    name="assignedToId"
                    value={formData.assignedToId}
                    onChange={handleFormChange}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Create Lead
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filters">
        <input
          type="text"
          placeholder="Search leads..."
          value={filters.search}
          onChange={handleSearch}
          className="search-input"
        />
        <select
          value={filters.status}
          onChange={handleStatusFilter}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Proposal">Proposal</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Won">Won</option>
          <option value="Lost">Lost</option>
        </select>
      </div>

      <div className="leads-table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Estimated Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <span
                      className="lead-name"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      style={{ cursor: 'pointer', color: '#3498db' }}
                    >
                      {lead.firstName} {lead.lastName}
                    </span>
                  </td>
                  <td>{lead.email}</td>
                  <td>{lead.company || '-'}</td>
                  <td>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="status-select"
                      style={{ borderColor: getStatusColor(lead.status) }}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </td>
                  <td>
                    {lead.assignedTo
                      ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                      : 'Unassigned'}
                  </td>
                  <td>${lead.estimatedValue || 0}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/leads/${lead.id}`)}
                      >
                        View
                      </button>
                      {(user?.role === 'Admin' || user?.role === 'Manager' || lead.createdById === user?.id) && (
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(lead.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Leads;

