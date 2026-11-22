import { Search, SlidersHorizontal, X } from 'lucide-react';
import { PRIORITIES, SORT_OPTIONS, TICKET_TYPES } from '../../lib/constants';
import { cn } from '../../lib/cn';

export default function TicketFilters({
  filters,
  onChange,
  onClear,
  members = [],
  showSort = false,
  total,
  className,
}) {
  const hasFilters = Boolean(
    filters.q || filters.priority || filters.assignee || filters.type || (showSort && filters.sort && filters.sort !== 'newest')
  );

  return (
    <div className={cn('card flex flex-col gap-3 p-3.5', className)}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.q || ''}
            onChange={(event) => onChange('q', event.target.value)}
            placeholder="Search by title, key, label or description…"
            className="input h-10 py-2 pl-9 pr-9 text-sm"
            aria-label="Search tickets"
          />
          {filters.q ? (
            <button
              type="button"
              onClick={() => onChange('q', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filters.priority || ''}
            onChange={(event) => onChange('priority', event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            aria-label="Filter by priority"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>

          <select
            value={filters.type || ''}
            onChange={(event) => onChange('type', event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {TICKET_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={filters.assignee || ''}
            onChange={(event) => onChange('assignee', event.target.value)}
            className="h-9 max-w-[160px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            aria-label="Filter by assignee"
          >
            <option value="">All assignees</option>
            <option value="me">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
            {members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>

          {showSort ? (
            <select
              value={filters.sort || 'newest'}
              onChange={(event) => onChange('sort', event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              aria-label="Sort tickets"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}

          {hasFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <SlidersHorizontal className="h-3 w-3" />
        <span>
          {typeof total === 'number' ? `${total} ticket${total === 1 ? '' : 's'}` : 'Filter the board'}
          {hasFilters ? ' matching filters' : ''}
        </span>
      </div>
    </div>
  );
}
