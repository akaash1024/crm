import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDashboardStats,
  fetchLeadsByStatus,
  fetchLeadsBySource,
  fetchRecentActivities,
  fetchSalesPipeline
} from '../store/slices/dashboardSlice';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, leadsByStatus, leadsBySource, recentActivities, salesPipeline, isLoading } = useSelector(
    (state) => state.dashboard
  );
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchLeadsByStatus());
    dispatch(fetchLeadsBySource());
    dispatch(fetchRecentActivities(10));
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      dispatch(fetchSalesPipeline());
    }
  }, [dispatch, user]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (isLoading && !stats) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 className="stat-label">Total Leads</h3>
            <p className="stat-value">{stats?.totalLeads || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🆕</div>
          <div className="stat-content">
            <h3 className="stat-label">New Leads</h3>
            <p className="stat-value">{stats?.newLeads || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 className="stat-label">Qualified Leads</h3>
            <p className="stat-value">{stats?.qualifiedLeads || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3 className="stat-label">Won Leads</h3>
            <p className="stat-value">{stats?.wonLeads || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3 className="stat-label">Total Value</h3>
            <p className="stat-value">${stats?.totalValue?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3 className="stat-label">Conversion Rate</h3>
            <p className="stat-value">{stats?.conversionRate || 0}%</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Leads by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {leadsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {leadsBySource.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">Leads by Source</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadsBySource}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {salesPipeline.length > 0 && (
          <div className="chart-card">
            <h3 className="chart-title">Sales Pipeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesPipeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
                <Bar dataKey="totalValue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="recent-activities">
        <h3 className="section-title">Recent Activities</h3>
        <div className="activities-list">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
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
                    {activity.user?.firstName} {activity.user?.lastName} • {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

