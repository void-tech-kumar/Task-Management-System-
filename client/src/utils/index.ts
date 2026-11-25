import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Priority, TaskStatus, TaskCategory, Role, SubmissionStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'No date set';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getDueStatus(dueDateString: string, isCompleted: boolean) {
  if (isCompleted) {
    return { label: 'Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }

  const now = new Date().getTime();
  const due = new Date(dueDateString).getTime();
  const diffHours = Math.round((due - now) / (1000 * 60 * 60));

  if (diffHours < 0) {
    return {
      label: `Overdue by ${Math.abs(Math.round(diffHours / 24))}d`,
      color: 'text-red-700 bg-red-50 border-red-300 font-semibold',
      isOverdue: true,
    };
  } else if (diffHours <= 24) {
    return {
      label: `Due in ${diffHours}h`,
      color: 'text-amber-800 bg-amber-50 border-amber-300 font-medium',
      isUrgent: true,
    };
  } else if (diffHours <= 72) {
    return {
      label: `Due in ${Math.round(diffHours / 24)}d`,
      color: 'text-orange-800 bg-orange-50 border-orange-300',
    };
  } else {
    return {
      label: `Due ${formatDate(dueDateString)}`,
      color: 'text-[#475569] bg-slate-100 border-[#CBD5E1]',
    };
  }
}

export const priorityConfig: Record<Priority, { label: string; badge: string }> = {
  LOW: { label: 'Low', badge: 'bg-slate-100 text-slate-800 border-slate-300' },
  MEDIUM: { label: 'Medium', badge: 'bg-blue-50 text-blue-800 border-blue-300' },
  HIGH: { label: 'High', badge: 'bg-amber-50 text-amber-800 border-amber-300' },
  URGENT: { label: 'Urgent', badge: 'bg-red-50 text-red-800 border-red-300 font-semibold' },
};

export const statusConfig: Record<TaskStatus, { label: string; badge: string; color: string }> = {
  TODO: { label: 'To Do', badge: 'bg-slate-100 text-slate-800 border-slate-300', color: '#475569' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-blue-50 text-blue-800 border-blue-300', color: '#2563EB' },
  IN_REVIEW: { label: 'In Review', badge: 'bg-amber-50 text-amber-800 border-amber-300', color: '#D97706' },
  COMPLETED: { label: 'Completed', badge: 'bg-green-50 text-green-800 border-green-300', color: '#16A34A' },
};

export const categoryConfig: Record<TaskCategory, { label: string; badge: string }> = {
  ASSIGNMENT: { label: 'Assignment', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  LAB_WORK: { label: 'Lab Work', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  PROJECT_MILESTONE: { label: 'Milestone', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  READING: { label: 'Reading', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  PERSONAL: { label: 'Personal', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const roleConfig: Record<Role, { label: string; badge: string }> = {
  ADMIN: { label: 'Admin', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
  FACULTY: { label: 'Faculty', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  STUDENT: { label: 'Student', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

export const submissionStatusConfig: Record<SubmissionStatus, { label: string; badge: string }> = {
  PENDING: { label: 'Pending', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  SUBMITTED: { label: 'Submitted (Pending Review)', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  EVALUATED: { label: 'Evaluated', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RESUBMIT_REQUESTED: { label: 'Resubmit Requested', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

