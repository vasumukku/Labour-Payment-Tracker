import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdConstruction, MdVisibility, MdVisibilityOff, MdLock, MdPerson } from 'react-icons/md';
import { useApp, useT } from '../context/AppContext';

const Login = () => {
  const { login, loading, language, setLanguage, theme, setTheme } = useApp();
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const isTE = language === 'te';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username required';
    if (!form.password) errs.password = 'Password required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = await login(form.username.trim(), form.password);
    if (result?.success) { toast.success('Welcome! 👋'); navigate('/'); }
    else { toast.error(result?.message || 'Login failed'); setErrors({ password: result?.message }); }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-orange-950 flex items-center justify-center p-4 ${isTE ? 'font-te' : ''}`}>
      <div className="fixed top-4 right-4 flex gap-2">
        <button onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
          className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-all">
          {language === 'en' ? 'తెలుగు' : 'English'}
        </button>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="card p-8 shadow-xl shadow-orange-100 dark:shadow-none border border-orange-50 dark:border-gray-800">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/30 mb-4">
              <MdConstruction className="text-white text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t.appName}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t.username}</label>
              <div className="relative">
                <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input type="text" className={`input pl-11 ${errors.username ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                  placeholder={t.enterUsername}
                  value={form.username} onChange={e => { setForm({ ...form, username: e.target.value }); setErrors({ ...errors, username: '' }); }}
                  autoComplete="username" autoFocus />
              </div>
              {errors.username && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.username}</p>}
            </div>

            <div>
              <label className="label">{t.password}</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input type={showPw ? 'text' : 'password'} className={`input pl-11 pr-12 ${errors.password ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                  placeholder={t.enterPassword}
                  value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4 mt-2">
              {loading
                ? <><span className="spinner scale-75 border-white/40 border-t-white" />{t.loggingIn}</>
                : <><MdLock className="text-xl" />{t.login}</>}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            {isTE ? 'అడ్మిన్ ద్వారా సెటప్ చేయబడిన ఖాతా' : 'Account provided by admin · Secured'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
