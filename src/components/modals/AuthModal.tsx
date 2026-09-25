import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Target,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { AuthUser } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register' | 'switch';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
}) => {
  const { currentUser, allUsers, login, register, switchUser, logout, loginAsDemo } = useStudy();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'switch'>(defaultTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetAir, setTargetAir] = useState(1);
  const [targetCollege, setTargetCollege] = useState('IISc Bangalore (M.Tech AI)');

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      setSuccessNotice('Signed in successfully!');
      setTimeout(() => {
        onClose();
        setSuccessNotice(null);
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Invalid credentials or login failed.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) return;

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    const res = await register(
      email.trim(),
      password,
      fullName.trim(),
      Number(targetAir) || 1,
      targetCollege.trim() || 'IISc Bangalore (M.Tech AI)'
    );
    setIsLoading(false);

    if (res.success) {
      if (res.needsEmailConfirmation) {
        setSuccessNotice(
          'Account created! A confirmation email has been sent. You can start studying right away.'
        );
      } else {
        setSuccessNotice('Account created successfully! Starting your campaign from 0%.');
      }
      setTimeout(() => {
        onClose();
        setSuccessNotice(null);
      }, 1500);
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  const handleQuickSwitch = (u: AuthUser) => {
    switchUser(u.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-[#faf8ff] border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                GATE DA Aspirant Portal
              </h2>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Supabase Cloud Sync</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-4 pt-2">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'login'
                ? 'border-indigo-700 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'border-indigo-700 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register (Start from 0)</span>
          </button>

          {allUsers.length > 0 && (
            <button
              onClick={() => {
                setActiveTab('switch');
                setErrorMessage(null);
              }}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'switch'
                  ? 'border-indigo-700 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Switch User ({allUsers.length})</span>
            </button>
          )}
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="leading-snug">{successNotice}</span>
          </div>
        )}

        {/* Tab 1: Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="p-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="aspirant@iisc.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Study Tracker</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  loginAsDemo();
                  onClose();
                }}
                className="w-full py-2 border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Instant Demo Access (No Password Required)</span>
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-500 pt-1">
              New aspirant?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-indigo-700 font-semibold hover:underline"
              >
                Create an account to start from 0%
              </button>
            </p>
          </form>
        )}

        {/* Tab 2: Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="p-5 space-y-3">
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 leading-snug">
              <strong>Clean Slate Architecture:</strong> Every new user starts with <strong>0%</strong> syllabus coverage, <strong>0 hours</strong> logged, and empty tasks. Your progress will be saved under your distinct account.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. abhishek@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password (min 6 characters) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target AIR Rank
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={targetAir}
                    onChange={(e) => setTargetAir(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
                  />
                  <Target className="w-3.5 h-3.5 text-indigo-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dream Program
                </label>
                <input
                  type="text"
                  value={targetCollege}
                  onChange={(e) => setTargetCollege(e.target.value)}
                  placeholder="IISc M.Tech AI"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden truncate"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account & Start at 0%</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Multiple Users Switcher */}
        {activeTab === 'switch' && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-600">
              Select any registered account to switch sessions. Each user maintains their own independent progress, tasks, and syllabus completion rate:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;

                return (
                  <div
                    key={u.id}
                    onClick={() => handleQuickSwitch(u)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-indigo-50/60 border-indigo-400 ring-1 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {u.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100/60 px-1.5 py-0.5 rounded">
                        AIR #{u.targetAir}
                      </span>
                      {isCurrent && (
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {currentUser && (
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">Currently signed in</span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
