import { Link } from 'react-router-dom';
import { CalendarDays, GripVertical, MessageSquare, Paperclip } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { PriorityBadge, TypeBadge } from './TicketBadges';
import { dueLabel, isOverdue } from '../../lib/format';
import { cn } from '../../lib/cn';

export default function TicketCard({ ticket, dragHandleProps, isDragging, canDrag = true }) {
  const overdue = isOverdue(ticket.dueDate, ticket.status);
  const due = dueLabel(ticket.dueDate, ticket.status);

  return (
    <div
      {...dragHandleProps}
      className={cn(
        'group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition',
        canDrag && 'cursor-grab active:cursor-grabbing',
        isDragging ? 'rotate-1 border-brand-300 shadow-lift ring-2 ring-brand-500/20' : 'hover:border-slate-300 hover:shadow-soft'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {canDrag ? (
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
          ) : null}
          <TypeBadge type={ticket.type} iconOnly />
          <span className="truncate font-mono text-[10px] font-semibold text-slate-400">{ticket.key}</span>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <Link
        to={`/projects/${ticket.project?.id || ticket.project}/tickets/${ticket.id}`}
        className="mt-2.5 block text-[13px] font-semibold leading-5 text-slate-800 transition hover:text-brand-700"
        onClick={(event) => event.stopPropagation()}
      >
        {ticket.title}
      </Link>

      {ticket.labels?.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {ticket.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500"
            >
              {label}
            </span>
          ))}
          {ticket.labels.length > 3 ? (
            <span className="px-1 text-[9px] text-slate-400">+{ticket.labels.length - 3}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        <div className="flex items-center gap-2.5 text-[10px] font-medium text-slate-400">
          {due ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1 py-0.5',
                overdue ? 'bg-red-50 text-red-600' : ''
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {due}
            </span>
          ) : null}
          {ticket.commentsCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {ticket.commentsCount}
            </span>
          ) : null}
          {ticket.attachments?.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {ticket.attachments.length}
            </span>
          ) : null}
        </div>
        {ticket.assignee ? (
          <Avatar user={ticket.assignee} size="xs" title={`Assigned to ${ticket.assignee.name}`} />
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-400">
            Unassigned
          </span>
        )}
      </div>
    </div>
  );
}
