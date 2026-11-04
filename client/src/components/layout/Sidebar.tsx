import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  GraduationCap,
  FileCheck2,
  Users,
  Bell,
  UserCircle,
  X,
  Layers,
} from 'lucide-react';
import { cn } from '../../utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  const navItems = [
    {
      label: 'Dashboard',
      to: '/app/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'FACULTY', 'STUDENT'],
    },
    {
      label: 'Projects',
      to: '/app/projects',
      icon: FolderKanban,
      roles: ['ADMIN', 'FACULTY', 'STUDENT'],
    },
    {
      label: 'Tasks & Kanban',
      to: '/app/tasks',
      icon: CheckSquare,
      roles: ['ADMIN', 'FACULTY', 'STUDENT'],
    },
    {
      label: 'Grading Portal',
      to: '/app/evaluations',
      icon: GraduationCap,
      roles: ['ADMIN', 'FACULTY'],
    },
    {
      label: 'My Submissions',
      to: '/app/my-submissions',
      icon: FileCheck2,
      roles: ['STUDENT'],
    },
    {
      label: 'User Directory',
      to: '/app/admin/users',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      label: 'Notifications',
      to: '/app/notifications',
      icon: Bell,
      roles: ['ADMIN', 'FACULTY', 'STUDENT'],
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: 'My Profile',
      to: '/app/profile',
      icon: UserCircle,
      roles: ['ADMIN', 'FACULTY', 'STUDENT'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900 text-base">TaskFlow</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspace Menu
            </p>
          </div>

          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Info Box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="rounded-xl bg-white p-3 border border-slate-200/60 shadow-xs">
            <p className="text-xs font-semibold text-slate-900">TaskFlow Academic</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Role: <span className="font-medium text-indigo-600 capitalize">{user.role.toLowerCase()}</span></p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>v1.0.0</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

