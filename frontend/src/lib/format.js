const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
};

export const relativeTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(seconds);

  if (absolute < 60) return 'just now';
  if (absolute < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (absolute < 86400) return `${Math.round(seconds / 3600)}h ago`;
  if (absolute < 604800) return `${Math.round(seconds / 86400)}d ago`;
  return formatDate(date);
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  const date = new Date(dueDate);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
};

export const dueLabel = (dueDate, status) => {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (status === 'done') return formatDate(date);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days}d`;
  return formatDate(date);
};

export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

export const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export const truncate = (value = '', length = 100) =>
  value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
