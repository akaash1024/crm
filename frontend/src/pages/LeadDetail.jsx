import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchLeadById,
  updateLead,
  deleteLead,
  assignLead,
  updateLeadStatus
} from '../store/slices/leadSlice';
import { fetchActivitiesByLead, createActivity } from '../store/slices/activitySlice';
import { fetchUsers } from '../store/slices/userSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { joinLeadRoom, leaveLeadRoom } from '../services/socketService';
import './LeadDetail.css';

const LeadDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentLead, isLoading } = useSelector((state) => state.leads);
  const { leadActivities, isLoading: activitiesLoading } = useSelector((state) => state.activities);
  const { users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activityForm, setActivityForm] = useState({
    type: 'Note',
    title: '',
    description: ''
  });
  const [showActivityForm, setShowActivityForm] = useState(false);

  useEffect(() => {
    dispatch(fetchLeadById(id));
    dispatch(fetchActivitiesByLead(id));
    dispatch(fetchUsers({ limit: 100 }));
    joinLeadRoom(id);

    return () => {
      leaveLeadRoom(id);
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (currentLead) {
      setFormData({
        firstName: currentLead.firstName,
        lastName: currentLead.lastName,
        email: currentLead.email,
        phone: currentLead.phone || '',
        company: currentLead.company || '',
        title: currentLead.title || '',
        status: currentLead.status,
        source: currentLead.source || '',
        estimatedValue: currentLead.estimatedValue || 0,
        notes: currentLead.notes || '',
        assignedToId: currentLead.assignedToId || ''
      });
    }
  }, [currentLead]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleActivityChange = (e) => {
    setActivityForm({
      ...activityForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      await dispatch(updateLead({ id, data: formData })).unwrap();
      toast.success('Lead updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error || 'Failed to update lead');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await dispatch(deleteLead(id)).unwrap();
        toast.success('Lead deleted successfully');
        navigate('/leads');
      } catch (error) {
        toast.error(error || 'Failed to delete lead');
      }
    }
  };

  const handleAssign = async (assignedToId) => {
    try {
      await dispatch(assignLead({ id, assignedToId })).unwrap();
      toast.success('Lead assigned successfully');
    } catch (error) {
      toast.error(error || 'Failed to assign lead');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await dispatch(updateLeadStatus({ id, status })).unwrap();
      toast.success('Lead status updated successfully');
    } catch (error) {
      toast.error(error || 'Failed to update lead status');
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createActivity({
          ...activityForm,
          leadId: id
        })
      ).unwrap();
      toast.success('Activity created successfully');
      setActivityForm({
        type: 'Note',
        title: '',
        description: ''
      });
      setShowActivityForm(false);
    } catch (error) {
      toast.error(error || 'Failed to create activity');
    }
  };

  if (isLoading && !currentLead) {
    return <LoadingSpinner />;
  }

  if (!currentLead) {
    return <div className="lead-detail">Lead not found</div>;
  }

  return (
    <div className="lead-detail">
      <div className="lead-header">
        <button className="btn-back" onClick={() => navigate('/leads')}>
          ← Back to Leads
        </button>
        <div className="lead-actions">
          {!isEditing ? (
            <>
              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              {(user?.role === 'Admin' || user?.role === 'Manager' || currentLead.createdById === user?.id) && (
                <button className="btn-delete" onClick={handleDelete}>
                  Delete
                </button>
              )}
            </>
          ) : (
            <>
              <button className="btn-save" onClick={handleSave}>
                Save
              </button>
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="lead-content">
        <div className="lead-info">
          <h2 className="lead-name">
            {currentLead.firstName} {currentLead.lastName}
          </h2>
          <div className="lead-details">
            <div className="detail-item">
              <label>Email:</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <span>{currentLead.email}</span>
              )}
            </div>
            <div className="detail-item">
              <label>Phone:</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <span>{currentLead.phone || '-'}</span>
              )}
            </div>
            <div className="detail-item">
              <label>Company:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <span>{currentLead.company || '-'}</span>
              )}
            </div>
            <div className="detail-item">
              <label>Status:</label>
              {isEditing ? (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              ) : (
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusColor(currentLead.status),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '5px',
                    fontSize: '0.9rem'
                  }}
                >
                  {currentLead.status}
                </span>
              )}
            </div>
            <div className="detail-item">
              <label>Assigned To:</label>
              {isEditing && (user?.role === 'Admin' || user?.role === 'Manager') ? (
                <select
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              ) : (
                <span>
                  {currentLead.assignedTo
                    ? `${currentLead.assignedTo.firstName} ${currentLead.assignedTo.lastName}`
                    : 'Unassigned'}
                </span>
              )}
            </div>
            <div className="detail-item">
              <label>Estimated Value:</label>
              {isEditing ? (
                <input
                  type="number"
                  name="estimatedValue"
                  value={formData.estimatedValue}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <span>${currentLead.estimatedValue || 0}</span>
              )}
            </div>
          </div>
          <div className="lead-notes">
            <label>Notes:</label>
            {isEditing ? (
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea"
                rows="5"
              />
            ) : (
              <p>{currentLead.notes || 'No notes'}</p>
            )}
          </div>
        </div>

        <div className="lead-activities">
          <div className="activities-header">
            <h3>Activities</h3>
            <button
              className="btn-add-activity"
              onClick={() => setShowActivityForm(!showActivityForm)}
            >
              + Add Activity
            </button>
          </div>

          {showActivityForm && (
            <form onSubmit={handleCreateActivity} className="activity-form">
              <select
                name="type"
                value={activityForm.type}
                onChange={handleActivityChange}
                className="form-select"
              >
                <option value="Note">Note</option>
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="Status Change">Status Change</option>
              </select>
              <input
                type="text"
                name="title"
                value={activityForm.title}
                onChange={handleActivityChange}
                placeholder="Activity title"
                className="form-input"
                required
              />
              <textarea
                name="description"
                value={activityForm.description}
                onChange={handleActivityChange}
                placeholder="Activity description"
                className="form-textarea"
                rows="3"
              />
              <button type="submit" className="btn-save">
                Create Activity
              </button>
            </form>
          )}

          <div className="activities-list">
            {activitiesLoading ? (
              <p>Loading activities...</p>
            ) : leadActivities.length > 0 ? (
              leadActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'Note' && '📝'}
                    {activity.type === 'Call' && '📞'}
                    {activity.type === 'Meeting' && '🤝'}
                    {activity.type === 'Email' && '📧'}
                    {activity.type === 'Status Change' && '🔄'}
                  </div>
                  <div className="activity-content">
                    <h4 className="activity-title">{activity.title}</h4>
                    <p className="activity-description">{activity.description}</p>
                    <p className="activity-meta">
                      {activity.user?.firstName} {activity.user?.lastName} •{' '}
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No activities yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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

export default LeadDetail;

