import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowUpRight, Bell, Copy, Eye, EyeOff, FileText,
  RefreshCw, Send, ShieldCheck, Wallet, Plus, X, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getSocket } from '../api/socket';

const money = (amount, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(amount || 0));
const createDemoKey = () => crypto.randomUUID();

const Dashboard = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [month, setMonth] = useState({ sent: 0, received: 0, activity: [] });
  const [week, setWeek] = useState({ sent: 0, received: 0 });
  const [transactions, setTransactions] = useState([]);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [demoFundsOpen, setDemoFundsOpen] = useState(false);
  const [demoAmount, setDemoAmount] = useState('500');
  const [demoKey, setDemoKey] = useState(createDemoKey);
  const [demoFunding, setDemoFunding] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [demoSuccess, setDemoSuccess] = useState('');

  const loadDashboard = useCallback(async () => {
    setError('');
    try {
      const [walletResponse, monthResponse, weekResponse, transactionResponse] = await Promise.all([
        api.get('/wallet/me'),
        api.get('/wallet/summary?period=month'),
        api.get('/wallet/summary?period=week'),
        api.get('/wallet/transactions?limit=6&status=completed')
      ]);
      setWallet(walletResponse.data);
      setMonth(monthResponse.data);
      setWeek(weekResponse.data);
      setTransactions(transactionResponse.data.transactions || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your wallet. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadDashboard, 0);
    return () => clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    const userId = user?.id || user?._id;
    if (userId) socket.emit('join_wallet_room', userId);
    const received = (payment) => {
      setNotifications((items) => [{ id: payment.transactionId, message: `${money(payment.amount)} received from ${payment.senderName}.`, createdAt: payment.timestamp }, ...items].slice(0, 5));
      loadDashboard();
    };
    socket.on('payment_received', received);
    return () => socket.off('payment_received', received);
  }, [loadDashboard, user]);

  const activityMax = useMemo(() => Math.max(...month.activity.map((item) => item.amount), 1), [month.activity]);
  const refresh = () => { setRefreshing(true); loadDashboard(); };
  const copyEmail = async () => { await navigator.clipboard?.writeText(user?.email || ''); setNotifications((items) => [{ id: 'copied', message: 'Wallet email copied.', createdAt: new Date().toISOString() }, ...items].slice(0, 5)); };
  const exportStatement = async () => {
    setExporting(true);
    try {
      const response = await api.get('/wallet/transactions/export.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'opuspay-statement.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to export your statement right now.');
    } finally { setExporting(false); }
  };  const openDemoFunds = () => {
    setDemoError('');
    setDemoSuccess('');
    setDemoAmount('500');
    setDemoKey(createDemoKey());
    setDemoFundsOpen(true);
  };
  const addDemoFunds = async () => {
    const amount = Number(demoAmount);
    if (!Number.isFinite(amount) || amount < 1 || amount > 5000) {
      setDemoError('Enter a demo amount between ₹1 and ₹5,000.');
      return;
    }
    setDemoFunding(true);
    setDemoError('');
    try {
      const { data } = await api.post('/wallet/demo-funds', { amount }, { headers: { 'Idempotency-Key': demoKey } });
      setDemoSuccess(data.idempotent ? 'This demo credit was already applied.' : 'Demo funds added to your wallet.');
      setNotifications((items) => [{ id: data.transaction._id, message: data.message, createdAt: data.transaction.createdAt }, ...items].slice(0, 5));
      await loadDashboard();
      setDemoKey(createDemoKey());
    } catch (requestError) {
      setDemoError(requestError.response?.data?.message || 'Unable to add demo funds. Please try again.');
    } finally { setDemoFunding(false); }
  };

  if (loading) return <DashboardSkeleton />;

  return <main className="theme-page mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">Wallet overview</p><h1 className="mt-1 text-2xl font-semibold">Welcome back, {user?.name?.split(' ')[0] || 'there'}.</h1><p className="mt-1 text-sm theme-muted">Your wallet balance and authorised transaction activity.</p></div>
      <div className="flex items-center gap-2"><div className="relative"><button onClick={() => setNotificationsOpen(!notificationsOpen)} aria-expanded={notificationsOpen} aria-label="Open notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border theme-border theme-subtle hover:text-cyan-600"><Bell size={17} />{notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-500" />}</button>{notificationsOpen && <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border theme-card p-3 shadow-xl"><p className="px-2 py-1 text-sm font-semibold">Notifications</p>{notifications.length ? notifications.map((item) => <div key={item.id} className="rounded-xl px-2 py-3 text-sm theme-subtle"><p>{item.message}</p><p className="mt-1 text-xs theme-muted">{new Date(item.createdAt).toLocaleString()}</p></div>) : <p className="p-3 text-sm theme-muted">No new payment notifications.</p>}</div>}</div><Link to="/profile" aria-label="Open profile and security" className="inline-flex h-10 items-center rounded-xl border theme-border theme-subtle px-3 text-sm font-medium hover:text-cyan-600"><ShieldCheck size={16} className="mr-2" />Security</Link><button onClick={refresh} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-400 px-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />Refresh</button></div>
    </header>

    {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"><span>{error}</span><button onClick={refresh} className="font-semibold underline">Try again</button></div>}

    <section className="grid gap-5 lg:grid-cols-3">
      <div className="theme-card rounded-3xl border p-7 shadow-sm lg:col-span-2"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-sm font-medium theme-muted"><Wallet size={18} className="text-cyan-600" />Available balance</span><div className="flex items-center gap-1"><button onClick={openDemoFunds} className="inline-flex items-center gap-1 rounded-lg bg-cyan-400/15 px-2.5 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-400/25 dark:text-cyan-300"><Plus size={15} />Add Demo Funds</button><button onClick={() => setBalanceHidden(!balanceHidden)} aria-label={balanceHidden ? 'Show balance' : 'Hide balance'} className="rounded-lg p-2 theme-muted hover:text-cyan-600">{balanceHidden ? <Eye size={17} /> : <EyeOff size={17} />}</button></div></div><p className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{balanceHidden ? '••••••' : money(wallet?.balance, wallet?.currency)}</p><p className="mt-2 text-sm theme-muted">{wallet?.status === 'active' ? 'Available to send' : 'This wallet is currently unavailable'}</p><div className="mt-8 grid grid-cols-2 gap-4 border-t pt-5 theme-border"><Summary label="Received this month" value={money(month.received, wallet?.currency)} tone="text-emerald-600" /><Summary label="Sent this month" value={money(month.sent, wallet?.currency)} tone="text-rose-600" /></div></div>
      <div className="theme-card rounded-3xl border p-7 shadow-sm"><p className="text-sm font-semibold">Receive money</p><p className="mt-2 text-sm leading-6 theme-muted">Share your registered wallet email with another OpusPay user.</p><div className="mt-5 flex items-center justify-between gap-2 rounded-xl border p-3 theme-subtle"><span className="truncate text-sm">{user?.email}</span><button onClick={copyEmail} aria-label="Copy wallet email" className="shrink-0 rounded-lg p-1.5 text-cyan-600 hover:bg-cyan-500/10"><Copy size={16} /></button></div><Link to="/transfer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"><Send size={16} />Send money</Link></div>
    </section>

    {demoFundsOpen && <DemoFundsModal amount={demoAmount} error={demoError} funding={demoFunding} onAmount={setDemoAmount} onCancel={() => !demoFunding && setDemoFundsOpen(false)} onConfirm={addDemoFunds} onPreset={setDemoAmount} success={demoSuccess} />}

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Received this week" value={money(week.received, wallet?.currency)} icon={<ArrowDownLeft size={18} />} tone="text-emerald-600" /><Metric label="Sent this week" value={money(week.sent, wallet?.currency)} icon={<ArrowUpRight size={18} />} tone="text-rose-600" /><QuickAction icon={<HistoryIcon />} label="Transactions" to="/transactions" /><button onClick={exportStatement} disabled={exporting} className="theme-card flex rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"><span className="mr-3 text-cyan-600"><FileText size={19} /></span><span><span className="block text-sm font-semibold">{exporting ? 'Preparing statement…' : 'Statements'}</span><span className="mt-1 block text-xs theme-muted">Download CSV activity</span></span></button></section>

    <section className="grid gap-5 lg:grid-cols-3"><div className="theme-card rounded-2xl border p-6 shadow-sm lg:col-span-2"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Recent transactions</h2><p className="mt-1 text-sm theme-muted">Your latest completed wallet transfers.</p></div><Link to="/transactions" className="text-sm font-semibold text-cyan-600 hover:text-cyan-500">View all</Link></div>{transactions.length ? <div className="mt-5 divide-y theme-border">{transactions.map((transaction) => <TransactionRow key={transaction._id} transaction={transaction} currency={wallet?.currency} />)}</div> : <EmptyActivity />}</div><ActivityChart activity={month.activity} max={activityMax} currency={wallet?.currency} /></section>
  </main>;
};

const DemoFundsModal = ({ amount, error, funding, onAmount, onCancel, onConfirm, onPreset, success }) => <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="demo-funds-title"><div className="theme-card w-full max-w-md rounded-3xl border p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">Development only</p><h2 id="demo-funds-title" className="mt-1 text-xl font-semibold">Add demo funds</h2><p className="mt-2 text-sm theme-muted">This creates a clearly labelled Demo Credit in your authorised wallet.</p></div><button onClick={onCancel} disabled={funding} aria-label="Close add demo funds dialog" className="rounded-lg p-1 theme-muted hover:text-rose-600 disabled:opacity-50"><X size={19} /></button></div>{success ? <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"><CheckCircle2 className="mr-2 inline-block" size={17} />{success}</div> : <><div className="mt-6 grid grid-cols-3 gap-2">{[500, 1000, 5000].map((preset) => <button key={preset} onClick={() => onPreset(String(preset))} disabled={funding} className={`rounded-xl border px-2 py-3 text-sm font-semibold ${Number(amount) === preset ? 'border-cyan-500 bg-cyan-400/15 text-cyan-700 dark:text-cyan-300' : 'theme-border theme-subtle'}`}>₹{preset.toLocaleString('en-IN')}</button>)}</div><label className="mt-5 block text-sm font-medium">Custom amount<input type="number" min="1" max="5000" step="1" value={amount} onChange={(event) => onAmount(event.target.value)} disabled={funding} className="theme-input mt-2 w-full rounded-xl border px-3 py-3 outline-none focus:border-cyan-500" /></label>{error && <p role="alert" className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}<p className="mt-3 text-xs leading-5 theme-muted">The request is idempotent: retrying the same request cannot add the credit twice.</p><div className="mt-6 flex gap-3"><button onClick={onCancel} disabled={funding} className="flex-1 rounded-xl border theme-border px-4 py-3 text-sm font-semibold disabled:opacity-50">Cancel</button><button onClick={onConfirm} disabled={funding} className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">{funding ? 'Adding…' : 'Confirm funds'}</button></div></>}</div></div>;
const Summary = ({ label, tone, value }) => <div><p className="text-xs theme-muted">{label}</p><p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p></div>;
const Metric = ({ icon, label, tone, value }) => <article className="theme-card rounded-2xl border p-5 shadow-sm"><span className={tone}>{icon}</span><p className="mt-5 text-xs theme-muted">{label}</p><p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p></article>;
const HistoryIcon = () => <FileText size={19} />;
const QuickAction = ({ icon, label, to }) => <Link to={to} className="theme-card flex rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="mr-3 text-cyan-600">{icon}</span><span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs theme-muted">Search and filter activity</span></span></Link>;
const TransactionRow = ({ currency, transaction }) => { const sent = transaction.direction === 'sent'; const demoCredit = transaction.description === 'Demo Credit'; const party = sent ? transaction.receiverId : transaction.senderId; const title = demoCredit ? 'Demo Credit' : party?.name || party?.email || (sent ? 'Sent transfer' : 'Received transfer'); const tone = sent ? 'bg-rose-500/10 text-rose-600' : demoCredit ? 'bg-cyan-500/10 text-cyan-600' : 'bg-emerald-500/10 text-emerald-600'; const amountTone = sent ? 'text-rose-600' : demoCredit ? 'text-cyan-600' : 'text-emerald-600'; return <div className="flex items-center gap-3 py-4"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>{sent ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{title}</p><p className="truncate text-xs theme-muted">{demoCredit ? 'Development wallet credit' : transaction.description || transaction.idempotencyKey}</p></div><div className="text-right"><p className={`text-sm font-semibold ${amountTone}`}>{sent ? '-' : '+'}{money(transaction.amount, currency)}</p><p className="text-xs theme-muted">{new Date(transaction.createdAt).toLocaleDateString()} · {transaction.status}</p></div></div>; };
const EmptyActivity = () => <div className="mt-5 rounded-2xl border border-dashed p-10 text-center theme-border"><Wallet className="mx-auto text-cyan-600" size={24} /><p className="mt-3 text-sm font-semibold">No transactions yet</p><p className="mx-auto mt-1 max-w-sm text-sm theme-muted">When you send or receive a completed transfer, it will appear here with its status and details.</p></div>;
const ActivityChart = ({ activity, currency, max }) => <article className="theme-card rounded-2xl border p-6 shadow-sm"><h2 className="font-semibold">30-day activity</h2><p className="mt-1 text-sm theme-muted">Completed transfer volume by day.</p><div className="mt-7 flex h-40 items-end gap-1">{activity.length ? activity.slice(-30).map((item) => <div key={item.date} title={`${item.date}: ${money(item.amount, currency)}`} className="flex h-full flex-1 items-end"><div className="w-full rounded-t bg-cyan-400 transition hover:bg-cyan-500" style={{ height: `${Math.max((item.amount / max) * 100, 5)}%` }} /></div>) : <div className="m-auto text-center text-sm theme-muted">Your completed transaction activity will appear here.</div>}</div></article>;
const DashboardSkeleton = () => <main className="theme-page mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8" aria-busy="true"><div className="h-16 w-64 animate-pulse rounded-xl theme-subtle" /><div className="grid gap-5 lg:grid-cols-3"><div className="h-72 animate-pulse rounded-3xl theme-subtle lg:col-span-2" /><div className="h-72 animate-pulse rounded-3xl theme-subtle" /></div><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl theme-subtle" />)}</div></main>;

export default Dashboard;


