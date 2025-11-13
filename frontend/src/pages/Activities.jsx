import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActivities } from '../store/slices/activitySlice';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import './Activities.css';

const Activities = () => {
  const dispatch = useDispatch();
  const { activities, pagination, isLoading } = useSelector((state) => state.activities);
  const [filters, setFilters] = useState({
    type: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    dispatch(fetchActivities(filters));
  }, [dispatch, filters]);

  const handleTypeFilter = (e) => {
    setFilters({ ...filters, type: e.target.value, page: 1 });
  };

  const getActivityIcon = (type) => {
    const icons = {
      Note: '📝',
      Call: '📞',
      Meeting: '🤝',
      Email: '📧',
      'Status Change': '🔄'
    };
    return icons[type] || '📋';
  };

  if (isLoading && !activities.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="activities-page">
      <h1 className="page-title">Activities</h1>

      <div className="filters">
        <select
          value={filters.type}
          onChange={handleTypeFilter}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="Note">Note</option>
          <option value="Call">Call</option>
          <option value="Meeting">Meeting</option>
          <option value="Email">Email</option>
          <option value="Status Change">Status Change</option>
        </select>
      </div>

      <div className="activities-list">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="activity-card">
              <div className="activity-icon-large">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <h3 className="activity-title">{activity.title}</h3>
                <p className="activity-type">{activity.type}</p>
                {activity.description && (
                  <p className="activity-description">{activity.description}</p>
                )}
                <div className="activity-meta">
                  <span className="activity-lead">
                    Lead: {activity.lead?.firstName} {activity.lead?.lastName}
                  </span>
                  <span className="activity-user">
                    By: {activity.user?.firstName} {activity.user?.lastName}
                  </span>
                  <span className="activity-date">
                    {format(new Date(activity.createdAt), 'PPpp')}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No activities found</p>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Activities;

