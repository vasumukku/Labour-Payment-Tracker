import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp, useT } from '../context/AppContext';
import {
  MdDashboard, MdPayments, MdAdd, MdSettings, MdLogout,
  MdMenu, MdClose, MdConstruction, MdPeople, MdWbSunny,
  MdDarkMode, MdLanguage, MdAdminPanelSettings, MdSupervisorAccount
} from 'react-icons/md';

const Layout = () => {
  const { user, logout, theme, setTheme, language, setLanguage, isSuperAdmin, canViewAll, isLeader } = useApp();
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/', icon: MdDashboard, label: t.dashboard, end: true, show: true },
    { to: '/payments', icon: MdPayments, label: t.payments, show: true },
    { to: '/add', icon: MdAdd, label: t.addPayment, show: isSuperAdmin },
    { to: '/leaders', icon: MdPeople, label: t.leaders, show: isSuperAdmin },
    { to: '/viewers', icon: MdSupervisorAccount, label: 'Admin Viewers', show: isSuperAdmin },
    { to: '/settings', icon: MdSettings, label: t.settings, show: true },
  ].filter(i => i.show);

  // Role badge
  const roleBadge = () => {
    if (isSuperAdmin) return { label: '⚙️ Super Admin', cls: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' };
    if (canViewAll) return { label: '👁 Admin Viewer', cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' };
    return { label: '👤 View Only', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' };
  };
  const badge = roleBadge();
  const isTE = language === 'te';

  const SideContent = ({ onClose }) => (
    <>
      <nav className="flex-1 p-4 space-y-1">
        <div className={`flex items-center gap-2 px-4 py-2 mb-3 rounded-xl text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </div>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
               ${isActive
                 ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                 : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
            <Icon className="text-xl flex-shrink-0" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <button onClick={() => { setTheme(theme === 'light' ? 'dark' : 'light'); onClose?.(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
          {theme === 'light' ? <MdDarkMode className="text-lg" /> : <MdWbSunny className="text-lg text-yellow-400" />}
          {theme === 'light' ? t.darkMode : t.lightMode}
        </button>
        <button onClick={() => { setLanguage(language === 'en' ? 'te' : 'en'); onClose?.(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
          <MdLanguage className="text-lg" />
          {language === 'en' ? 'తెలుగు' : 'English'}
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
          <MdLogout className="text-lg" />{t.logout}
        </button>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen flex bg-gray-50 dark:bg-gray-950 ${isTE ? 'font-te' : ''}`}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
              <MdConstruction className="text-white text-xl" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{t.appName}</h1>
              <p className="text-xs text-gray-400">{user?.name}</p>
            </div>
          </div>
        </div>
        <SideContent />
      </aside>

      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <MdConstruction className="text-white text-lg" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm">{t.appName}</h1>
              <p className="text-xs text-gray-400">{user?.name}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <MdClose className="text-xl text-gray-500" />
          </button>
        </div>
        <SideContent onClose={() => setOpen(false)} />
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3.5 flex items-center justify-between shadow-sm">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 -ml-1">
            <MdMenu className="text-2xl text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <MdConstruction className="text-white text-sm" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">{t.appName}</span>
          </div>
          {isSuperAdmin
            ? <NavLink to="/add" className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"><MdAdd className="text-xl" /></NavLink>
            : <div className="w-9" />}
        </header>
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 page-enter">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden bottom-nav safe-area-inset-bottom">
        {navItems.slice(0, 5).map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon className="text-2xl" />
            <span className="text-[10px] font-semibold">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
