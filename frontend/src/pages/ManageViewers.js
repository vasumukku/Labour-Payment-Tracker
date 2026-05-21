import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdSupervisorAccount, MdAdd, MdEdit, MdDelete, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { api, useT } from '../context/AppContext';

const ManageViewers = () => {
  const t = useT();
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editViewer, setEditViewer] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', username:'', password:'' });
  const [errors, setErrors] = useState({});

  const fetchViewers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/viewers');
      if (data.success) setViewers(data.viewers);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchViewers(); }, []);

  const openAdd = () => { setForm({ name:'', username:'', password:'' }); setEditViewer(null); setErrors({}); setShowForm(true); };
  const openEdit = (v) => { setForm({ name:v.name, username:v.username, password:'' }); setEditViewer(v); setErrors({}); setShowForm(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!editViewer && !form.username.trim()) e.username = 'Username required';
    if (!editViewer && form.password.length < 4) e.password = 'Min 4 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editViewer) {
        const payload = { name: form.name };
        if (form.password) payload.password = form.password;
        await api.put(`/auth/viewers/${editViewer._id}`, payload);
        toast.success('Viewer updated!');
      } else {
        await api.post('/auth/viewers', form);
        toast.success('Admin Viewer added!');
      }
      setShowForm(false);
      fetchViewers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleToggle = async (v) => {
    try {
      await api.put(`/auth/viewers/${v._id}`, { isActive: !v.isActive });
      toast.success(v.isActive ? 'Deactivated' : 'Activated');
      fetchViewers();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/auth/viewers/${deleteId}`);
      toast.success('Viewer deleted');
      setDeleteId(null);
      fetchViewers();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MdSupervisorAccount className="text-blue-500" />
            Admin Viewers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">People who can see all data but cannot edit</p>
        </div>
        <button onClick={openAdd} className="btn-primary py-2.5 px-4 text-sm"><MdAdd /> Add Viewer</button>
      </div>

      {/* Info */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-2">👁 Admin Viewer Access:</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-blue-600 dark:text-blue-400">
          <span>✅ See full admin dashboard</span>
          <span>✅ See all leaders & amounts</span>
          <span>✅ See all payments history</span>
          <span>✅ See monthly charts</span>
          <span>✅ Download Excel reports</span>
          <span>❌ Cannot add payments</span>
          <span>❌ Cannot edit or delete</span>
          <span>❌ Cannot manage leaders</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="spinner w-8 h-8 border-4" /></div>
        ) : viewers.length === 0 ? (
          <div className="text-center py-12">
            <MdSupervisorAccount className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No admin viewers yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your father or other family members</p>
            <button onClick={openAdd} className="btn-primary mt-4 py-2.5 px-5 text-sm mx-auto"><MdAdd /> Add Viewer</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {viewers.map(v => (
              <div key={v._id} className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {v.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 dark:text-white">{v.name}</p>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      👁 Admin Viewer
                    </span>
                    {!v.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">inactive</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">@{v.username}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggle(v)}
                    className={`p-2 rounded-lg text-lg transition-all ${v.isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    {v.isActive ? <MdVisibility /> : <MdVisibilityOff />}
                  </button>
                  <button onClick={() => openEdit(v)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-lg"><MdEdit /></button>
                  <button onClick={() => setDeleteId(v._id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-lg"><MdDelete /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
              <MdSupervisorAccount className="text-blue-500" />
              {editViewer ? 'Edit Admin Viewer' : 'Add Admin Viewer'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input className={`input ${errors.name ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                  placeholder="e.g. Father, Nanna, నాన్న..."
                  value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
              </div>
              {!editViewer && (
                <div>
                  <label className="label">Username * (for login)</label>
                  <input className={`input ${errors.username ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                    placeholder="e.g. father, nanna, appa"
                    value={form.username} onChange={e => setForm({...form, username:e.target.value.toLowerCase().replace(/\s/g,'')})} />
                  {errors.username && <p className="text-rose-500 text-xs mt-1">{errors.username}</p>}
                </div>
              )}
              <div>
                <label className="label">{editViewer ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'}
                    className={`input pr-12 ${errors.password ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                    placeholder="Min 4 characters"
                    value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl">
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400">
                👁 This person will see <strong>everything</strong> — all leaders, all payments, full dashboard — but cannot edit anything.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-[2]">
                  {saving ? <><span className="spinner scale-75" />Saving...</> : editViewer ? 'Update' : 'Add Viewer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm shadow-2xl">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MdDelete className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Delete Viewer?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">They will no longer be able to login.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger"><MdDelete />Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageViewers;
