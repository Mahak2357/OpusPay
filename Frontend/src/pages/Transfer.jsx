import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Copy, Send } from 'lucide-react';
import api from '../api/axios';

const createKey = () => crypto.randomUUID();
const money = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(value || 0));

const Transfer = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState('form');
  const [key, setKey] = useState(createKey);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { api.get('/wallet/me').then(({ data }) => setWallet(data)).catch(() => setError('Unable to load your wallet.')).finally(() => setLoading(false)); }, []);
  const review = async (event) => {
    event.preventDefault(); setError('');
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError('Enter a positive transfer amount.');
    if (value > Number(wallet?.balance || 0)) return setError('This amount exceeds your available balance.');
    try {
      setSubmitting(true);
      const normalizedEmail = recipientEmail.trim().toLowerCase();
      const { data } = await api.get('/wallet/recipient', { params: { email: normalizedEmail } });
      setRecipientEmail(normalizedEmail);
      setRecipient(data.recipient); setStep('review');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Recipient wallet could not be verified.'); }
    finally { setSubmitting(false); }
  };
  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const { data } = await api.post('/wallet/transfer', { receiverEmail: recipient.email, amount: Number(amount), description }, { headers: { 'Idempotency-Key': key } });
      setResult(data.transaction); setWallet((current) => ({ ...current, balance: data.currentBalance ?? current.balance })); setStep('success');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Transfer could not be completed.'); setStep('form'); }
    finally { setSubmitting(false); }
  };
  const nextTransfer = () => { setRecipientEmail(''); setRecipient(null); setAmount(''); setDescription(''); setResult(null); setKey(createKey()); setStep('form'); };

  if (loading) return <div className="mx-auto flex min-h-[60vh] items-center justify-center text-sm text-slate-400">Loading transfer details…</div>;
  return <main className="theme-page mx-auto max-w-xl px-4 py-8 sm:px-6"><Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} />Back to dashboard</Link><section className="rounded-3xl border border-white/10 bg-[#0B101D] p-6 shadow-2xl sm:p-8"><header className="mb-7"><p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Send money</p><h1 className="mt-1 text-2xl font-bold text-white">Review before you send.</h1><p className="mt-2 text-sm text-slate-400">Available: {money(wallet?.balance, wallet?.currency)}</p></header>{error && <div role="alert" className="mb-5 flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"><AlertCircle size={18} />{error}</div>}{step === 'form' && <form onSubmit={review} className="space-y-5"><label className="block text-sm text-slate-300">Recipient email<input type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} required placeholder="name@example.com" className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-cyan-400" /></label><label className="block text-sm text-slate-300">Amount<input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} min="0.01" max={wallet?.balance} step="0.01" required placeholder="0.00" className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-cyan-400" /></label><label className="block text-sm text-slate-300">Description <span className="text-slate-500">(optional)</span><input value={description} onChange={(event) => setDescription(event.target.value)} maxLength="280" placeholder="What is this for?" className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-cyan-400" /></label><button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">{submitting ? 'Checking recipient…' : <>Review transfer<Send size={16} /></>}</button></form>}{step === 'review' && <div className="space-y-5"><div className="space-y-4 rounded-2xl border border-white/10 bg-white/3 p-5 text-sm"><div className="flex justify-between gap-3"><span className="text-slate-400">To</span><span className="text-right text-white">{recipient.name}<br /><span className="text-xs text-slate-400">{recipient.email}</span></span></div><div className="flex justify-between"><span className="text-slate-400">Amount</span><strong className="text-xl text-white">{money(amount, wallet?.currency)}</strong></div><div className="flex justify-between"><span className="text-slate-400">Description</span><span className="text-white">{description || 'No description'}</span></div><div className="flex justify-between border-t border-white/10 pt-4"><span className="text-slate-400">Balance after transfer</span><span className="text-white">{money(Number(wallet?.balance || 0) - Number(amount), wallet?.currency)}</span></div></div><p className="text-xs leading-5 text-slate-400">Only confirm if these recipient details are correct. The request is protected against duplicate submission.</p><div className="flex gap-3"><button onClick={() => setStep('form')} disabled={submitting} className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-slate-200 hover:bg-white/5">Edit</button><button onClick={submit} disabled={submitting} className="flex-1 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">{submitting ? 'Sending…' : 'Confirm & send'}</button></div></div>}{step === 'success' && <div className="text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300"><CheckCircle2 size={34} /></span><h2 className="mt-5 text-xl font-bold text-white">Transfer completed</h2><p className="mt-2 text-sm text-slate-400">{money(result?.amount, result?.currency)} was sent to {recipient?.email}.</p><div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/3 p-4 text-left text-sm"><div className="flex justify-between gap-4"><span className="text-slate-400">Status</span><span className="font-semibold capitalize text-emerald-300">{result?.status || 'completed'}</span></div><div className="flex justify-between gap-4"><span className="text-slate-400">Amount</span><span className="font-semibold text-white">{money(result?.amount, result?.currency)}</span></div><div className="flex justify-between gap-4"><span className="text-slate-400">Date</span><span className="text-right text-white">{result?.createdAt ? new Date(result.createdAt).toLocaleString() : 'Confirmed now'}</span></div><div className="border-t border-white/10 pt-3"><p className="text-slate-400">Transaction ID</p><p className="mt-1 break-all font-mono text-xs text-white">{result?._id}</p></div><div><p className="text-slate-400">Idempotency reference</p><p className="mt-1 break-all font-mono text-xs text-white">{result?.idempotencyKey}</p><button onClick={() => navigator.clipboard?.writeText(result?._id || result?.idempotencyKey || '')} className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-300"><Copy size={13} />Copy transaction ID</button></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={nextTransfer} className="rounded-xl border border-white/10 py-3 text-sm text-slate-200 hover:bg-white/5">New transfer</button><button onClick={() => navigate('/transactions')} className="rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300">View receipt</button></div></div>}</section></main>;
};
export default Transfer;

