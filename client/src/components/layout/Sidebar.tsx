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
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-blue-950 bg-[#172554] text-slate-100 shadow-lg transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-blue-900/80 lg:hidden">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-300" />
            <span className="font-bold text-white text-base">TaskFlow</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Navigation"
            className="rounded-lg p-1.5 text-blue-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200/80">
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
                      ? 'bg-[#4F46E5]/35 text-white font-semibold border border-indigo-400/40 shadow-sm'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? 'text-indigo-200' : 'text-blue-200 group-hover:text-white'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#DC2626] px-1.5 text-[11px] font-bold text-white">
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
        <div className="p-4 border-t border-blue-900/80 bg-blue-950/50">
          <div className="rounded-xl bg-blue-950/80 p-3 border border-blue-800/70">
            <p className="text-xs font-semibold text-white">TaskFlow Academic</p>
            <p className="text-[11px] text-blue-200 mt-0.5">
              Role: <span className="font-semibold text-indigo-300 capitalize">{user.role.toLowerCase()}</span>
            </p>
            <div className="mt-2 pt-2 border-t border-blue-900 flex items-center justify-between text-[11px] text-blue-200/80">
              <span>v1.0.0</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#16A34A]" title="Connected" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

