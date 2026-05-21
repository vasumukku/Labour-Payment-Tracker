import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdPeople, MdAdd, MdEdit, MdDelete, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { api, useT } from '../context/AppContext';

const Leaders = () => {
  const t = useT();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editLeader, setEditLeader] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', nameInTelugu:'', username:'', password:'' });
  const [errors, setErrors] = useState({});

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/leaders');
      if (data.success) setLeaders(data.leaders);
    } catch { toast.error('Failed to load leaders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaders(); }, []);

  const openAdd = () => { setForm({ name:'', nameInTelugu:'', username:'', password:'' }); setEditLeader(null); setErrors({}); setShowForm(true); };
  const openEdit = (l) => { setForm({ name:l.name, nameInTelugu:l.nameInTelugu||'', username:l.username, password:'' }); setEditLeader(l); setErrors({}); setShowForm(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!editLeader && !form.username.trim()) e.username = 'Username required';
    if (!editLeader && form.password.length < 4) e.password = 'Min 4 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editLeader) {
        const payload = { name: form.name, nameInTelugu: form.nameInTelugu };
        if (form.password) payload.password = form.password;
        await api.put(`/auth/leaders/${editLeader._id}`, payload);
        toast.success(t.leaderUpdated);
      } else {
        await api.post('/auth/leaders', form);
        toast.success(t.leaderAdded);
      }
      setShowForm(false);
      fetchLeaders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleToggle = async (l) => {
    try {
      await api.put(`/auth/leaders/${l._id}`, { isActive: !l.isActive });
      toast.success(l.isActive ? 'Leader deactivated' : 'Leader activated');
      fetchLeaders();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/auth/leaders/${deleteId}`);
      toast.success(t.leaderDeleted);
      setDeleteId(null);
      fetchLeaders();
    } catch { toast.error('Failed to delete'); }
  };

  const COLORS = ['bg-orange-500','bg-blue-500','bg-emerald-500','bg-purple-500','bg-rose-500','bg-amber-500','bg-teal-500','bg-indigo-500'];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><MdPeople className="text-orange-500" />{t.leaders}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage team leaders and their login access</p>
        </div>
        <button onClick={openAdd} className="btn-primary py-2.5 px-4 text-sm"><MdAdd /> {t.addLeader}</button>
      </div>

      <div className="card p-4 bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
        <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">👥 Leader Access:</p>
        <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-orange-600 dark:text-orange-400">
          <span>✅ View their own payments</span>
          <span>✅ View their total amount taken</span>
          <span>✅ Download their Excel report</span>
          <span>❌ Cannot see other leaders data</span>
          <span>❌ Cannot add or edit payments</span>
          <span>❌ Cannot delete anything</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="spinner w-8 h-8 border-4" /></div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-12">
            <MdPeople className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t.noLeaders}</p>
            <button onClick={openAdd} className="btn-primary mt-4 py-2.5 px-5 text-sm mx-auto"><MdAdd /> {t.addLeader}</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {leaders.map((l, idx) => (
              <div key={l._id} className="flex items-center gap-4 p-4">
                <div className={`w-12 h-12 ${COLORS[idx % COLORS.length]} rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                  {l.name.substring(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 dark:text-white">{l.name}</p>
                    {l.nameInTelugu && <span className="text-sm text-gray-500 dark:text-gray-400 font-te">({l.nameInTelugu})</span>}
                    {!l.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">inactive</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">@{l.username}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggle(l)} title={l.isActive ? 'Deactivate' : 'Activate'}
                    className={`p-2 rounded-lg text-lg transition-all ${l.isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    {l.isActive ? <MdVisibility /> : <MdVisibilityOff />}
                  </button>
                  <button onClick={() => openEdit(l)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-lg"><MdEdit /></button>
                  <button onClick={() => setDeleteId(l._id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-lg"><MdDelete /></button>
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
            <h2 className="text-lg font-bold mb-5">{editLeader ? t.editLeader : t.addLeader}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Full Name (English) *</label>
                <input className={`input ${errors.name ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                  placeholder="e.g. Vasu, Vamsi, Sai..."
                  value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="label">{t.teluguName}</label>
                <input className="input font-te"
                  placeholder="e.g. వాసు, వంశీ, సాయి..."
                  value={form.nameInTelugu} onChange={e => setForm({...form, nameInTelugu:e.target.value})} />
                <p className="text-xs text-gray-400 mt-1">When Telugu mode is on, this name will be shown</p>
              </div>
              {!editLeader && (
                <div>
                  <label className="label">Username * (for login)</label>
                  <input className={`input ${errors.username ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                    placeholder="e.g. vasu, vamsi, sai123"
                    value={form.username} onChange={e => setForm({...form, username:e.target.value.toLowerCase().replace(/\s/g,'')})} />
                  {errors.username && <p className="text-rose-500 text-xs mt-1">{errors.username}</p>}
                </div>
              )}
              <div>
                <label className="label">{editLeader ? 'New Password (leave blank to keep)' : 'Password *'}</label>
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
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">{t.cancel}</button>
                <button type="submit" disabled={saving} className="btn-primary flex-[2]">
                  {saving ? <><span className="spinner scale-75" />{t.saving}</> : editLeader ? t.editLeader : t.addLeader}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm shadow-2xl">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MdDelete className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">{t.deleteLeader}?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Leader cannot login after deletion.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">{t.no}</button>
              <button onClick={handleDelete} className="btn-danger"><MdDelete />{t.yes}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaders;
