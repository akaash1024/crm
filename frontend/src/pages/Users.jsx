import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, deleteUser } from '../store/slices/userSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import './Users.css';

const Users = () => {
  const dispatch = useDispatch();
  const { users, pagination, isLoading } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchUsers({ limit: 100 }));
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await dispatch(deleteUser(id)).unwrap();
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error(error || 'Failed to delete user');
      }
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      Admin: '#e74c3c',
      Manager: '#f39c12',
      'Sales Executive': '#3498db'
    };
    return colors[role] || '#95a5a6';
  };

  if (isLoading && !users.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="users-page">
      <h1 className="page-title">Users</h1>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className="role-badge"
                      style={{
                        backgroundColor: getRoleColor(user.role),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '5px',
                        fontSize: '0.9rem'
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString()
                      : 'Never'}
                  </td>
                  <td>
                    {currentUser?.role === 'Admin' && currentUser?.id !== user.id && (
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;

