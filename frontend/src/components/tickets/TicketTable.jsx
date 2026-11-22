import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { PriorityBadge, StatusBadge, TypeBadge } from './TicketBadges';
import { dueLabel, isOverdue, relativeTime } from '../../lib/format';
import { cn } from '../../lib/cn';

export default function TicketTable({ tickets, showProject = false }) {
  const navigate = useNavigate();

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3">Ticket</th>
              {showProject ? <th className="px-4 py-3">Project</th> : null}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => {
              const projectId = ticket.project?.id || ticket.project;
              const overdue = isOverdue(ticket.dueDate, ticket.status);
              return (
                <tr
                  key={ticket.id}
                  tabIndex={0}
                  role="link"
                  onClick={() => navigate(`/projects/${projectId}/tickets/${ticket.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') navigate(`/projects/${projectId}/tickets/${ticket.id}`);
                  }}
                  className="cursor-pointer bg-white transition hover:bg-slate-50/80 focus:bg-slate-50 focus:outline-none"
                >
                  <td className="max-w-[360px] px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        <TypeBadge type={ticket.type} iconOnly />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-slate-400">{ticket.key}</span>
                          {ticket.labels?.slice(0, 2).map((label) => (
                            <span
                              key={label}
                              className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500 sm:inline"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                        <Link
                          to={`/projects/${projectId}/tickets/${ticket.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-0.5 block truncate text-[13px] font-semibold text-slate-800 hover:text-brand-700"
                        >
                          {ticket.title}
                        </Link>
                      </div>
                    </div>
                  </td>
                  {showProject ? (
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {ticket.project?.title ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: ticket.project.color }}
                          />
                          {ticket.project.key}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {ticket.assignee ? (
                      <span className="flex items-center gap-2">
                        <Avatar user={ticket.assignee} size="xs" />
                        <span className="max-w-[120px] truncate text-xs font-medium text-slate-600">
                          {ticket.assignee.name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {ticket.dueDate ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs',
                          overdue ? 'font-semibold text-red-600' : 'text-slate-500'
                        )}
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        {dueLabel(ticket.dueDate, ticket.status)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-400">
                    {relativeTime(ticket.updatedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
