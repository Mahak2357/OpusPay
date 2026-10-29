import { useState } from 'react';
import { KeyRound, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const { data } = await api.patch('/auth/me', { name });
      updateUser(data.user);
      setMessage('Profile updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update profile.');
    } finally { setSaving(false); }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setMessage('Password updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update password.');
    } finally { setSaving(false); }
  };

  return <main className="theme-page max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Account</p><h1 className="mt-1 text-2xl font-bold text-white">Profile & security</h1><p className="mt-1 text-sm text-slate-400">Manage the details used by your OpusPay wallet.</p></header>
    {(message || error) && <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>{error || message}</div>}
    <section className="rounded-2xl border border-white/10 bg-[#0B101D] p-6 shadow-xl">
      <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-cyan-500/10 p-2 text-cyan-300"><UserRound size={18} /></span><div><h2 className="font-semibold text-white">Personal details</h2><p className="text-xs text-slate-400">Your wallet identifier cannot be changed.</p></div></div>
      <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-slate-300">Name<input value={name} onChange={(event) => setName(event.target.value)} minLength="2" maxLength="80" required className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-cyan-400" /></label><label className="text-sm text-slate-300">Email<input value={user?.email || ''} disabled className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-slate-400" /></label><button disabled={saving} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"><Save size={16} />Save profile</button></form>
    </section>
    <section className="rounded-2xl border border-white/10 bg-[#0B101D] p-6 shadow-xl">
      <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-violet-500/10 p-2 text-violet-300"><KeyRound size={18} /></span><div><h2 className="font-semibold text-white">Change password</h2><p className="text-xs text-slate-400">Use at least eight characters and keep it private.</p></div></div>
      <form onSubmit={updatePassword} className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-slate-300">Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-cyan-400" /></label><label className="text-sm text-slate-300">New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="8" required className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-cyan-400" /></label><button disabled={saving} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-100 hover:bg-violet-500/20 disabled:opacity-50"><ShieldCheck size={16} />Update password</button></form>
    </section>
  </main>;
};

export default Profile;
