import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bug,
  ChevronRight,
  CircleDot,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Ticket,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectsContext';
import Avatar from '../ui/Avatar';
import { cn } from '../../lib/cn';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/my-tickets', label: 'My tickets', icon: Ticket },
  { to: '/profile', label: 'Profile', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { projects } = useProjects();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden bg-slate-950 text-white transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative flex h-16 items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-900/50">
              <Bug className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[15px] font-extrabold tracking-tight">BugTrack</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Issue tracker
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
            Workspace
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mb-2 mt-7 flex items-center justify-between px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Your projects</p>
            <Link
              to="/projects"
              onClick={onClose}
              className="rounded p-0.5 text-slate-500 transition hover:text-white"
              title="All projects"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-0.5">
            {projects.slice(0, 6).map((project) => {
              const active = location.pathname.startsWith(`/projects/${project.id}`);
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}/board`}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition',
                    active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{project.title}</span>
                  <span className="text-[10px] font-semibold text-slate-600 group-hover:text-slate-400">
                    {project.key}
                  </span>
                </Link>
              );
            })}
            {projects.length === 0 ? (
              <p className="px-3 py-2 text-xs leading-5 text-slate-600">
                No projects yet. Create your first one to get started.
              </p>
            ) : null}
            <Link
              to="/projects?new=1"
              onClick={onClose}
              className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              New project
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <CircleDot className="h-3.5 w-3.5 text-emerald-400" />
              Real-time collaboration
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
              Boards and comments update live over Socket.IO when your team makes changes.
            </p>
          </div>
        </div>

        <div className="relative border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5">
            <Avatar user={user} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
