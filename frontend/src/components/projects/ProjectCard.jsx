import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderKanban, Ticket } from 'lucide-react';
import Avatar, { AvatarGroup } from '../ui/Avatar';
import Badge from '../ui/Badge';
import { RoleBadge } from '../tickets/TicketBadges';
import { relativeTime, truncate } from '../../lib/format';
import { cn } from '../../lib/cn';

export default function ProjectCard({ project, currentUserId, className }) {
  const membership = project.members?.find((member) => member.user?.id === currentUserId);
  const role = membership?.role;
  const stats = project.stats || { total: 0, todo: 0, done: 0, progress: 0 };
  const members = project.members || [];

  return (
    <Link
      to={`/projects/${project.id}/board`}
      className={cn(
        'card card-hover group relative flex flex-col overflow-hidden p-5',
        project.status === 'archived' && 'opacity-70',
        className
      )}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: project.color }} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            <FolderKanban className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                {project.key}
              </span>
              {project.status === 'archived' ? (
                <Badge className="bg-slate-100 text-slate-500 ring-slate-200">Archived</Badge>
              ) : null}
            </div>
            <h3 className="mt-1 truncate text-[15px] font-bold tracking-tight text-slate-900 group-hover:text-brand-700">
              {project.title}
            </h3>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-500" />
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-slate-500">
        {project.description ? truncate(project.description, 140) : 'No description yet.'}
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span>
            {stats.done} of {stats.total} tickets done
          </span>
          <span className="font-semibold text-slate-600">{stats.progress || 0}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.progress || 0}%`, backgroundColor: project.color }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
          <Ticket className="h-3 w-3" />
          {stats.total} tickets
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600 ring-1 ring-inset ring-blue-100">
          {stats.in_progress || 0} in progress
        </span>
        {stats.overdue > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 ring-1 ring-inset ring-red-100">
            {stats.overdue} overdue
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <AvatarGroup members={members.map((member) => member.user)} max={4} size="xs" />
          <span className="text-[11px] text-slate-400">{members.length} members</span>
        </div>
        <div className="flex items-center gap-2">
          {role ? <RoleBadge role={role} /> : null}
          <span className="hidden text-[10px] text-slate-400 sm:inline">
            {relativeTime(project.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
