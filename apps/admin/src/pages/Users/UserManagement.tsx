import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Edit, Check, X, Shield, Lock, Mail } from 'lucide-react';
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage team members, roles (Admin, Editor, Author), and access credentials</p>
        </div>

        {can('users.create') && (
          <button
            type="button"
            onClick={() => openModal()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">User / Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400 uppercase">
                        {u.name?.[0] || u.email[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{u.name || u.email}</p>
                        <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase ${
                      u.role === 'admin'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : u.role === 'editor'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {u.active ? (
                      <span className="inline-flex items-center text-xs text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5"></span>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {can('users.update') && (
                        <button
                          type="button"
                          onClick={() => openModal(u)}
                          className="p-1.5 text-slate-400 hover:text-white rounded transition"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {can('users.delete') && u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-base">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  {editingUser ? 'New Password (leave blank to keep existing)' : 'Password (min 8 chars) *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Assigned Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="admin">Admin (Full Access & Publishing)</option>
                  <option value="editor">Editor (Create, Edit & Publish Content)</option>
                  <option value="author">Author (Create & Edit Own Posts)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-brand-500"
                  />
                  <span>User Account Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold rounded-lg text-xs"
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
