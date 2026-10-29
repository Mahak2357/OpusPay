import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Wallet, ArrowLeftRight, History, LogOut, Settings, ChevronRight, Moon, Sun } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Overview', path: '/dashboard', icon: Wallet },
    { label: 'Send Funds', path: '/transfer', icon: ArrowLeftRight },
    { label: 'Activity', path: '/transactions', icon: History },
    { label: 'Profile', path: '/profile', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b theme-border bg-[var(--app-bg)]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 p-[1px] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#06080F] rounded-[11px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 tracking-wider text-sm">
                OP
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-tight text-lg leading-tight flex items-center gap-1.5">
              OpusPay
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PRO
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">Enterprise Vault</span>
          </div>
        </Link>

        {/* Dynamic Center Navigation for Logged-In State */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-[#0B101D]/90 p-1.5 rounded-2xl border border-white/[0.06]">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-white border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Action Profile / Gate */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} aria-label="Toggle color theme" className="grid h-9 w-9 place-items-center rounded-lg border theme-border theme-subtle transition hover:text-cyan-500">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
                <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{user?.email}</span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 border border-white/[0.08] transition duration-200"
                title="Disconnect Vault"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-95 px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
              >
                Open Account
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;