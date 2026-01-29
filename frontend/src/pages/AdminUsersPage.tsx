import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

type UserRow = {
  id: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  tenantId: string;
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRow['role']>('viewer');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/users');
      setUsers(res.data.users);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/admin/users', {
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setNewEmail('');
      setNewPassword('');
      setNewRole('viewer');
      await fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Create user failed');
    }
  };

  const handleRoleChange = async (id: string, role: UserRow['role']) => {
    setError(null);
    try {
      await apiClient.patch(`/admin/users/${id}`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Update role failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    setError(null);
    try {
      await apiClient.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete user failed');
    }
  };

  const cardStyle = {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  };

  return (
    <div className="container" style={{ maxWidth: 1400, padding: '2rem 1rem' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #333',
        }}
      >
        <div>
          <Link
            to="/"
            style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: '0.9rem',
              marginBottom: '0.5rem',
              display: 'inline-block',
            }}
          >
            ← Back to dashboard
          </Link>
          <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem' }}>Admin: Users</h1>
        </div>
      </header>

      {/* Create User Section */}
      <section style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.5rem' }}>
          Create User
        </h2>
        <form
          onSubmit={handleCreate}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#242424',
                color: 'white',
                fontSize: '1rem',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#242424',
                color: 'white',
                fontSize: '1rem',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 500 }}>Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRow['role'])}
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#242424',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '1rem',
                background: '#7f1d1d',
                borderRadius: '6px',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            style={{
              gridColumn: '1 / -1',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              marginTop: '0.5rem',
            }}
          >
            Create User
          </button>
        </form>
      </section>

      {/* Users Table Section */}
      <section style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Users</h2>
          {users.length > 0 && (
            <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
              {users.length} user{users.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
            Loading users...
          </div>
        )}
        {error && !loading && (
          <div
            style={{
              padding: '1rem',
              background: '#7f1d1d',
              borderRadius: '6px',
              color: '#fca5a5',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}
        {!loading && users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>No users found.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Create your first user using the form above.
            </p>
          </div>
        )}
        {users.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '1rem',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Role
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Tenant
                  </th>
                  <th
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      background: '#2d2d2d',
                      borderBottom: '2px solid #444',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid #333',
                      background: idx % 2 === 0 ? 'transparent' : '#1f1f1f',
                    }}
                  >
                    <td
                      style={{
                        padding: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {u.email}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as UserRow['role'])
                        }
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #444',
                          background: '#242424',
                          color: 'white',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td
                      style={{
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        opacity: 0.9,
                      }}
                    >
                      {u.tenantId}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminUsersPage;

