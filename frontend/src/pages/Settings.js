import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { MdSettings, MdLock, MdLanguage, MdPalette, MdWbSunny, MdDarkMode, MdSave, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { api, useApp, useT } from '../context/AppContext';

const Settings = () => {
  const { user, language, setLanguage, theme, setTheme, updateUser, isAdmin } = useApp();
  const t = useT();
  const [passwords, setPasswords] = useState({ current:'', newPass:'', confirm:'' });
  const [showPw, setShowPw] = useState({ current:false, newPass:false, confirm:false });
  const [savingPw, setSavingPw] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  const handleSavePreferences = async () => {
    setSavingPref(true);
    try {
      const { data } = await api.put('/auth/preferences', { language, theme });
      if (data.success) { updateUser(data.user); toast.success(t.settingsSaved); }
    } catch { toast.error('Failed to save'); }
    finally { setSavingPref(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    if (passwords.newPass.length < 4) { toast.error('Min 4 characters'); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/password', { currentPassword: passwords.current, newPassword: passwords.newPass });
      toast.success(t.settingsSaved);
      setPasswords({ current:'', newPass:'', confirm:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSavingPw(false); }
  };

  const PwInput = ({ field, label }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input type={showPw[field] ? 'text' : 'password'} className="input pl-11 pr-11"
          value={passwords[field]} onChange={e => setPasswords(prev => ({...prev, [field]:e.target.value}))} />
        <button type="button" onClick={() => setShowPw(prev=>({...prev,[field]:!prev[field]}))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {showPw[field] ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="page-title flex items-center gap-2"><MdSettings className="text-orange-500" />{t.settings}</h1>

      {/* Profile info */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 dark:text-white text-base mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">@{user?.username}</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold mt-1 inline-block
              ${isAdmin ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
              {isAdmin ? '⚙️ Admin' : '👁 Leader (View Only)'}
            </span>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
          <MdPalette className="text-purple-500" /> Appearance
        </h2>
        <div>
          <label className="label">{t.theme}</label>
          <div className="grid grid-cols-2 gap-3">
            {[{val:'light',icon:MdWbSunny,label:t.lightMode,color:'text-yellow-500'},{val:'dark',icon:MdDarkMode,label:t.darkMode,color:'text-indigo-500'}].map(({val,icon:Icon,label,color})=>(
              <button key={val} type="button" onClick={() => setTheme(val)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 font-semibold text-sm
                  ${theme===val ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}>
                <Icon className={`text-2xl ${theme===val ? color : 'text-gray-400'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label"><MdLanguage className="inline mr-1" />{t.language}</label>
          <div className="grid grid-cols-2 gap-3">
            {[{val:'en',label:'🇬🇧 English'},{val:'te',label:'🇮🇳 తెలుగు'}].map(({val,label})=>(
              <button key={val} type="button" onClick={() => setLanguage(val)}
                className={`p-4 rounded-xl border-2 transition-all font-semibold text-sm
                  ${language===val ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleSavePreferences} disabled={savingPref} className="btn-primary w-full">
          {savingPref ? <><span className="spinner scale-75" />Saving...</> : <><MdSave />Save Preferences</>}
        </button>
      </div>

      {/* Change password — admin only */}
      {isAdmin && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base mb-4">
            <MdLock className="text-rose-500" /> {t.changePassword}
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <PwInput field="current" label={t.currentPassword} />
            <PwInput field="newPass" label={t.newPassword} />
            <PwInput field="confirm" label={t.confirmPassword} />
            <button type="submit" disabled={savingPw||!passwords.current||!passwords.newPass||!passwords.confirm} className="btn-primary w-full disabled:opacity-60">
              {savingPw ? <><span className="spinner scale-75" />Updating...</> : <><MdLock />{t.changePassword}</>}
            </button>
          </form>
        </div>
      )}

      {/* App info */}
      <div className="card p-5 bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
        <h3 className="font-bold text-orange-900 dark:text-orange-300 mb-2">ℹ️ App Info</h3>
        <div className="space-y-1 text-sm text-orange-700 dark:text-orange-400">
          <p>👷 Labour Payment Tracker v1.0</p>
          <p>🔒 Secured with JWT + bcrypt</p>
          <p>☁️ MongoDB Atlas cloud storage</p>
          <p>🌏 Telugu + English bilingual</p>
          <p>💾 Export to Excel anytime</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
