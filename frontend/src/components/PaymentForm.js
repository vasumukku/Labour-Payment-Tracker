import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdAttachMoney, MdCategory, MdCalendarToday, MdNotes, MdSave, MdArrowBack } from 'react-icons/md';
import { api, useT } from '../context/AppContext';

const PAYMENT_OPTIONS = [
  { value:'phonepe', emoji:'📱' }, { value:'googlepay', emoji:'💳' },
  { value:'cash', emoji:'💵' }, { value:'bank_transfer', emoji:'🏦' }, { value:'other', emoji:'💰' },
];

const TIME_OPTIONS = [
  { value:'morning', emoji:'🌅' }, { value:'afternoon', emoji:'☀️' }, { value:'evening', emoji:'🌆' },
];

const DEFAULT = {
  leaderId: '', amount: '', purpose: '', paymentMethod: 'cash',
  paymentDate: format(new Date(), 'yyyy-MM-dd'), timeOfDay: 'morning', notes: '',
};

const PaymentForm = ({ payment = null, onSuccess }) => {
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT);
  const [leaders, setLeaders] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const { data } = await api.get('/auth/leaders');
        if (data.success) setLeaders(data.leaders);
      } catch { toast.error('Failed to load leaders'); }
    };
    fetchLeaders();
  }, []);

  useEffect(() => {
    if (payment) {
      setForm({
        leaderId: payment.leaderId?._id || payment.leaderId || '',
        amount: payment.amount?.toString() || '',
        purpose: payment.purpose || '',
        paymentMethod: payment.paymentMethod || 'cash',
        paymentDate: payment.paymentDate ? format(new Date(payment.paymentDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        timeOfDay: payment.timeOfDay || 'morning',
        notes: payment.notes || '',
      });
    }
  }, [payment]);

  const validate = () => {
    const e = {};
    if (!form.leaderId) e.leaderId = t.leaderRequired;
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = t.amountRequired;
    if (!form.purpose.trim()) e.purpose = t.purposeRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (payment?._id) {
        await api.put(`/payments/${payment._id}`, payload);
        toast.success(t.paymentUpdated);
      } else {
        await api.post('/payments', payload);
        toast.success(t.paymentAdded);
        setForm(DEFAULT);
      }
      if (onSuccess) onSuccess();
      else navigate('/payments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">

      {/* Leader Select */}
      <div>
        <label className="label">Select Leader *</label>
        {leaders.length === 0 ? (
          <div className="input text-gray-400 flex items-center gap-2">
            <span>⚠️ {t.noLeaders} — </span>
            <a href="/leaders" className="text-orange-500 font-semibold">{t.addLeaderFirst}</a>
          </div>
        ) : (
          <select className={`input ${errors.leaderId ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
            value={form.leaderId} onChange={e => handleChange('leaderId', e.target.value)}>
            <option value="">{t.leaderRequired}</option>
            {leaders.map(l => (
              <option key={l._id} value={l._id}>{l.name} {l.nameInTelugu ? `(${l.nameInTelugu})` : ''}</option>
            ))}
          </select>
        )}
        {errors.leaderId && <p className="text-rose-500 text-xs mt-1">{errors.leaderId}</p>}
      </div>

      {/* Amount */}
      <div>
        <label className="label"><MdAttachMoney className="inline mr-1" />{t.amount} *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
          <input type="number" min="1" step="0.01"
            className={`input pl-8 text-xl font-bold ${errors.amount ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
            placeholder="0" value={form.amount} onChange={e => handleChange('amount', e.target.value)} />
        </div>
        {form.amount && !isNaN(form.amount) && parseFloat(form.amount) > 0 && (
          <p className="text-sm text-gray-500 mt-1">₹{parseFloat(form.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        )}
        {errors.amount && <p className="text-rose-500 text-xs mt-1">{errors.amount}</p>}
      </div>

      {/* Purpose */}
      <div>
        <label className="label"><MdCategory className="inline mr-1" />{t.purpose} *</label>
        <input type="text" className={`input ${errors.purpose ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
          placeholder="e.g. Week 1 wages, Advance, Materials..."
          value={form.purpose} onChange={e => handleChange('purpose', e.target.value)} />
        {errors.purpose && <p className="text-rose-500 text-xs mt-1">{errors.purpose}</p>}
      </div>

      {/* Date */}
      <div>
        <label className="label"><MdCalendarToday className="inline mr-1" />{t.date}</label>
        <input type="date" className="input" value={form.paymentDate}
          max={format(new Date(), 'yyyy-MM-dd')}
          onChange={e => handleChange('paymentDate', e.target.value)} />
      </div>

      {/* Time of Day */}
      <div>
        <label className="label">{t.timeOfDay}</label>
        <div className="grid grid-cols-3 gap-3">
          {TIME_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => handleChange('timeOfDay', opt.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all font-semibold text-sm
                ${form.timeOfDay === opt.value
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300'}`}>
              <span className="text-2xl">{opt.emoji}</span>
              <span>{t[opt.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="label">{t.paymentMethod}</label>
        <div className="grid grid-cols-5 gap-2">
          {PAYMENT_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => handleChange('paymentMethod', opt.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-xs font-semibold
                ${form.paymentMethod === opt.value
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300'}`}>
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-center leading-tight">{t[opt.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label"><MdNotes className="inline mr-1" />{t.notes}</label>
        <textarea className="input resize-none" rows={3}
          placeholder="Additional notes..."
          value={form.notes} onChange={e => handleChange('notes', e.target.value)} />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
          <MdArrowBack /> {t.cancel}
        </button>
        <button type="submit" disabled={saving} className="btn-primary flex-[2]">
          {saving
            ? <><span className="spinner scale-75" />{t.saving}</>
            : <><MdSave className="text-xl" />{payment ? t.update : t.save}</>}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
