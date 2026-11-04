import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { roleConfig, formatDate } from '../../utils';
import { User, Mail, Shield, Building, Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const roleConf = roleConfig[user.role];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review institutional identity, role permissions, and active credentials.
        </p>
      </div>

      <Card className="p-6 border border-slate-200 divide-y divide-slate-100 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-indigo-100">
            {user.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={user.role === 'ADMIN' ? 'purple' : user.role === 'FACULTY' ? 'indigo' : 'emerald'}
                size="sm"
              >
                {roleConf.label}
              </Badge>
              <span className="text-xs text-slate-500">{user.department || 'General Academic'}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 block uppercase font-bold tracking-wider text-[10px]">
                Email Address
              </span>
              <span className="font-semibold text-slate-800 text-sm">{user.email}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Shield className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 block uppercase font-bold tracking-wider text-[10px]">
                Role Authority
              </span>
              <span className="font-semibold text-slate-800 text-sm">{user.role}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Building className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 block uppercase font-bold tracking-wider text-[10px]">
                Academic Department
              </span>
              <span className="font-semibold text-slate-800 text-sm">{user.department || 'Unassigned'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 block uppercase font-bold tracking-wider text-[10px]">
                Registered Date
              </span>
              <span className="font-semibold text-slate-800 text-sm">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Security & Sign Out */}
        <div className="pt-6 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Session Security</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Authenticated via HTTP-only secure cookie session.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            icon={<LogOut className="w-4 h-4" />}
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};

