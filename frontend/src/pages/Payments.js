import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdSearch, MdFilterList, MdEdit, MdDelete, MdDownload, MdClose, MdPayments } from 'react-icons/md';
import { api, useApp, useT } from '../context/AppContext';
import { getDisplayName } from '../i18n/translations';

const PAYMENT_ICONS = { phonepe:'📱', googlepay:'💳', cash:'💵', bank_transfer:'🏦', other:'💰' };
const PAYMENT_LABELS = { phonepe:'PhonePe', googlepay:'GPay', cash:'Cash', bank_transfer:'Bank', other:'Other' };
const TIME_BADGES = {
  morning: { label:'Morning', labelTe:'ఉదయం', cls:'badge-morning', icon:'🌅' },
  afternoon: { label:'Afternoon', labelTe:'మధ్యాహ్నం', cls:'badge-afternoon', icon:'☀️' },
  evening: { label:'Evening', labelTe:'సాయంత్రం', cls:'badge-evening', icon:'🌆' },
};

const Payments = () => {
  const { isSuperAdmin, canViewAll, language } = useApp();
  const isAdmin = canViewAll;
  const t = useT();
  const [payments, setPayments] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    search:'', leaderId:'', paymentMethod:'', timeOfDay:'',
    sortBy:'paymentDate', sortOrder:'desc', startDate:'', endDate:'',
  });

  useEffect(() => {
    if (isAdmin) {
      api.get('/auth/leaders').then(({ data }) => { if (data.success) setLeaders(data.leaders); });
    }
  }, [isAdmin]);

  const fetchPayments = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/payments', { params });
      if (data.success) { setPayments(data.payments); setTotal(data.total); setTotalPages(data.pages); setPage(pg); }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchPayments(1); }, [filters]);

  const handleDelete = async () => {
    try {
      await api.delete(`/payments/${deleteId}`);
      toast.success(t.paymentDeleted);
      setDeleteId(null);
      fetchPayments(page);
    } catch { toast.error('Delete failed'); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/payments/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `LabourPayments_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      a.click(); window.URL.revokeObjectURL(url);
      toast.success('Excel downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const upd = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));
  const clear = () => setFilters({ search:'', leaderId:'', paymentMethod:'', timeOfDay:'', sortBy:'paymentDate', sortOrder:'desc', startDate:'', endDate:'' });
  const hasActive = filters.search || filters.leaderId || filters.paymentMethod || filters.timeOfDay || filters.startDate || filters.endDate;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><MdPayments className="text-orange-500" />{isAdmin ? t.payments : t.myPayments}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} payments total</p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-semibold text-sm hover:bg-emerald-100 transition-all disabled:opacity-60">
          <MdDownload className="text-lg" /><span className="hidden sm:inline">{exporting ? 'Exporting...' : t.export}</span>
        </button>
      </div>

      {/* Search + Filter */}
      <div className="card p-3 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input type="text" className="input pl-10 py-3" placeholder={t.search}
              value={filters.search} onChange={e => upd('search', e.target.value)} />
            {filters.search && <button onClick={() => upd('search','')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><MdClose /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm ${showFilters || hasActive ? 'bg-orange-500 text-white' : 'btn-secondary'}`}>
            <MdFilterList className="text-lg" /><span className="hidden sm:inline">{t.filter}</span>
            {hasActive && <span className="w-2 h-2 bg-yellow-400 rounded-full" />}
          </button>
        </div>
        {showFilters && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {isAdmin && (
              <select className="input py-2.5 text-sm" value={filters.leaderId} onChange={e => upd('leaderId', e.target.value)}>
                <option value="">All Leaders</option>
                {leaders.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            )}
            <select className="input py-2.5 text-sm" value={filters.paymentMethod} onChange={e => upd('paymentMethod', e.target.value)}>
              <option value="">All Methods</option>
              <option value="phonepe">PhonePe</option>
              <option value="googlepay">Google Pay</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
            <select className="input py-2.5 text-sm" value={filters.timeOfDay} onChange={e => upd('timeOfDay', e.target.value)}>
              <option value="">All Times</option>
              <option value="morning">🌅 Morning</option>
              <option value="afternoon">☀️ Afternoon</option>
              <option value="evening">🌆 Evening</option>
            </select>
            <select className="input py-2.5 text-sm" value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={e => { const [sb,so]=e.target.value.split('_'); upd('sortBy',sb); upd('sortOrder',so); }}>
              <option value="paymentDate_desc">{t.sortLatest}</option>
              <option value="paymentDate_asc">{t.sortOldest}</option>
              <option value="amount_desc">{t.sortHighest}</option>
              <option value="amount_asc">{t.sortLowest}</option>
            </select>
            <input type="date" className="input py-2.5 text-sm" value={filters.startDate} onChange={e => upd('startDate', e.target.value)} />
            <input type="date" className="input py-2.5 text-sm" value={filters.endDate} onChange={e => upd('endDate', e.target.value)} />
            {hasActive && <button onClick={clear} className="flex items-center justify-center gap-1 py-2.5 text-sm text-rose-500 font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"><MdClose /> Clear</button>}
          </div>
        )}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="spinner w-10 h-10 border-4" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <MdPayments className="text-3xl text-gray-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">{t.noPayments}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {payments.map(p => {
              const tb = TIME_BADGES[p.timeOfDay];
              const displayName = getDisplayName(p.leaderName, '', language);
              return (
                <div key={p._id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-11 h-11 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {PAYMENT_ICONS[p.paymentMethod]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{isAdmin ? displayName : p.purpose}</p>
                        <p className="text-xs text-gray-500 truncate">{isAdmin ? p.purpose : ''}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`${tb?.cls} text-xs font-semibold px-2 py-0.5 rounded-full`}>
                            {tb?.icon} {language === 'te' ? tb?.labelTe : tb?.label}
                          </span>
                          <span className="badge-payment">{PAYMENT_LABELS[p.paymentMethod]}</span>
                          <span className="text-xs text-gray-400">{format(new Date(p.paymentDate), 'dd MMM yyyy')}</span>
                        </div>
                        {p.notes && <p className="text-xs text-gray-400 italic mt-0.5 truncate">{p.notes}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <p className="font-black text-base text-orange-600 dark:text-orange-400">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </p>
                        {isSuperAdmin && (
                          <div className="flex gap-1">
                            <Link to={`/edit/${p._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><MdEdit className="text-lg" /></Link>
                            <button onClick={() => setDeleteId(p._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><MdDelete className="text-lg" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
            <button disabled={page<=1} onClick={() => fetchPayments(page-1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button disabled={page>=totalPages} onClick={() => fetchPayments(page+1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>

      {deleteId && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm shadow-2xl">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MdDelete className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">{t.confirmDelete}</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This cannot be undone.</p>
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

export default Payments;
