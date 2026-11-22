import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertCircle, List, Plus, Ticket } from 'lucide-react';
import TicketFilters from '../components/tickets/TicketFilters';
import TicketTable from '../components/tickets/TicketTable';
import TicketFormModal from '../components/tickets/TicketFormModal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useSocket } from '../context/SocketContext';
import useDebounce from '../hooks/useDebounce';
import { api, buildQuery } from '../lib/api';

const initialFilters = { q: '', priority: '', assignee: '', type: '', sort: 'newest' };

export default function TicketListPage() {
  const { project, canWrite, refetchProject } = useOutletContext();
  const { socket } = useSocket();

  const [filters, setFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(filters.q, 350);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const refreshTimer = useRef(null);

  const loadTickets = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setSearchQuery(debouncedQuery);
      try {
        const query = buildQuery({
          q: debouncedQuery,
          priority: filters.priority,
          assignee: filters.assignee,
          type: filters.type,
          sort: filters.sort,
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
    [project.id, debouncedQuery, filters.priority, filters.assignee, filters.type, filters.sort]
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
  const hasFilters = Boolean(
    filters.q || filters.priority || filters.assignee || filters.type || filters.sort !== 'newest'
  );

  const handleSaved = async () => {
    await loadTickets({ silent: true });
    refetchProject({ silent: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
            <List className="h-4 w-4 text-slate-400" />
            Ticket list
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {total} ticket{total === 1 ? '' : 's'}
            {searchQuery ? ` matching “${searchQuery}”` : ' in this project'}
          </p>
        </div>
        {canWrite ? (
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
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
        showSort
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
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : tickets.length ? (
        <TicketTable tickets={tickets} showProject={false} />
      ) : hasFilters ? (
        <EmptyState
          icon={Ticket}
          title="No tickets match these filters"
          description="Try a different keyword, assignee or priority."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Ticket}
          title="No tickets yet"
          description="Create the first ticket to start tracking bugs and feature requests in this project."
          action={
            canWrite ? (
              <Button icon={Plus} onClick={() => setModalOpen(true)}>
                Create a ticket
              </Button>
            ) : null
          }
        />
      )}

      {canWrite ? (
        <TicketFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          project={project}
          defaultStatus="todo"
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
