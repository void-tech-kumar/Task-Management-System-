import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Layers, ShieldCheck, GraduationCap, UserCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('robert.miller@taskflow.edu');
  const [password, setPassword] = useState('Faculty@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
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
                onClick={() => handleQuickDemo('alex.chen@taskflow.edu', 'Student@123')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-center group"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">Student</span>
                <span className="text-[10px] text-slate-400">Tasks & Kanban</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <Input
              label="Institutional Email"
              type="email"
              required
              autoComplete="email"
              placeholder="faculty@taskflow.edu"
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
                Sign In to TaskFlow
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            TaskFlow Academic Task Management System • Role-Based Authentication
          </div>
        </div>
      </div>
    </div>
  );
};

