'use client';
import { useState, useEffect } from 'react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

interface ResetPWForm {
  password: string;
  mustChangePassword: boolean;
}

const emptyForm: UserFormData = { name: '', email: '', role: 'USER', mustChangePassword: true };

function PasswordStrength({ password }: { password: string }) {
  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (!password) return null;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? colors[score] : 'bg-gray-200'} transition-colors`} />
        ))}
      </div>
      <p className={`text-xs mt-1 ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-yellow-600' : score === 3 ? 'text-blue-600' : 'text-green-600'}`}>
        {labels[score]}
      </p>
    </div>
  );
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<UserFormData & { password: string }>({ ...emptyForm, password: '' });
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState<UserFormData>(emptyForm);
  const [resetPWUser, setResetPWUser] = useState<UserRow | null>(null);
  const [resetPWForm, setResetPWForm] = useState<ResetPWForm>({ password: '', mustChangePassword: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ user: UserRow; count: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserRow | null>(null);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Add User
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to create user'); return; }
      setShowAddForm(false);
      setAddForm({ ...emptyForm, password: '' });
      fetchUsers();
    } finally { setSaving(false); }
  };

  // Edit User
  const openEdit = (user: UserRow) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword });
    setError('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to update user'); return; }
      setEditingUser(null);
      fetchUsers();
    } finally { setSaving(false); }
  };

  // Reset Password
  const openResetPW = (user: UserRow) => {
    setResetPWUser(user);
    setResetPWForm({ password: '', mustChangePassword: true });
    setError('');
  };

  const handleResetPW = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPWUser) return;
    if (resetPWForm.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${resetPWUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetPWForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to reset password'); return; }
      setResetPWUser(null);
      fetchUsers();
    } finally { setSaving(false); }
  };

  // Delete
  const handleDelete = async (user: UserRow, force = false) => {
    const res = await fetch(`/api/admin/users/${user.id}${force ? '?force=true' : ''}`, { method: 'DELETE' });
    if (res.status === 409) {
      const data = await res.json();
      setDeleteConfirm({ user, count: data.count });
      return;
    }
    if (res.status === 400) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    if (res.ok) { setDeleteConfirm(null); fetchUsers(); }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-900">Users</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-52"
          />
          <button
            onClick={() => { setShowAddForm(true); setAddForm({ ...emptyForm, password: '' }); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{search ? 'No users match your search.' : 'No users yet.'}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">PW Change</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr key={user.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-5 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-5 py-3 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      user.role === 'ADMIN' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${user.mustChangePassword ? 'text-amber-600' : 'text-green-600'}`}>
                      {user.mustChangePassword ? 'Required' : 'Done'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(user)}
                        className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Edit
                      </button>
                      <button onClick={() => openResetPW(user)}
                        className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap">
                        🔑 Reset PW
                      </button>
                      <button onClick={() => setPendingDelete(user)}
                        className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Add User</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} required className={inputClass} />
                <PasswordStrength password={addForm.password} />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className={inputClass}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addForm.mustChangePassword} onChange={e => setAddForm(f => ({ ...f, mustChangePassword: e.target.checked }))}
                  className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-gray-700">Force password change on first login</span>
              </label>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50">{saving ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Edit User</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className={inputClass}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.mustChangePassword} onChange={e => setEditForm(f => ({ ...f, mustChangePassword: e.target.checked }))}
                  className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-gray-700">Require password change on next login</span>
              </label>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPWUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-5">Setting new password for <strong>{resetPWUser.name}</strong></p>
            <form onSubmit={handleResetPW} className="space-y-4">
              <div>
                <label className={labelClass}>New Password *</label>
                <input type="password" value={resetPWForm.password} onChange={e => setResetPWForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min. 6 characters" className={inputClass} />
                <PasswordStrength password={resetPWForm.password} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resetPWForm.mustChangePassword} onChange={e => setResetPWForm(f => ({ ...f, mustChangePassword: e.target.checked }))}
                  className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-gray-700">Force user to change password on next login</span>
              </label>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setResetPWUser(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">{saving ? 'Resetting...' : 'Reset Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Are you sure? — initial delete prompt */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-3">Delete User?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete <strong>{pendingDelete.name}</strong> ({pendingDelete.email})?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPendingDelete(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => { const u = pendingDelete; setPendingDelete(null); handleDelete(u); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-3">Delete User?</h3>
            <p className="text-sm text-gray-600 mb-5">
              <strong>{deleteConfirm.user.name}</strong> has <strong>{deleteConfirm.count}</strong> upcoming booking(s).
              Deleting this user will also remove their bookings.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.user, true)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Delete Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
