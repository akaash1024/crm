import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { disconnectSocket } from '../services/socketService';
import './Layout.css';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h1 className="navbar-brand">CRM System</h1>
        </div>
        <div className="navbar-right">
          <span className="user-name">{user?.firstName} {user?.lastName}</span>
          <span className="user-role">({user?.role})</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="layout-body">
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <Link to="/dashboard" className="sidebar-link">
              <span>📊</span> Dashboard
            </Link>
            <Link to="/leads" className="sidebar-link">
              <span>👥</span> Leads
            </Link>
            <Link to="/activities" className="sidebar-link">
              <span>📝</span> Activities
            </Link>
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <Link to="/users" className="sidebar-link">
                <span>👤</span> Users
              </Link>
            )}
          </nav>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

