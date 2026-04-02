'use client';
import { useState, useEffect } from 'react';
import { Room } from '@/types';

interface RoomFormData {
  name: string;
  description: string;
  capacity: string;
  icon: string;
}

const emptyForm: RoomFormData = { name: '', description: '', capacity: '', icon: '🏢' };

export function AdminRoomsPanel() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ room: Room; count: number } | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    const res = await fetch('/api/rooms');
    if (res.ok) setRooms(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, []);

  const openAdd = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({ name: room.name, description: room.description, capacity: room.capacity, icon: room.icon });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save room'); return; }
      setShowForm(false);
      fetchRooms();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room: Room, force = false) => {
    const res = await fetch(`/api/rooms/${room.id}${force ? '?force=true' : ''}`, { method: 'DELETE' });
    if (res.status === 409) {
      const data = await res.json();
      setDeleteConfirm({ room, count: data.count });
      return;
    }
    if (res.ok) { setDeleteConfirm(null); fetchRooms(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Meeting Rooms</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Room
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No rooms yet. Add one above.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4">
              <span className="text-3xl flex-shrink-0">{room.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{room.name}</div>
                <div className="text-sm text-gray-500 truncate">{room.description}</div>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full flex-shrink-0">{room.capacity}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(room)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(room)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">{editingRoom ? 'Edit Room' : 'Add Room'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon (emoji)</label>
                <input type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity</label>
                <input type="text" placeholder="e.g. 8 people" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editingRoom ? 'Save Changes' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation for rooms with future bookings */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-3">Delete Room?</h3>
            <p className="text-sm text-gray-600 mb-5">
              <strong>{deleteConfirm.room.name}</strong> has <strong>{deleteConfirm.count}</strong> upcoming booking(s).
              The room will be removed but existing bookings will remain in history.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm.room, true)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">
                Delete Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
