import React, { useState, useEffect } from 'react';
import type { User, UserRole } from '@cms/schemas';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export const UserManagement: React.FC = () => {
  const { user: currentUser, can } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get<User[]>('/api/users');
      setUsers(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const openModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setEmail(u.email);
      setName(u.name || '');
      setPassword('');
      setRole(u.role);
      setActive(u.active);
    } else {
      setEditingUser(null);
      setEmail('');
      setName('');
      setPassword('');
      setRole('editor');
      setActive(true);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      if (editingUser) {
        const payload: Record<string, unknown> = { email, name, role, active };
        if (password.trim()) payload.password = password;
        const updated = await api.put<User>(`/api/users/${editingUser.id}`, payload);
        setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        if (!password || password.length < 8) {
          alert('Password must be at least 8 characters long');
          return;
        }
        const created = await api.post<User>('/api/users', { email, name, password, role, active });
        setUsers([...users, created]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDelete = async (userToDelete: User) => {
    if (userToDelete.id === currentUser?.id) {
      alert('You cannot delete your own user account.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${userToDelete.email}"?`)) return;

    try {
      await api.delete(`/api/users/${userToDelete.id}`);
      setUsers(users.filter((u) => u.id !== userToDelete.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto font-body-md text-on-surface antialiased">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-xs text-label-xs uppercase tracking-widest text-primary font-bold">
              07 / Access & Security
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <h1 className="font-headline-lg text-headline-lg font-serif text-on-surface tracking-tight">
            User Management
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant pt-1">
            Manage team members, roles (Admin, Editor, Author), and authentication credentials.
          </p>
        </div>

        {can('users.create') && (
          <button
            type="button"
            onClick={() => openModal()}
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] self-start sm:self-center"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Create New User</span>
          </button>
        )}
      </div>

      {/* Users Table Card */}
      <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-xs text-label-xs uppercase tracking-wider border-b border-surface-container-high/40">
              <tr>
                <th className="px-6 py-3.5">User / Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/30 text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant font-body-sm">
                    <div className="flex flex-col items-center gap-2">
                      <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span>Loading team users...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                          {u.name?.[0] || u.email[0]}
                        </div>
                        <div>
                          <p className="font-title-sm text-title-sm font-semibold text-on-surface">{u.name || u.email}</p>
                          <p className="font-code text-code text-[11px] text-on-surface-variant">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-xs text-label-xs font-semibold uppercase ${
                          u.role === 'admin'
                            ? 'bg-surface-container-highest text-primary'
                            : u.role === 'editor'
                            ? 'bg-surface-container text-primary'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-xs text-label-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-xs text-label-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {can('users.update') && (
                          <button
                            type="button"
                            onClick={() => openModal(u)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                        {can('users.delete') && u.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-surface-container-high/40 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-3 mb-4">
              <h3 className="font-headline-sm text-headline-sm font-serif text-on-surface">
                {editingUser ? 'Edit User Account' : 'Create New User'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {editingUser ? 'New Password (leave blank to keep existing)' : 'Password (min 8 chars) *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-label-xs text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Assigned Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-surface-container-low border border-surface-container-high/40 rounded-xl px-3.5 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="admin">Admin (Full Access & Publishing)</option>
                  <option value="editor">Editor (Create, Edit & Publish Content)</option>
                  <option value="author">Author (Create & Edit Own Posts)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 font-label-sm text-label-sm font-semibold text-on-surface cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-surface-container-high focus:ring-primary"
                  />
                  <span>User Account Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-container-high/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-label-md text-label-md font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl shadow-sm transition-all"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
