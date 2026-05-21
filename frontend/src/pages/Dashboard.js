import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MdAdd, MdRefresh, MdConstruction, MdPeople, MdTrendingDown } from 'react-icons/md';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { api, useApp, useT } from '../context/AppContext';
import { getDisplayName } from '../i18n/translations';

const fmt = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n.toLocaleString('en-IN')}`;
const fmtFull = (n) => `₹${Number(n||0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TIME_BADGES = {
  morning: { label: 'Morning', labelTe: 'ఉదయం', cls: 'badge-morning', icon: '🌅' },
  afternoon: { label: 'Afternoon', labelTe: 'మధ్యాహ్నం', cls: 'badge-afternoon', icon: '☀️' },
  evening: { label: 'Evening', labelTe: 'సాయంత్రం', cls: 'badge-evening', icon: '🌆' },
};

const PAYMENT_ICONS = { phonepe:'📱', googlepay:'💳', cash:'💵', bank_transfer:'🏦', other:'💰' };

const AVATAR_COLORS = [
  'bg-orange-500','bg-blue-500','bg-emerald-500','bg-purple-500',
  'bg-rose-500','bg-amber-500','bg-teal-500','bg-indigo-500',
];

const Dashboard = () => {
  const { canViewAll, isSuperAdmin, theme, language } = useApp();
  const isAdmin = canViewAll;
  const t = useT();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payments/stats');
      if (data.success) setStats(data.stats);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const buildChartData = () => {
    if (!stats?.monthly) return [];
    const map = {};
    stats.monthly.forEach(d => {
      const key = `${d._id.year}-${String(d._id.month).padStart(2,'0')}`;
      if (!map[key]) map[key] = { month: t.months[d._id.month-1], total: 0, count: 0 };
      map[key].total += d.total;
      map[key].count += d.count;
    });
    return Object.values(map).slice(-6);
  };

  const chartData = buildChartData();
  const isDark = theme === 'dark';

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="spinner w-10 h-10 border-4" />
      <p className="text-gray-500 text-sm">{t.loading}</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t.dashboard}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{format(new Date(), 'dd MMM yyyy')}</p>
        </div>
        <button onClick={fetchStats} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all active:scale-95">
          <MdRefresh className="text-xl" />
        </button>
      </div>

      {/* ── LINE 1: TOTAL HERO CARD ── */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-6" />
        <div className="relative z-10">
          <p className="text-orange-100 text-sm font-medium mb-2 flex items-center gap-2">
            <MdConstruction className="text-lg" />
            {isAdmin ? t.totalSpent : t.myTotal}
          </p>
          <p className="text-4xl font-black tracking-tight mb-4">{fmtFull(stats?.totalAmount)}</p>
          <div className="flex gap-6">
            <div>
              <p className="text-orange-200 text-xs mb-0.5">{t.thisMonth}</p>
              <p className="text-white font-bold text-sm">{fmt(stats?.monthAmount || 0)}</p>
            </div>
            <div>
              <p className="text-orange-200 text-xs mb-0.5">{t.totalPayments}</p>
              <p className="text-white font-bold text-sm">{stats?.totalCount || 0}</p>
            </div>
            {isAdmin && (
              <div>
                <p className="text-orange-200 text-xs mb-0.5">{t.leaders}</p>
                <p className="text-white font-bold text-sm">{stats?.perLeader?.length || 0}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DIVIDER LINE ── */}
      {isAdmin && stats?.perLeader?.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2">{t.perLeader}</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
      )}

      {/* ── LINE 2: PER LEADER CARDS ── */}
      {isAdmin && stats?.perLeader?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {stats.perLeader.map((leader, idx) => {
            const maxAmt = Math.max(...stats.perLeader.map(l => l.total));
            const pct = maxAmt > 0 ? (leader.total / maxAmt) * 100 : 0;
            const displayName = getDisplayName(leader.leaderName, leader.nameInTelugu, language);
            const initials = leader.leaderName.substring(0,2).toUpperCase();
            const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <div key={leader._id} className="card p-4 hover:shadow-md transition-all">
                <div className={`w-10 h-10 ${colorClass} rounded-xl flex items-center justify-center text-white font-bold text-sm mb-3`}>
                  {initials}
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{displayName}</p>
                <p className="text-orange-600 dark:text-orange-400 font-black text-lg">{fmt(leader.total)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{leader.count} payments</p>
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly chart */}
      {chartData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 text-base">{t.monthlySummary}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f4f6'} />
              <XAxis dataKey="month" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip
                formatter={(val) => [fmtFull(val), t.totalSpent]}
                contentStyle={{ background: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, borderRadius: '12px', fontSize: '12px', color: isDark ? '#f3f4f6' : '#111827' }} />
              <Bar dataKey="total" fill="#f97316" radius={[4,4,0,0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent payments */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white text-base">{t.recentPayments}</h2>
          <Link to="/payments" className="text-sm text-orange-600 dark:text-orange-400 font-semibold hover:underline">View all →</Link>
        </div>

        {!stats?.recent?.length ? (
          <div className="p-8 text-center">
            <MdConstruction className="text-gray-400 text-4xl mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t.noPayments}</p>
            {isSuperAdmin && (
              <Link to="/add" className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange-600 font-semibold hover:underline">
                <MdAdd /> {t.addFirst}
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {stats.recent.map(p => {
              const tb = TIME_BADGES[p.timeOfDay];
              const displayName = getDisplayName(p.leaderName, '', language);
              return (
                <div key={p._id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-11 h-11 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {PAYMENT_ICONS[p.paymentMethod]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{p.purpose}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`${tb?.cls} text-xs font-semibold px-2 py-0.5 rounded-full`}>
                        {tb?.icon} {language === 'te' ? tb?.labelTe : tb?.label}
                      </span>
                      <span className="text-xs text-gray-400">{format(new Date(p.paymentDate), 'dd MMM yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-base text-orange-600 dark:text-orange-400">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB for desktop admin */}
      {isSuperAdmin && (
        <Link to="/add" className="hidden lg:flex fixed bottom-8 right-8 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl items-center justify-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95">
          <MdAdd className="text-2xl" />
        </Link>
      )}
    </div>
  );
};

export default Dashboard;
