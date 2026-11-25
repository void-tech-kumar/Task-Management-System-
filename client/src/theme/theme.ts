import { TaskStatus } from '../types';

/**
 * Centralized TaskFlow colour palette & semantic tokens.
 */
export const THEME_COLORS = {
  primary: '#4F46E5',
  secondary: '#2563EB',
  appBg: '#F1F5F9',
  cardBg: '#FFFFFF',
  sidebarBg: '#172554',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#CBD5E1',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
} as const;

export const STAT_CARD_THEMES = {
  projects: {
    card: 'bg-blue-50/90 border-blue-200/90 shadow-sm',
    iconWrap: 'bg-blue-100 text-[#2563EB]',
    value: 'text-[#0F172A]',
  },
  tasks: {
    card: 'bg-purple-50/90 border-purple-200/90 shadow-sm',
    iconWrap: 'bg-purple-100 text-purple-700',
    value: 'text-[#0F172A]',
  },
  completed: {
    card: 'bg-green-50/90 border-green-200/90 shadow-sm',
    iconWrap: 'bg-green-100 text-[#16A34A]',
    value: 'text-[#0F172A]',
  },
  pending: {
    card: 'bg-amber-50/90 border-amber-200/90 shadow-sm',
    iconWrap: 'bg-amber-100 text-[#D97706]',
    value: 'text-amber-800',
  },
  overdue: {
    card: 'bg-red-50/90 border-red-200/90 shadow-sm',
    iconWrap: 'bg-red-100 text-[#DC2626]',
    value: 'text-red-700',
  },
} as const;

export const KANBAN_COLUMN_THEMES: Record<
  TaskStatus,
  { container: string; headerBorder: string; countBadge: string; dragOver: string }
> = {
  TODO: {
    container: 'bg-slate-200/75 border-slate-300/90',
    headerBorder: 'border-slate-300/80',
    countBadge: 'bg-slate-300/80 text-slate-800',
    dragOver: 'bg-slate-300/60 ring-2 ring-indigo-400 ring-dashed',
  },
  IN_PROGRESS: {
    container: 'bg-blue-50/90 border-blue-200',
    headerBorder: 'border-blue-200/80',
    countBadge: 'bg-blue-200/80 text-blue-900',
    dragOver: 'bg-blue-100/70 ring-2 ring-blue-400 ring-dashed',
  },
  IN_REVIEW: {
    container: 'bg-amber-50/90 border-amber-200',
    headerBorder: 'border-amber-200/80',
    countBadge: 'bg-amber-200/80 text-amber-900',
    dragOver: 'bg-amber-100/70 ring-2 ring-amber-400 ring-dashed',
  },
  COMPLETED: {
    container: 'bg-green-50/90 border-green-200',
    headerBorder: 'border-green-200/80',
    countBadge: 'bg-green-200/80 text-green-900',
    dragOver: 'bg-green-100/70 ring-2 ring-green-400 ring-dashed',
  },
};

export const TABLE_THEMES = {
  wrapper: 'rounded-xl border border-[#CBD5E1] bg-white overflow-hidden shadow-sm',
  thead: 'bg-indigo-50/80 border-b border-[#CBD5E1] text-[#0F172A] uppercase tracking-wider font-semibold',
  row: 'odd:bg-white even:bg-slate-50/80 hover:bg-indigo-50/50 transition-colors',
} as const;

