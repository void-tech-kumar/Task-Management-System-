import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Bell, CheckCheck, Clock, Calendar, MessageSquare, Award } from 'lucide-react';
import { formatDateTime } from '../../utils';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEADLINE_APPROACHING':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'TASK_ASSIGNED':
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      case 'SUBMISSION_EVALUATED':
        return <Award className="w-5 h-5 text-emerald-500" />;
      case 'COMMENT_POSTED':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Notifications Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deadlines alerts, course enrollments, evaluation remarks, and comment threads.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            icon={<CheckCheck className="w-4 h-4" />}
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title="No notifications"
          description="You are completely up to date. Alerts and deadline warnings will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => {
                if (!n.isRead) markAsRead(n.id);
                if (n.referenceUrl) navigate(n.referenceUrl);
              }}
              className={`p-4 transition-all cursor-pointer flex items-start justify-between gap-4 border ${
                !n.isRead
                  ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-2">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(n.id);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold shrink-0"
                >
                  Mark read
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

