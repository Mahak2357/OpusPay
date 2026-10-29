import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Copy,
  Eye, EyeOff, History, LockKeyhole, Menu, Moon, Send, ShieldCheck,
  Sparkles, Sun, UserRound, Wallet, X, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const sections = [
  ['Product', 'product'],
  ['How it works', 'how-it-works'],
  ['Security', 'security'],
  ['FAQ', 'faq'],
  ['Reviews', 'reviews']
];

const recipients = [
  { id: 'ava', name: 'Ava Patel', email: 'ava@example.demo' },
  { id: 'sam', name: 'Sam Lee', email: 'sam@example.demo' }
];

const faqs = [
  ['How do I create an OpusPay account?', 'Use Get started to open the existing registration screen. A wallet is created for the registered account.'],
  ['How do I send money?', 'After signing in, choose Send money, enter a registered recipient email and amount, review the details, then confirm the transfer.'],
  ['How do I receive money?', 'Share the registered email address shown in your wallet. Another OpusPay user can use it as the recipient address.'],
  ['What does a transaction status mean?', 'Completed transfers are reflected in wallet activity. The activity view also supports pending, failed, and reversed status labels when those records exist.'],
  ['What happens if I submit a transfer twice?', 'Transfer requests use an idempotency key. A repeated completed request returns its original result instead of creating another completed transfer.'],
  ['How is account access protected?', 'Wallet pages require an authenticated session. Password changes require the current password before a new one is accepted.']
];

const reveal = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: 'easeOut' } } };

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [previewAction, setPreviewAction] = useState('send');
  const [demoStep, setDemoStep] = useState(0);
  const [demoRecipient, setDemoRecipient] = useState(recipients[0].id);
  const [demoAmount, setDemoAmount] = useState('250');
  const [faqOpen, setFaqOpen] = useState(0);
  const appDestination = isAuthenticated ? '/dashboard' : '/register';
  const loginDestination = isAuthenticated ? '/dashboard' : '/login';
  const selectedRecipient = recipients.find((recipient) => recipient.id === demoRecipient) || recipients[0];
  const demoValue = Number(demoAmount);
  const usableAmount = Number.isFinite(demoValue) && demoValue > 0 ? demoValue : 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }),
      { rootMargin: '-35% 0px -55% 0px' }
    );
    sections.forEach(([, id]) => { const target = document.getElementById(id); if (target) observer.observe(target); });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMenuOpen(false); };
  const nextDemoStep = () => setDemoStep((step) => Math.min(step + 1, 2));
  const previousDemoStep = () => setDemoStep((step) => Math.max(step - 1, 0));

  return (
    <main className={`opus-landing min-h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#07111f] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      <style>{`
        body:has(.opus-landing) #root > div > header { display: none; }
        @media (prefers-reduced-motion: reduce) { .opus-landing *, .opus-landing *::before, .opus-landing *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } }
      `}</style>
      <Decor theme={theme} />
      <LandingNavbar
        activeSection={activeSection} appDestination={appDestination} loginDestination={loginDestination}
        menuOpen={menuOpen} onMenu={() => setMenuOpen(!menuOpen)} onNavigate={scrollTo}
        onTheme={toggleTheme} theme={theme}
      />

      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1fr_.95fr] lg:items-center lg:pb-28 lg:pt-24">
        <motion.div initial="hidden" animate="visible" variants={reveal}>
          <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${theme === 'dark' ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' : 'border-cyan-200 bg-cyan-50 text-cyan-800'}`}><Sparkles size={13} /> AN EVERYDAY WALLET, MADE CALM</p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.055em] sm:text-6xl lg:text-[4.5rem] lg:leading-[.98]">Money management that feels <span className="text-cyan-500">effortless.</span></h1>
          <p className={`mt-6 max-w-xl text-lg leading-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>OpusPay brings your balance, transfers, and activity into one considered wallet experience—so every step is clear before you act.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to={appDestination} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-xl hover:shadow-cyan-400/20">{isAuthenticated ? 'Open dashboard' : 'Get started'} <ArrowRight size={17} /></Link>
            <button onClick={() => scrollTo('how-it-works')} className={`rounded-xl border px-5 py-3.5 font-medium transition ${theme === 'dark' ? 'border-white/15 hover:bg-white/5' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>Explore the demo</button>
          </div>
          <div className={`mt-9 flex flex-wrap gap-x-5 gap-y-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}><span className="inline-flex items-center gap-1.5"><Check size={16} className="text-cyan-500" />No simulated real balances</span><span className="inline-flex items-center gap-1.5"><Check size={16} className="text-cyan-500" />Review before sending</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }} className="relative mx-auto w-full max-w-xl">
          <WalletPreview action={previewAction} balanceVisible={balanceVisible} onAction={setPreviewAction} onBalance={() => setBalanceVisible(!balanceVisible)} theme={theme} />
        </motion.div>
      </section>

      <section id="product" className={`scroll-mt-20 border-y py-20 ${theme === 'dark' ? 'border-white/10 bg-white/2.5' : 'border-slate-200 bg-white/75'}`}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionTitle eyebrow="THE OPUSPAY EXPERIENCE" title="Useful details, surfaced at the right moment." theme={theme} />
          <div className="mt-12 space-y-16 lg:space-y-24">
            <ProductStory theme={theme} title="Your balance, made easy to read" text="Available balance leads the wallet view, while a discreet visibility control lets you choose when it is shown." visual={<BalanceStory theme={theme} />} />
            <ProductStory reverse theme={theme} title="Send with a moment to review" text="A recipient check, amount validation, and final review keep the transfer flow focused on the information that matters." visual={<SendStory theme={theme} />} />
            <ProductStory theme={theme} title="Receive with one simple identifier" text="Your registered email is the wallet identifier you can copy and share with another OpusPay user." visual={<ReceiveStory theme={theme} />} />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <SectionTitle eyebrow="INTERACTIVE DEMO" title="See a transfer take shape before you sign in." subtitle="This is a simulated playground. It does not access your wallet, send money, or change any account data." theme={theme} />
        <div className={`mt-12 overflow-hidden rounded-3xl border ${theme === 'dark' ? 'border-white/10 bg-[#0b172a]' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/50'}`}>
          <div className={`flex overflow-x-auto border-b p-2 ${theme === 'dark' ? 'border-white/10 bg-white/2.5' : 'border-slate-100 bg-slate-50'}`}>
            {['Select recipient', 'Review transfer', 'Confirmation'].map((label, index) => <button key={label} onClick={() => setDemoStep(index)} className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${demoStep === index ? 'bg-cyan-400 text-slate-950 shadow-sm' : theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}><span className={`grid h-5 w-5 place-items-center rounded-full text-xs ${demoStep === index ? 'bg-slate-950/10' : 'bg-current/10'}`}>{index + 1}</span>{label}</button>)}
          </div>
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[.86fr_1.14fr]">
            <DemoControls amount={demoAmount} recipient={demoRecipient} setAmount={setDemoAmount} setRecipient={setDemoRecipient} step={demoStep} theme={theme} />
            <DemoPreview amount={usableAmount} onNext={nextDemoStep} onPrevious={previousDemoStep} recipient={selectedRecipient} step={demoStep} theme={theme} />
          </div>
        </div>
      </section>

      <section id="security" className={`scroll-mt-20 border-y py-20 ${theme === 'dark' ? 'border-white/10 bg-[#0a1729]' : 'border-slate-200 bg-cyan-50/55'}`}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8"><SectionTitle eyebrow="BUILT INTO THE PRODUCT" title="Thoughtful features behind every wallet action." theme={theme} /><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Feature theme={theme} icon={<Wallet />} title="Balance tracking" text="See the available balance returned by your wallet." /><Feature theme={theme} icon={<LockKeyhole />} title="Authenticated access" text="Wallet screens are available only to the signed-in account." /><Feature theme={theme} icon={<History />} title="Transaction history" text="Search, filter, inspect, and export your own wallet activity." /><Feature theme={theme} icon={<Zap />} title="Duplicate protection" text="Idempotency handling prevents a repeated completed transfer from creating another one." /><Feature theme={theme} icon={<ShieldCheck />} title="Atomic transfers" text="The transfer service uses database transactions for coordinated wallet updates." /><Feature theme={theme} icon={<Eye />} title="Balance privacy" text="Choose whether to show the wallet balance on the dashboard." /></div></div>
      </section>

      <section id="faq" className="scroll-mt-20 mx-auto max-w-4xl px-5 py-20 sm:px-8"><SectionTitle eyebrow="FAQ" title="A few helpful answers." theme={theme} /><div className={`mt-10 divide-y rounded-2xl border ${theme === 'dark' ? 'divide-white/10 border-white/10 bg-[#0c1829]' : 'divide-slate-200 border-slate-200 bg-white'}`}>{faqs.map(([question, answer], index) => <FaqItem key={question} answer={answer} isOpen={faqOpen === index} onToggle={() => setFaqOpen(faqOpen === index ? -1 : index)} question={question} theme={theme} />)}</div></section>

      <section id="reviews" className={`scroll-mt-20 border-y py-20 ${theme === 'dark' ? 'border-white/10 bg-white/2.5' : 'border-slate-200 bg-white/75'}`}><div className="mx-auto max-w-5xl px-5 text-center sm:px-8"><p className="text-sm font-semibold tracking-wide text-cyan-500">PRODUCT FEEDBACK</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">This product is still earning its first stories.</h2><p className={`mx-auto mt-5 max-w-2xl text-lg leading-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>No customer reviews, ratings, logos, or user counts are presented here. OpusPay welcomes thoughtful feedback as the product evolves.</p><a href="mailto:feedback@opuspay.local?subject=OpusPay%20product%20feedback" className="mt-8 inline-flex items-center gap-2 font-semibold text-cyan-500 hover:text-cyan-400">Share product feedback <ArrowRight size={17} /></a></div></section>

      <section className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8"><p className="text-sm font-semibold tracking-wide text-cyan-500">READY WHEN YOU ARE</p><h2 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">A wallet that respects your attention.</h2><p className={`mx-auto mt-5 max-w-xl text-lg leading-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Open OpusPay for a clearer view of your everyday wallet activity.</p><Link to={appDestination} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300">{isAuthenticated ? 'Open dashboard' : 'Get started'} <ArrowRight size={17} /></Link></section>

      <footer className={`border-t py-10 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-sm sm:px-8 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400 text-xs font-black text-slate-950">OP</span><span className="font-semibold">OpusPay</span></div><div className={`flex flex-wrap gap-x-5 gap-y-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{sections.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)} className="hover:text-cyan-500">{label}</button>)}<Link to={loginDestination} className="hover:text-cyan-500">{isAuthenticated ? 'Dashboard' : 'Login'}</Link></div><p className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>© {new Date().getFullYear()} OpusPay</p></div></footer>
    </main>
  );
};

const LandingNavbar = ({ activeSection, appDestination, loginDestination, menuOpen, onMenu, onNavigate, onTheme, theme }) => <nav className={`sticky top-0 z-40 border-b backdrop-blur-xl ${theme === 'dark' ? 'border-white/10 bg-[#07111f]/80' : 'border-slate-200 bg-[#f8fafc]/85'}`}><div className="mx-auto flex h-19 max-w-7xl items-center justify-between px-5 sm:px-8"><Link to="/" className="flex items-center gap-2.5" aria-label="OpusPay home"><span className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-600 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20">OP</span><span className="font-semibold tracking-tight">OpusPay</span></Link><div className="hidden items-center gap-6 lg:flex">{sections.map(([label, id]) => <button key={id} onClick={() => onNavigate(id)} className={`border-b-2 py-2 text-sm transition ${activeSection === id ? 'border-cyan-500 text-cyan-500' : `border-transparent ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}`}>{label}</button>)}</div><div className="hidden items-center gap-3 lg:flex"><button onClick={onTheme} aria-label="Toggle color theme" className={`grid h-10 w-10 place-items-center rounded-full border transition ${theme === 'dark' ? 'border-white/15 bg-white/5 text-amber-200 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button><Link to={loginDestination} className="px-2 py-2 text-sm font-medium hover:text-cyan-500">Log in</Link><Link to={appDestination} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Get started <ChevronRight size={16} /></Link></div><div className="flex items-center gap-2 lg:hidden"><button onClick={onTheme} aria-label="Toggle color theme" className="rounded-lg p-2">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><button onClick={onMenu} aria-label="Toggle navigation" className="rounded-lg p-2">{menuOpen ? <X /> : <Menu />}</button></div></div>{menuOpen && <div className={`border-t px-5 py-4 lg:hidden ${theme === 'dark' ? 'border-white/10 bg-[#07111f]' : 'border-slate-200 bg-white'}`}><div className="mx-auto flex max-w-7xl flex-col gap-1">{sections.map(([label, id]) => <button key={id} onClick={() => onNavigate(id)} className="rounded-lg px-3 py-2.5 text-left text-sm">{label}</button>)}<Link to={loginDestination} className="rounded-lg px-3 py-2.5 text-sm">Log in</Link><Link to={appDestination} className="rounded-lg bg-cyan-400 px-3 py-2.5 text-center text-sm font-semibold text-slate-950">Get started</Link></div></div>}</nav>;
const WalletPreview = ({ action, balanceVisible, onAction, onBalance, theme }) => <div className="relative"><div className={`absolute -inset-6 -z-10 rounded-[3rem] blur-3xl ${theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-200/65'}`} /><div className={`rounded-4xl border p-3 shadow-2xl ${theme === 'dark' ? 'border-white/15 bg-[#101c2f]/90 shadow-slate-950/40' : 'border-white bg-white/95 shadow-slate-300/60'}`}><div className={`rounded-[1.55rem] p-5 sm:p-7 ${theme === 'dark' ? 'bg-[#0b1628]' : 'bg-[#f4f8fc]'}`}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400 text-xs font-black text-slate-950">OP</span><span className="text-sm font-semibold">OpusPay</span></div><span className={`rounded-full px-2.5 py-1 text-xs ${theme === 'dark' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>Preview</span></div><div className="mt-7 rounded-2xl bg-linear-to-br from-cyan-400 to-blue-600 p-6 text-slate-950 shadow-lg shadow-cyan-500/15"><div className="flex items-center justify-between text-sm font-medium"><span>Available balance</span><button onClick={onBalance} aria-label={balanceVisible ? 'Hide demo balance' : 'Show demo balance'}>{balanceVisible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><div className="mt-7 text-3xl font-semibold tracking-tight">{balanceVisible ? 'Demo balance' : '••••••'}</div><div className="mt-1 text-sm text-slate-900/70">Sample preview only</div></div><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={() => onAction('send')} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${action === 'send' ? 'bg-cyan-400 text-slate-950' : theme === 'dark' ? 'bg-white text-slate-950' : 'bg-slate-900 text-white'}`}><Send size={16} />Send</button><button onClick={() => onAction('receive')} className={`rounded-xl border py-3 text-sm font-semibold transition ${action === 'receive' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-600' : theme === 'dark' ? 'border-white/15 text-white' : 'border-slate-200 text-slate-800'}`}>Receive</button></div><div className={`mt-6 border-t pt-5 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">{action === 'send' ? 'Ready to review a transfer' : 'Share your wallet email'}</p><p className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{action === 'send' ? 'Recipient details come first' : 'Use your registered address'}</p></div><ArrowUpRight size={18} className="text-cyan-500" /></div></div></div></div></div>;
const ProductStory = ({ reverse, text, theme, title, visual }) => <motion.article initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} className={`grid gap-10 lg:grid-cols-2 lg:items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}><div><h3 className="text-3xl font-semibold tracking-tight">{title}</h3><p className={`mt-4 max-w-xl text-lg leading-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p></div>{visual}</motion.article>;
const BalanceStory = ({ theme }) => <StoryFrame theme={theme}><p className="text-sm font-semibold">Wallet overview</p><div className="mt-5 rounded-2xl bg-cyan-400 p-6 text-slate-950"><p className="text-sm font-medium">Available balance</p><p className="mt-7 text-3xl font-semibold">••••••</p><p className="mt-1 text-sm text-slate-900/70">Visibility is your choice</p></div><div className="mt-4 grid grid-cols-2 gap-3"><SmallTile label="Received" theme={theme} /><SmallTile label="Sent" theme={theme} /></div></StoryFrame>;
const SendStory = ({ theme }) => <StoryFrame theme={theme}><div className="flex items-center justify-between"><p className="text-sm font-semibold">Review transfer</p><CircleCheck className="text-cyan-500" size={20} /></div><div className={`mt-5 space-y-4 rounded-2xl p-5 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}><Line label="Recipient" value="Verified wallet email" theme={theme} /><Line label="Amount" value="Reviewed before confirm" theme={theme} /><Line label="Description" value="Optional note" theme={theme} /></div><div className="mt-4 rounded-xl bg-cyan-400 px-4 py-3 text-center text-sm font-semibold text-slate-950">Confirm only when ready</div></StoryFrame>;
const ReceiveStory = ({ theme }) => <StoryFrame theme={theme}><p className="text-sm font-semibold">Receive money</p><p className={`mt-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Your wallet identifier</p><div className={`mt-5 flex items-center justify-between rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}><span className="text-sm">your-email@domain.com</span><Copy size={17} className="text-cyan-500" /></div><div className="mt-7 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-500"><UserRound size={19} /></span><p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Share this address with another registered OpusPay user.</p></div></StoryFrame>;
const StoryFrame = ({ children, theme }) => <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl ${theme === 'dark' ? 'border-white/10 bg-[#0b172a] shadow-slate-950/20' : 'border-slate-200 bg-white shadow-slate-200/60'}`}><div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/15 blur-2xl" />{children}</div>;
const SmallTile = ({ label, theme }) => <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}><p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p><p className="mt-2 text-sm font-semibold">Wallet activity</p></div>;
const Line = ({ label, theme, value }) => <div className="flex items-center justify-between gap-4"><span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span><span className="text-right text-sm font-medium">{value}</span></div>;
const DemoControls = ({ amount, recipient, setAmount, setRecipient, step, theme }) => <div><p className="text-sm font-semibold text-cyan-500">DEMO INPUTS</p><h3 className="mt-2 text-2xl font-semibold">Try the flow.</h3><p className={`mt-3 text-sm leading-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{step === 0 ? 'Choose a demo recipient and sample amount.' : step === 1 ? 'Review the same demo details before confirming.' : 'The simulation shows a completed demo only.'}</p><label className="mt-7 block text-sm font-medium">Demo recipient<select value={recipient} onChange={(event) => setRecipient(event.target.value)} disabled={step > 0} className={`mt-2 w-full rounded-xl border px-3 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-70 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>{recipients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.email}</option>)}</select></label><label className="mt-5 block text-sm font-medium">Sample amount<input type="number" min="1" max="99999" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={step > 0} className={`mt-2 w-full rounded-xl border px-3 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-70 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`} /></label><p className={`mt-4 rounded-xl border p-3 text-xs leading-5 ${theme === 'dark' ? 'border-amber-300/15 bg-amber-300/5 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>Demo only. Nothing on this page is submitted to OpusPay.</p></div>;
const DemoPreview = ({ amount, onNext, onPrevious, recipient, step, theme }) => <div className={`rounded-2xl border p-6 ${theme === 'dark' ? 'border-white/10 bg-white/[.035]' : 'border-slate-100 bg-slate-50'}`}><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${theme === 'dark' ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-100 text-cyan-800'}`}>SIMULATED PREVIEW</span><span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Step {step + 1} of 3</span></div>{step === 0 && <div className="mt-8"><p className="text-sm text-slate-500">Selected recipient</p><p className="mt-2 text-xl font-semibold">{recipient.name}</p><p className={`mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{recipient.email}</p><div className={`mt-6 rounded-xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}><p className="text-sm text-slate-500">Sample amount</p><p className="mt-2 text-2xl font-semibold">₹{amount.toFixed(2)}</p></div></div>}{step === 1 && <div className="mt-8 space-y-5"><p className="text-lg font-semibold">Check the details</p><Line label="To" value={recipient.name} theme={theme} /><Line label="Email" value={recipient.email} theme={theme} /><Line label="Amount" value={`₹${amount.toFixed(2)}`} theme={theme} /><Line label="Status" value="Ready for demo confirmation" theme={theme} /></div>}{step === 2 && <div className="mt-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 text-emerald-500"><CircleCheck size={30} /></span><h4 className="mt-4 text-xl font-semibold">Demo complete</h4><p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>A simulated transfer of ₹{amount.toFixed(2)} to {recipient.name} is ready for display only. No money moved.</p></div>}<div className="mt-9 flex justify-between gap-3"><button onClick={onPrevious} disabled={step === 0} className="inline-flex items-center gap-1 rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-35"><ChevronLeft size={16} />Back</button><button onClick={onNext} disabled={step === 2} className="inline-flex items-center gap-1 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-35">{step === 1 ? 'Confirm demo' : 'Continue'} <ChevronRight size={16} /></button></div></div>;
const Feature = ({ icon, text, theme, title }) => <motion.article initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} whileHover={{ y: -4 }} className={`rounded-2xl border p-5 transition ${theme === 'dark' ? 'border-white/10 bg-[#0c1829] hover:bg-white/4.5' : 'border-slate-200 bg-white hover:shadow-lg hover:shadow-slate-200/60'}`}><span className="text-cyan-500">{icon}</span><h3 className="mt-4 font-semibold">{title}</h3><p className={`mt-2 text-sm leading-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{text}</p></motion.article>;
const FaqItem = ({ answer, isOpen, onToggle, question, theme }) => <div><button onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left font-semibold sm:px-6"><span>{question}</span><ChevronDown size={18} className={`shrink-0 transition ${isOpen ? 'rotate-180 text-cyan-500' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} /></button>{isOpen && <div className={`px-5 pb-5 text-sm leading-7 sm:px-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{answer}</div>}</div>;
const SectionTitle = ({ eyebrow, subtitle, theme, title }) => <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={reveal} className="max-w-2xl"><p className="text-sm font-semibold tracking-wide text-cyan-500">{eyebrow}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>{subtitle && <p className={`mt-4 text-lg leading-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{subtitle}</p>}</motion.div>;
const Decor = ({ theme }) => <div className="pointer-events-none absolute inset-x-0 top-0 h-168 overflow-hidden"><div className={`absolute left-[8%] -top-72 h-152 w-152 rounded-full blur-3xl ${theme === 'dark' ? 'bg-cyan-500/15' : 'bg-cyan-300/35'}`} /><div className={`absolute -right-40 top-12 h-128 w-lg rounded-full blur-3xl ${theme === 'dark' ? 'bg-indigo-500/15' : 'bg-violet-300/30'}`} /></div>;

export default Landing;

