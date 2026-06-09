import { Link, useLocation } from 'react-router-dom';
import { PenTool, History, LayoutDashboard, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSignInClick, onSignOut }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const formatUserEmail = (email) => {
    if (!email) return '';
    const name = email.split('@')[0];
    return name.length > 12 ? `${name.slice(0, 10)}...` : name;
  };

  const handleSignOut = async () => {
    await signOut();
    if (onSignOut) onSignOut();
  };

  const navLinks = [
    { to: '/', label: 'Write Essay', icon: PenTool },
    { to: '/history', label: 'History', icon: History },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#1C1917]/75 border-b border-[#44403C]/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-lg transition-all duration-300">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-3 no-underline shrink-0">
        <div className="p-2.5 bg-[#CA8A04]/10 border border-[#CA8A04]/30 rounded-xl shadow-lg shadow-yellow-600/10 text-[#CA8A04]">
          <PenTool className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xl font-bold bg-gradient-to-r from-[#FAFAF9] via-[#FAFAF9] to-[#CA8A04] bg-clip-text text-transparent tracking-tight leading-tight">
            IELTS Writing Grader
          </div>
          <p className="text-xs text-[#CA8A04]/80 font-medium tracking-wide">
            Automated AI Band Scoring &amp; Detailed Feedback
          </p>
        </div>
      </Link>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Model badge */}
        <span className="hidden lg:inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-[#44403C]/30 border border-[#44403C]/50 rounded-full text-slate-300">
          Model: Gemini 1.5 Flash
        </span>

        {/* Nav Links */}
        {navLinks.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer no-underline ${
              isActive(to)
                ? 'bg-[#CA8A04]/15 border-[#CA8A04]/40 text-[#CA8A04] shadow-[0_0_8px_rgba(202,138,4,0.15)]'
                : 'bg-white/5 hover:bg-[#CA8A04]/10 border-[#44403C] text-slate-300 hover:text-[#CA8A04] hover:border-[#CA8A04]/30'
            }`}
          >
            <Icon className="h-3.5 w-3.5 text-[#CA8A04] shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}

        {/* Auth Section */}
        {user ? (
          <div className="flex items-center gap-2 bg-[#44403C]/20 border border-[#44403C]/50 rounded-xl p-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 font-medium">
              <User className="h-3.5 w-3.5 text-[#CA8A04] shrink-0" />
              <span className="hidden md:inline">Hi, {formatUserEmail(user.email)}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#44403C]/50 hover:bg-[#CA8A04]/20 border border-transparent hover:border-[#CA8A04]/30 rounded-lg text-xs font-semibold text-slate-300 hover:text-[#CA8A04] transition-all duration-300 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onSignInClick}
            className="px-4 py-2.5 bg-[#CA8A04] hover:bg-[#CA8A04]/90 text-[#0C0A09] rounded-xl text-xs font-bold transition-all duration-300 shadow-md shadow-yellow-600/10 hover:shadow-[#CA8A04]/35 hover:-translate-y-0.5 cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
