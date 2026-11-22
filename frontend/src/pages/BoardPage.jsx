import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertCircle, KanbanSquare, Plus } from 'lucide-react';
import TicketFilters from '../components/tickets/TicketFilters';
import KanbanBoard from '../components/tickets/KanbanBoard';
import TicketFormModal from '../components/tickets/TicketFormModal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonBoard } from '../components/ui/Skeleton';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import { api, buildQuery } from '../lib/api';

const initialFilters = { q: '', priority: '', assignee: '', type: '' };

export default function BoardPage() {
  const { project, canWrite, refetchProject } = useOutletContext();
  const { socket } = useSocket();
  const toast = useToast();

  const [filters, setFilters] = useState(initialFilters);
  const debouncedQuery = useDebounce(filters.q, 350);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, status: 'todo' });
  const refreshTimer = useRef(null);

  const loadTickets = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const query = buildQuery({
          q: debouncedQuery,
          priority: filters.priority,
          assignee: filters.assignee,
          type: filters.type,
          sort: 'order',
          limit: 200,
        });
        const data = await api.get(`/projects/${project.id}/tickets${query}`);
        setTickets(data.tickets || []);
        setTotal(data.total ?? data.tickets?.length ?? 0);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [project.id, debouncedQuery, filters.priority, filters.assignee, filters.type]
  );

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!socket) return undefined;
    const schedule = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => loadTickets({ silent: true }), 350);
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
  }, [socket, loadTickets]);

  const handleFilterChange = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const clearFilters = () => setFilters(initialFilters);
  const hasFilters = Boolean(filters.q || filters.priority || filters.assignee || filters.type);

  const handleMove = async ({ ticket, fromStatus, toStatus, toIndex }) => {
    const previous = tickets;

    setTickets((current) => {
      const source = current
        .filter((item) => item.status === fromStatus && item.id !== ticket.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const destination =
        fromStatus === toStatus
          ? source
          : current
              .filter((item) => item.status === toStatus && item.id !== ticket.id)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const moved = { ...ticket, status: toStatus };
      destination.splice(Math.min(toIndex, destination.length), 0, moved);

      const untouched = current.filter(
        (item) => item.status !== fromStatus && item.status !== toStatus
      );
      const sourceRenumbered =
        fromStatus !== toStatus ? source.map((item, index) => ({ ...item, order: index })) : [];
      const destinationRenumbered = destination.map((item, index) => ({ ...item, order: index }));

      return [...untouched, ...sourceRenumbered, ...destinationRenumbered];
    });

    try {
      await api.patch(`/tickets/${ticket.id}/status`, { status: toStatus, position: toIndex });
      await loadTickets({ silent: true });
      refetchProject({ silent: true });
    } catch (err) {
      setTickets(previous);
      toast.error(err.message, 'Could not move ticket');
    }
  };

  const handleSaved = async () => {
    await loadTickets({ silent: true });
    refetchProject({ silent: true });
  };

  const projectIsEmpty = !loading && tickets.length === 0 && !hasFilters;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
            <KanbanSquare className="h-4 w-4 text-slate-400" />
            Sprint board
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {canWrite
              ? 'Drag a ticket between columns to update its status — changes save instantly.'
              : 'You have read-only access. Ask a project admin for a developer role to move tickets.'}
          </p>
        </div>
        {canWrite ? (
          <Button icon={Plus} onClick={() => setModal({ open: true, status: 'todo' })}>
            New ticket
          </Button>
        ) : null}
      </div>

      <TicketFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
        members={project.members}
        total={total}
      />

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button type="button" onClick={() => loadTickets()} className="ml-auto font-semibold underline">
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <SkeletonBoard />
      ) : projectIsEmpty ? (
        <EmptyState
          icon={KanbanSquare}
          title="Your board is ready"
          description="Create the first ticket to start tracking work. Bugs, features, tasks and improvements all live here."
          action={
            canWrite ? (
              <Button icon={Plus} onClick={() => setModal({ open: true, status: 'todo' })}>
                Create the first ticket
              </Button>
            ) : null
          }
        />
      ) : (
        <KanbanBoard
          tickets={tickets}
          canWrite={canWrite}
          onMove={handleMove}
          onAddTicket={(status) => setModal({ open: true, status })}
        />
      )}

      {hasFilters && !loading && tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center">
          <p className="text-sm font-semibold text-slate-600">No tickets match these filters</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Clear filters
          </button>
        </div>
      ) : null}

      {canWrite ? (
        <TicketFormModal
          open={modal.open}
          onClose={() => setModal((current) => ({ ...current, open: false }))}
          project={project}
          defaultStatus={modal.status}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
