import { ArrowUpRight, Bug, CheckSquare, Sparkles, TrendingUp } from 'lucide-react';
import Badge from '../ui/Badge';
import { PRIORITY_MAP, ROLE_MAP, STATUS_MAP, TYPE_MAP } from '../../lib/constants';
import { cn } from '../../lib/cn';

export function StatusBadge({ status, className }) {
  const meta = STATUS_MAP[status] || STATUS_MAP.todo;
  return (
    <Badge className={cn(meta.badge, className)} dot dotClassName={meta.dot}>
      {meta.label}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }) {
  const meta = PRIORITY_MAP[priority] || PRIORITY_MAP.medium;
  return (
    <Badge className={cn(meta.badge, className)} dot dotClassName={meta.dot}>
      {meta.label}
    </Badge>
  );
}

const TYPE_ICONS = {
  bug: Bug,
  feature: Sparkles,
  task: CheckSquare,
  improvement: TrendingUp,
};

export function TypeBadge({ type, className, showIcon = true, iconOnly = false }) {
  const meta = TYPE_MAP[type] || TYPE_MAP.bug;
  const Icon = TYPE_ICONS[type] || Bug;

  if (iconOnly) {
    return (
      <span
        title={meta.label}
        className={cn('inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/80 ring-1 ring-inset ring-slate-200', className)}
      >
        <Icon className={cn('h-3.5 w-3.5', meta.iconColor)} />
      </span>
    );
  }

  return (
    <Badge className={cn(meta.badge, className)}>
      {showIcon ? <Icon className="h-3 w-3" /> : null}
      {meta.label}
    </Badge>
  );
}

export function RoleBadge({ role, className }) {
  const meta = ROLE_MAP[role] || ROLE_MAP.viewer;
  return <Badge className={cn(meta.badge, className)}>{meta.label}</Badge>;
}

export function ProjectLink({ project, className }) {
  if (!project) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-slate-500', className)}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
      {project.title}
      {project.key ? <span className="text-slate-400">({project.key})</span> : null}
      <ArrowUpRight className="h-3 w-3 text-slate-300" />
    </span>
  );
}
