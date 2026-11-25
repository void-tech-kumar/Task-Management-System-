import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AlertCircle, Info } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100/80 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-[#4F46E5] text-white items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-200 mb-4">
          TF
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
          TaskFlow Portal
        </h2>
        <p className="mt-1 text-sm text-[#475569]">
          Academic Task Management & Evaluation Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-300/40 rounded-2xl border border-[#CBD5E1] sm:px-10">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-300 p-3 flex items-start gap-2.5 text-xs text-red-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
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
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 rounded-lg bg-blue-50/70 border border-blue-200 p-3 text-xs text-[#0F172A] flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span className="font-medium">Contact your administrator for account access</span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 text-center text-xs text-[#475569]">
            TaskFlow Academic Task Management System • Role-Based Authentication
          </div>
        </div>
      </div>
    </div>
  );
};
