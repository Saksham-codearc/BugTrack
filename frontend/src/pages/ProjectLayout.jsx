import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CircleDot,
  FolderKanban,
  LayoutGrid,
  List,
  Settings,
  Users,
} from 'lucide-react';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import { RoleBadge } from '../components/tickets/TicketBadges';
import { AvatarGroup } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectsContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { canEditTickets, canManageProject, canDeleteProject, hasRole } from '../lib/permissions';
import { cn } from '../lib/cn';

const TABS = [
  { to: 'board', label: 'Board', icon: LayoutGrid },
  { to: 'list', label: 'List', icon: List },
  { to: 'team', label: 'Team', icon: Users },
  { to: 'settings', label: 'Settings', icon: Settings },
];

export default function ProjectLayout() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { getProject, refetchProjects } = useProjects();
  const { socket } = useSocket();
  const toast = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState(() => getProject(projectId));
  const [loading, setLoading] = useState(!project);
  const [error, setError] = useState('');

  const fetchProject = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const data = await api.get(`/projects/${projectId}`);
        setProject(data.project);
        setError('');
        return data.project;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    setProject(getProject(projectId));
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!socket || !projectId) return undefined;

    socket.emit('project:join', projectId);

    const handleProjectUpdated = (payload) => {
      if (payload?.id === projectId) setProject(payload);
    };
    const handleProjectDeleted = (payload) => {
      if (payload?.projectId === projectId) {
        toast.info('This project was deleted.', 'Project removed');
        navigate('/projects', { replace: true });
      }
    };
    const refreshStats = () => fetchProject({ silent: true });

    socket.on('project:updated', handleProjectUpdated);
    socket.on('project:deleted', handleProjectDeleted);
    socket.on('ticket:created', refreshStats);
    socket.on('ticket:updated', refreshStats);
    socket.on('ticket:deleted', refreshStats);

    return () => {
      socket.off('project:updated', handleProjectUpdated);
      socket.off('project:deleted', handleProjectDeleted);
      socket.off('ticket:created', refreshStats);
      socket.off('ticket:updated', refreshStats);
      socket.off('ticket:deleted', refreshStats);
    };
  }, [socket, projectId, fetchProject, navigate, toast]);

  const role = project?.members?.find((member) => member.user?.id === user?.id)?.role;

  if (loading && !project) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-52" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="mt-2 h-4 w-96 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project unavailable"
        description={error}
        action={
          <Link to="/projects">
            <Button variant="secondary" icon={ArrowLeft}>
              Back to projects
            </Button>
          </Link>
        }
      />
    );
  }

  if (!project) return null;

  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs
          items={[
            { label: 'Projects', to: '/projects' },
            { label: project.title, to: `/projects/${project.id}/board` },
          ]}
        />
      </div>

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            <FolderKanban className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900">
                {project.title}
              </h1>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                {project.key}
              </span>
              {role ? <RoleBadge role={role} /> : null}
              {project.status === 'archived' ? (
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  Archived
                </span>
              ) : null}
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              {project.description || 'No project description yet.'}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-2">
                <AvatarGroup members={project.members.map((member) => member.user)} max={4} size="xs" />
                {project.members.length} members
              </span>
              <span className="inline-flex items-center gap-1">
                <CircleDot className="h-3 w-3" />
                {project.stats?.total || 0} tickets · {project.stats?.progress || 0}% complete
              </span>
              {project.stats?.overdue > 0 ? (
                <span className="font-semibold text-red-500">{project.stats.overdue} overdue</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={`/projects/${project.id}/${tab.to}`}
            className={({ isActive }) =>
              cn(
                'relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-xs font-semibold transition',
                isActive
                  ? 'text-brand-700 after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand-600'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.to === 'settings' && !canManageProject(role) ? (
              <span className="rounded bg-slate-100 px-1 text-[9px] font-medium text-slate-400">read-only</span>
            ) : null}
          </NavLink>
        ))}
      </div>

      <Outlet
        context={{
          project,
          role,
          refetchProject: fetchProject,
          canWrite: canEditTickets(role),
          canManage: canManageProject(role),
          canDelete: canDeleteProject(role),
          isAdmin: hasRole(role, 'admin'),
          refetchProjects,
        }}
      />
    </div>
  );
}
