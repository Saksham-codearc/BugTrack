export const STATUSES = [
  {
    value: 'todo',
    label: 'To Do',
    shortLabel: 'To Do',
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    header: 'bg-slate-400',
    column: 'border-slate-200',
    soft: 'bg-slate-50',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    shortLabel: 'Progress',
    dot: 'bg-blue-500',
    text: 'text-blue-700',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    header: 'bg-blue-500',
    column: 'border-blue-200/70',
    soft: 'bg-blue-50/40',
  },
  {
    value: 'done',
    label: 'Done',
    shortLabel: 'Done',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    header: 'bg-emerald-500',
    column: 'border-emerald-200/70',
    soft: 'bg-emerald-50/40',
  },
];

export const STATUS_MAP = Object.fromEntries(STATUSES.map((status) => [status.value, status]));

export const PRIORITIES = [
  {
    value: 'low',
    label: 'Low',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400',
  },
  {
    value: 'medium',
    label: 'Medium',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
  },
  {
    value: 'high',
    label: 'High',
    badge: 'bg-orange-50 text-orange-700 ring-orange-200',
    dot: 'bg-orange-500',
    bar: 'bg-orange-500',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    dot: 'bg-red-500',
    bar: 'bg-red-500',
  },
];

export const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map((priority) => [priority.value, priority]));

export const TICKET_TYPES = [
  {
    value: 'bug',
    label: 'Bug',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    iconColor: 'text-red-500',
  },
  {
    value: 'feature',
    label: 'Feature',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    iconColor: 'text-violet-500',
  },
  {
    value: 'task',
    label: 'Task',
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    iconColor: 'text-cyan-500',
  },
  {
    value: 'improvement',
    label: 'Improvement',
    badge: 'bg-teal-50 text-teal-700 ring-teal-200',
    iconColor: 'text-teal-500',
  },
];

export const TYPE_MAP = Object.fromEntries(TICKET_TYPES.map((type) => [type.value, type]));

export const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    badge: 'bg-brand-50 text-brand-700 ring-brand-200',
    description: 'Full control, including deleting the project and managing every member.',
  },
  {
    value: 'manager',
    label: 'Manager',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    description: 'Edit project settings, invite members, and manage all tickets.',
  },
  {
    value: 'developer',
    label: 'Developer',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    description: 'Create, edit, assign and move tickets. Can comment and upload files.',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    description: 'Read-only access to the board and tickets, but can join the discussion.',
  },
];

export const ROLE_MAP = Object.fromEntries(ROLES.map((role) => [role.value, role]));

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
];

export const AVATAR_COLORS = [
  '#4f46e5',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#475569',
];

export const PROJECT_COLORS = [
  '#4f46e5',
  '#7c3aed',
  '#db2777',
  '#e11d48',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#475569',
];

export const DEMO_ACCOUNTS = [
  { email: 'aarav@bugtrack.dev', label: 'Aarav Sharma', role: 'Admin' },
  { email: 'meera@bugtrack.dev', label: 'Meera Patel', role: 'Manager' },
  { email: 'dev@bugtrack.dev', label: 'Dev Kapoor', role: 'Developer' },
  { email: 'riya@bugtrack.dev', label: 'Riya Singh', role: 'Viewer' },
];

export const DEMO_PASSWORD = 'password123';
