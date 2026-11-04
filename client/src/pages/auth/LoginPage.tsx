import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authApi } from '../../services/api';
import {
  ShieldCheck,
  GraduationCap,
  UserCheck,
  AlertCircle,
  Mail,
  KeyRound,
  UserPlus,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Info,
} from 'lucide-react';

type AuthMode = 'password' | 'email_otp' | 'student_signup';

export const LoginPage: React.FC = () => {
  const { login, setUserDirect } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('password');

  // Password Login state
  const [email, setEmail] = useState('robert.miller@taskflow.edu');
  const [password, setPassword] = useState('Faculty@123');

  // Student Signup state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [department, setDepartment] = useState('Computer Science');

  // OTP Verification state
  const [otpStep, setOtpStep] = useState<'input_info' | 'enter_otp'>('input_info');
  const [otpCode, setOtpCode] = useState('');
  const [activeEmail, setActiveEmail] = useState('');
  const [activePurpose, setActivePurpose] = useState<'STUDENT_SIGNUP' | 'LOGIN'>('LOGIN');

  // Cooldown & Status
  const [cooldown, setCooldown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer for resend cooldown
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  /* ==================== 1. PASSWORD LOGIN ==================== */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      resetMessages();
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    resetMessages();
  };

  /* ==================== 2. EMAIL OTP LOGIN ==================== */
  const handleOtpLoginInit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your institutional email address.');
      return;
    }

    try {
      setLoading(true);
      resetMessages();
      const res = await authApi.loginOtpInit({ email });
      setActiveEmail(email);
      setActivePurpose('LOGIN');
      setOtpStep('enter_otp');
      setCooldown(60);
      setSuccessMsg(res.data.message || 'A 6-digit verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to request verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      resetMessages();
      const res = await authApi.loginOtpVerify({ email: activeEmail, otp: otpCode });
      setUserDirect(res.data.data.user);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  /* ==================== 3. STUDENT REGISTRATION ==================== */
  const handleStudentSignupInit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !fullName) {
      setError('Please fill in all required registration fields.');
      return;
    }

    try {
      setLoading(true);
      resetMessages();
      const res = await authApi.signupInit({
        email: signupEmail,
        password: signupPassword,
        fullName,
        department,
      });
      setActiveEmail(signupEmail);
      setActivePurpose('STUDENT_SIGNUP');
      setOtpStep('enter_otp');
      setCooldown(60);
      setSuccessMsg(res.data.message || 'Verification code sent! Please verify your email to activate.');
    } catch (err: any) {
      setError(err.message || 'Student registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignupVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      resetMessages();
      const res = await authApi.signupVerify({ email: activeEmail, otp: otpCode });
      setUserDirect(res.data.data.user);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check code or try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ==================== 4. RESEND OTP ==================== */
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    try {
      setLoading(true);
      resetMessages();
      const res = await authApi.resendOtp({ email: activeEmail, purpose: activePurpose });
      setCooldown(60);
      setSuccessMsg(res.data.message || 'New verification code has been dispatched.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-200 mb-4">
          TF
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          TaskFlow Portal
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Academic Task Management & Evaluation Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          
          {/* Navigation Mode Tabs */}
          <div className="flex border-b border-slate-200 mb-6 pb-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('password');
                setOtpStep('input_info');
                resetMessages();
              }}
              className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                mode === 'password'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Password
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('email_otp');
                setOtpStep('input_info');
                resetMessages();
              }}
              className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                mode === 'email_otp'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('student_signup');
                setOtpStep('input_info');
                resetMessages();
              }}
              className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                mode === 'student_signup'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Student Signup
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2.5 text-xs text-emerald-700 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* MODE 1: PASSWORD LOGIN */}
          {mode === 'password' && (
            <div>
              {/* Quick Demo Selector */}
              <div className="mb-6 rounded-xl bg-slate-50 p-3.5 border border-slate-200/70">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Demo Role (One-Click Auto Fill):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin@taskflow.edu', 'Admin@123')}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-center group"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800">Admin</span>
                    <span className="text-[10px] text-slate-400">Governance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('robert.miller@taskflow.edu', 'Faculty@123')}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-center group"
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800">Faculty</span>
                    <span className="text-[10px] text-slate-400">Projects & Grading</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('emily.davis@taskflow.edu', 'Student@123')}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-center group"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800">Student</span>
                    <span className="text-[10px] text-slate-400">Tasks & Kanban</span>
                  </button>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <Input
                  label="Institutional Email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="user@taskflow.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={loading}
                  >
                    Sign In with Password
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: EMAIL OTP LOGIN */}
          {mode === 'email_otp' && (
            <div>
              {otpStep === 'input_info' ? (
                <form className="space-y-4" onSubmit={handleOtpLoginInit}>
                  <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-3 text-xs text-indigo-800 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Enter your registered institutional email. We will send a secure 6-digit login code valid for 5 minutes.</span>
                  </div>

                  <Input
                    label="Registered Institutional Email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="student@taskflow.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full"
                      isLoading={loading}
                    >
                      Send 6-Digit Login Code
                    </Button>
                  </div>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleOtpLoginVerify}>
                  <div className="text-center mb-2">
                    <p className="text-xs text-slate-500">
                      Code sent to <span className="font-semibold text-slate-800">{activeEmail}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                      autoFocus
                      placeholder="••••••"
                      className="w-full text-center text-2xl tracking-[10px] font-mono py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full"
                      isLoading={loading}
                    >
                      Verify & Sign In
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('input_info');
                          setOtpCode('');
                          resetMessages();
                        }}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={cooldown > 0 || loading}
                        className={`inline-flex items-center gap-1 font-semibold ${
                          cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:underline'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 3: STUDENT REGISTRATION */}
          {mode === 'student_signup' && (
            <div>
              {otpStep === 'input_info' ? (
                <form className="space-y-3" onSubmit={handleStudentSignupInit}>
                  <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-2.5 text-xs text-emerald-800 flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Students can self-register. Faculty and Admin accounts are provisioned by Academic Administration.</span>
                  </div>

                  <Input
                    label="Full Name"
                    type="text"
                    required
                    placeholder="e.g. Alex Chen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />

                  <Input
                    label="College Email"
                    type="email"
                    required
                    placeholder="student@taskflow.edu"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department
                    </label>
                    <select
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Data Science">Data Science</option>
                    </select>
                  </div>

                  <Input
                    label="Create Password"
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full"
                      isLoading={loading}
                    >
                      Send Verification Code
                    </Button>
                  </div>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleStudentSignupVerify}>
                  <div className="text-center mb-2">
                    <p className="text-xs text-slate-500">
                      Enter the 6-digit verification code sent to <span className="font-semibold text-slate-800">{activeEmail}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                      autoFocus
                      placeholder="••••••"
                      className="w-full text-center text-2xl tracking-[10px] font-mono py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full"
                      isLoading={loading}
                    >
                      Verify & Activate Account
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('input_info');
                          setOtpCode('');
                          resetMessages();
                        }}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={cooldown > 0 || loading}
                        className={`inline-flex items-center gap-1 font-semibold ${
                          cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:underline'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            TaskFlow Academic Task Management System • Role-Based Authentication
          </div>
        </div>
      </div>
    </div>
  );
};
