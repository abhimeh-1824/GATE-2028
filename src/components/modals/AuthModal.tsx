import React, { useState, useEffect } from 'react';
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
  Database,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { AuthUser } from '../../types';
import { supabase } from '../../lib/supabase';

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

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'switch' | 'forgot'>(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setErrorMessage(null);
      setSuccessNotice(null);
    }
  }, [defaultTab, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const sanitizeError = (err: string) => {
    const lower = err.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('429') || lower.includes('too many requests')) {
      return 'Rate limit exceeded on authentication requests. Please wait a moment or click "Instant Demo Access" below.';
    }
    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return 'Incorrect email or password. Please verify your details.';
    }
    if (lower.includes('user already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    return err;
  };

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
      }, 800);
    } else {
      setErrorMessage(sanitizeError(res.error || 'Invalid credentials or login failed.'));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) return;

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    const res = await register(
      email.trim(),
      password,
      fullName.trim(),
      targetAir,
      targetCollege
    );
    setIsLoading(false);

    if (res.success) {
      if (res.needsEmailConfirmation) {
        setSuccessNotice(
          'Account created! Confirmation email sent. You can start studying immediately; verify your email at your convenience.'
        );
      } else {
        setSuccessNotice('Account created successfully! Initializing workspace with clean zero metrics.');
      }
      setTimeout(() => {
        onClose();
        setSuccessNotice(null);
      }, 1200);
    } else {
      setErrorMessage(sanitizeError(res.error || 'Registration failed.'));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address to receive password reset instructions.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      setIsLoading(false);
      if (error) {
        setErrorMessage(sanitizeError(error.message));
      } else {
        setSuccessNotice(`Password reset instructions sent to ${email.trim()}. Check your inbox.`);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(sanitizeError(err?.message || 'Failed to send password reset request.'));
    }
  };

  const handleQuickSwitch = (targetUser: AuthUser) => {
    switchUser(targetUser.id);
    setSuccessNotice(`Switched active profile to ${targetUser.fullName}`);
    setTimeout(() => {
      onClose();
      setSuccessNotice(null);
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-slate-50 via-white to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              DA
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-bold text-slate-900 leading-tight">
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
            aria-label="Close authentication modal"
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
            <span>Register (Clean 0%)</span>
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
              <span>Switch ({allUsers.length})</span>
            </button>
          )}

          {activeTab === 'forgot' && (
            <button
              className="pb-2.5 px-3 text-xs font-semibold border-b-2 border-indigo-700 text-indigo-700 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset Password</span>
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
              <label htmlFor="login-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="login-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="login-password-input" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('forgot');
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password-input"
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
                className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full py-2 border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
          <form onSubmit={handleRegister} className="p-5 space-y-3 overflow-y-auto">
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 leading-snug">
              <strong>Clean Slate Architecture:</strong> Every new user starts with <strong>0%</strong> syllabus coverage, <strong>0 hours</strong> logged, and empty tasks under your distinct account.
            </div>

            <div>
              <label htmlFor="reg-fullname-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  id="reg-fullname-input"
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
              <label htmlFor="reg-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  id="reg-email-input"
                  type="email"
                  required
                  placeholder="aspirant@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Password * (min 6 characters)
              </label>
              <div className="relative">
                <input
                  id="reg-password-input"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="reg-targetair-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Target AIR
                </label>
                <div className="relative">
                  <input
                    id="reg-targetair-input"
                    type="number"
                    min={1}
                    max={1000}
                    value={targetAir}
                    onChange={(e) => setTargetAir(parseInt(e.target.value) || 1)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
                  />
                  <Target className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-targetcollege-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Destination
                </label>
                <div className="relative">
                  <input
                    id="reg-targetcollege-input"
                    type="text"
                    value={targetCollege}
                    onChange={(e) => setTargetCollege(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden truncate"
                  />
                  <Award className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create My Study Workspace (0%)</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-500 pt-1">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-indigo-700 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* Tab 3: Forgot Password / Reset */}
        {activeTab === 'forgot' && (
          <form onSubmit={handleResetPassword} className="p-5 space-y-3.5">
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 leading-snug">
              Enter your registered email address to receive password reset instructions.
            </div>

            <div>
              <label htmlFor="forgot-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  id="forgot-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-600 outline-hidden font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Sending reset link...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Password Reset Instructions</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Multiple Users Switcher */}
        {activeTab === 'switch' && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-600">
              Select any registered account to switch sessions. Each user maintains their own independent progress, tasks, and syllabus completion rate:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSwitch(u)}
                    aria-label={`Switch to user ${u.fullName}`}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
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
                  </button>
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
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
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
