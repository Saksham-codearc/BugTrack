import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ChevronDown, FolderKanban, LogOut, Menu, Radio, User, CircleHelp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectsContext';
import { useSocket } from '../../context/SocketContext';
import Avatar from '../ui/Avatar';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import { cn } from '../../lib/cn';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { projects } = useProjects();
  const { connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const match = location.pathname.match(/^\/projects\/([^/]+)/);
  const activeProjectId = match?.[1] || '';
  const activeProject = projects.find((project) => project.id === activeProjectId);

  const handleProjectChange = (event) => {
    const value = event.target.value;
    if (value) navigate(`/projects/${value}/board`);
    else navigate('/projects');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden min-w-0 sm:block">
          <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-slate-400">
            <FolderKanban className="h-4 w-4" />
          </div>
          <select
            value={activeProjectId}
            onChange={handleProjectChange}
            className="h-9 w-full min-w-[210px] appearance-none rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-8 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            aria-label="Select project"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title} ({project.key})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>

        {activeProject ? (
          <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeProject.color }} />
            <span className="max-w-[180px] truncate font-medium text-slate-600">{activeProject.title}</span>
          </div>
        ) : null}

        <div className="flex-1" />

        <div
          className={cn(
            'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:flex',
            connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          )}
          title={connected ? 'Connected to realtime updates' : 'Realtime updates are connecting'}
        >
          <span className="relative flex h-2 w-2">
            {connected ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            ) : null}
            <span
              className={cn(
                'relative inline-flex h-2 w-2 rounded-full',
                connected ? 'bg-emerald-500' : 'bg-slate-400'
              )}
            />
          </span>
          {connected ? 'Live' : 'Offline'}
          <Radio className="ml-0.5 h-3 w-3 opacity-60" />
        </div>

        <Link
          to="/my-tickets"
          className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:block"
          title="Help & docs in README"
        >
          <CircleHelp className="h-4 w-4" />
        </Link>

        <Dropdown
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-transparent p-1 pr-1.5 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <Avatar user={user} size="sm" />
              <span className="hidden max-w-[120px] truncate text-xs font-semibold text-slate-700 md:block">
                {user?.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          }
          panelClassName="w-60"
        >
          <div className="border-b border-slate-100 px-2.5 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <p className="mt-1.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {user?.role === 'admin' ? 'Global admin' : 'Member'}
            </p>
          </div>
          <div className="pt-1.5">
            <DropdownItem icon={User} onClick={() => navigate('/profile')}>
              Your profile
            </DropdownItem>
            <DropdownItem icon={LogOut} danger onClick={handleLogout}>
              Sign out
            </DropdownItem>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
