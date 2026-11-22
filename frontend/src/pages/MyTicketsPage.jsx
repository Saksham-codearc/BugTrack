import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDot, ListTodo, Search, Ticket, Timer } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import TicketTable from '../components/tickets/TicketTable';
import { Skeleton } from '../components/ui/Skeleton';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import { api, buildQuery } from '../lib/api';
import { cn } from '../lib/cn';

const TABS = [
  { value: '', label: 'All', key: 'total' },
  { value: 'todo', label: 'To Do', key: 'todo' },
  { value: 'in_progress', label: 'In Progress', key: 'in_progress' },
  { value: 'done', label: 'Done', key: 'done' },
];

export default function MyTicketsPage() {
  const { socket } = useSocket();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const [data, setData] = useState({ tickets: [], stats: { total: 0, todo: 0, in_progress: 0, done: 0 } });
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const result = await api.get(
          `/tickets/mine${buildQuery({ status, q: debouncedQuery })}`
        );
        setData(result);
      } catch (error) {
        if (!silent) toast.error(error.message, 'Could not load your tickets');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [status, debouncedQuery, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const schedule = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => load({ silent: true }), 350);
    };
    ['ticket:created', 'ticket:updated', 'ticket:deleted'].forEach((event) =>
      socket.on(event, schedule)
    );
    return () => {
      ['ticket:created', 'ticket:updated', 'ticket:deleted'].forEach((event) =>
        socket.off(event, schedule)
      );
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [socket, load]);

  const stats = data.stats || {};
  const cards = [
    { label: 'Assigned to me', value: stats.total || 0, icon: ListTodo, tone: 'bg-brand-50 text-brand-600' },
    { label: 'To do', value: stats.todo || 0, icon: CircleDot, tone: 'bg-slate-100 text-slate-600' },
    { label: 'In progress', value: stats.in_progress || 0, icon: Timer, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Completed', value: stats.done || 0, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <>
      <PageHeader
        title="My tickets"
        description="Everything assigned to you across every project, in one place."
        actions={
          <Link to="/projects">
            <Button variant="secondary" icon={Ticket}>
              Browse projects
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card flex items-center gap-3 p-4">
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', card.tone)}>
              <card.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xl font-extrabold leading-none text-slate-900">{card.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 card p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value || 'all'}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
                  status === tab.value
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                    status === tab.value ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {stats[tab.key] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your tickets…"
              className="input h-9 py-1.5 pl-9 text-xs"
              aria-label="Search my tickets"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : data.tickets.length ? (
          <TicketTable tickets={data.tickets} showProject />
        ) : (
          <EmptyState
            icon={Ticket}
            title={status || query ? 'No tickets match this view' : 'No tickets assigned to you'}
            description={
              status || query
                ? 'Try a different status or search term.'
                : 'When a teammate assigns you a ticket, it will appear here. Browse a project board to pick something up.'
            }
            action={
              status || query ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStatus('');
                    setQuery('');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Link to="/projects">
                  <Button variant="secondary">Go to projects</Button>
                </Link>
              )
            }
          />
        )}
      </div>
    </>
  );
}
