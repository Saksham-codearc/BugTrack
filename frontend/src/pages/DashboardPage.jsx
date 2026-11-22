import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  FolderKanban,
  Plus,
  Sparkles,
  Timer,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { PriorityBadge, TypeBadge } from '../components/tickets/TicketBadges';
import { SkeletonCard, SkeletonRow } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectsContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { PRIORITIES } from '../lib/constants';
import { dueLabel, isOverdue, relativeTime } from '../lib/format';
import { cn } from '../lib/cn';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

function StatCard({ label, value, hint, icon: Icon, tone, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <p className="mt-2 text-[28px] font-extrabold leading-none tracking-tight text-slate-900">
              {value}
            </p>
          )}
          <p className="mt-2 text-[11px] text-slate-400">{hint}</p>
        </div>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, loading: projectsLoading, refetchProjects } = useProjects();
  const { socket } = useSocket();
  const toast = useToast();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const timerRef = useRef(null);

  const loadSummary = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const data = await api.get('/dashboard/summary');
        setSummary(data);
      } catch (error) {
        if (!silent) toast.error(error.message, 'Could not load your dashboard');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => loadSummary({ silent: true }), 400);
    };
    ['ticket:created', 'ticket:updated', 'ticket:deleted', 'project:updated'].forEach((event) =>
      socket.on(event, refresh)
    );
    return () => {
      ['ticket:created', 'ticket:updated', 'ticket:deleted', 'project:updated'].forEach((event) =>
        socket.off(event, refresh)
      );
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [socket, loadSummary]);

  const stats = summary?.stats;
  const openTickets = stats ? stats.total - stats.done : 0;
  const totalOpenForPriority = summary
    ? Object.values(summary.byPriority || {}).reduce((sum, value) => sum + value, 0)
    : 0;

  const handleProjectCreated = async (project) => {
    await refetchProjects({ silent: true });
    await loadSummary({ silent: true });
    toast.success(`Start by adding your first ticket to ${project.title}.`, 'Write your first ticket');
  };

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        description={new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
        actions={
          <>
            <Button variant="secondary" icon={FolderKanban} onClick={() => setProjectModalOpen(true)}>
              New project
            </Button>
            <Link to="/projects">
              <Button icon={ArrowRight}>Browse projects</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Assigned to me"
          value={stats?.assignedToMe ?? 0}
          hint="Open tickets that need your attention"
          icon={UserCheck}
          tone="bg-brand-50 text-brand-600"
          loading={loading}
        />
        <StatCard
          label="Open tickets"
          value={openTickets}
          hint={`Across ${stats?.projectCount ?? projects.length} project${(stats?.projectCount ?? projects.length) === 1 ? '' : 's'}`}
          icon={CircleDot}
          tone="bg-blue-50 text-blue-600"
          loading={loading}
        />
        <StatCard
          label="In progress"
          value={stats?.in_progress ?? 0}
          hint={stats?.overdue ? `${stats.overdue} ticket${stats.overdue === 1 ? '' : 's'} overdue` : 'Nothing overdue — nice'}
          icon={Timer}
          tone={stats?.overdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}
          loading={loading}
        />
        <StatCard
          label="Completion"
          value={stats ? `${stats.completionRate}%` : '0%'}
          hint={`${stats?.done ?? 0} of ${stats?.total ?? 0} tickets done`}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
          loading={loading}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-slate-900">Your projects</h2>
                <p className="text-xs text-slate-400">Boards you are a member of</p>
              </div>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {projectsLoading ? (
              <div className="grid gap-3 md:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : projects.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {projects.slice(0, 4).map((project) => (
                  <ProjectCard key={project.id} project={project} currentUserId={user?.id} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Create your first project, invite teammates and start tracking issues together."
                action={
                  <Button icon={Plus} onClick={() => setProjectModalOpen(true)}>
                    Create a project
                  </Button>
                }
              />
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">My work</h2>
                <p className="text-[11px] text-slate-400">Tickets assigned to you</p>
              </div>
              <Link to="/my-tickets" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="px-5 py-2">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : summary?.myTickets?.length ? (
              <div className="divide-y divide-slate-100">
                {summary.myTickets.map((ticket) => {
                  const overdue = isOverdue(ticket.dueDate, ticket.status);
                  return (
                    <Link
                      key={ticket.id}
                      to={`/projects/${ticket.project?.id}/tickets/${ticket.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
                    >
                      <TypeBadge type={ticket.type} iconOnly />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-slate-400">
                            {ticket.key}
                          </span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="truncate text-[10px] font-medium text-slate-400">
                            {ticket.project?.title}
                          </span>
                        </div>
                        <p className="truncate text-[13px] font-semibold text-slate-700">{ticket.title}</p>
                      </div>
                      <PriorityBadge priority={ticket.priority} />
                      {ticket.dueDate ? (
                        <span
                          className={cn(
                            'hidden text-[10px] font-medium sm:block',
                            overdue ? 'text-red-600' : 'text-slate-400'
                          )}
                        >
                          {dueLabel(ticket.dueDate, ticket.status)}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <Sparkles className="h-7 w-7 text-slate-200" />
                <p className="mt-2 text-sm font-semibold text-slate-600">You’re all caught up</p>
                <p className="mt-0.5 text-xs text-slate-400">No open tickets are assigned to you.</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Priority breakdown</h2>
              <TrendingUp className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">Open tickets by priority</p>

            <div className="mt-5 space-y-4">
              {PRIORITIES.slice()
                .reverse()
                .map((priority) => {
                  const count = summary?.byPriority?.[priority.value] || 0;
                  const percentage = totalOpenForPriority ? Math.round((count / totalOpenForPriority) * 100) : 0;
                  return (
                    <div key={priority.value}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-slate-600">
                          <span className={cn('h-2 w-2 rounded-full', priority.dot)} />
                          {priority.label}
                        </span>
                        <span className="font-semibold text-slate-500">
                          {count} <span className="font-normal text-slate-400">· {percentage}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', priority.bar)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {stats?.unassigned ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-700 ring-1 ring-inset ring-amber-100">
                <Clock3 className="h-3.5 w-3.5 shrink-0" />
                {stats.unassigned} open ticket{stats.unassigned === 1 ? '' : 's'} still unassigned.
              </div>
            ) : null}
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">Recent activity</h2>
              <p className="text-[11px] text-slate-400">Latest changes across your projects</p>
            </div>
            {loading ? (
              <div className="px-5 py-2">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : summary?.recentTickets?.length ? (
              <div className="divide-y divide-slate-50">
                {summary.recentTickets.slice(0, 6).map((ticket) => {
                  const statusColor =
                    ticket.status === 'done'
                      ? 'bg-emerald-500'
                      : ticket.status === 'in_progress'
                        ? 'bg-blue-500'
                        : 'bg-slate-300';
                  return (
                    <Link
                      key={ticket.id}
                      to={`/projects/${ticket.project?.id}/tickets/${ticket.id}`}
                      className="flex gap-3 px-5 py-3 transition hover:bg-slate-50"
                    >
                      <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center">
                        <span className={cn('h-2 w-2 rounded-full', statusColor)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-700">{ticket.title}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {ticket.key} · {ticket.project?.key} · {relativeTime(ticket.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-xs text-slate-400">No recent activity yet.</p>
            )}
          </section>
        </div>
      </div>

      <ProjectFormModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSaved={handleProjectCreated}
      />
    </>
  );
}
