import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus, Search } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectFormModal from '../components/projects/ProjectFormModal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectsContext';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { projects, loading, refetchProjects } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(searchParams.get('new') === '1');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (project) =>
        project.title.toLowerCase().includes(term) ||
        project.key.toLowerCase().includes(term) ||
        project.description?.toLowerCase().includes(term)
    );
  }, [projects, query]);

  const totalTickets = projects.reduce((sum, project) => sum + (project.stats?.total || 0), 0);
  const openTickets = projects.reduce(
    (sum, project) => sum + ((project.stats?.total || 0) - (project.stats?.done || 0)),
    0
  );

  const handleSaved = () => refetchProjects({ silent: true });

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${projects.length} project${projects.length === 1 ? '' : 's'} · ${openTickets} open of ${totalTickets} tickets`}
        actions={
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            New project
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects by name, key or description…"
            className="input h-10 py-2 pl-9 text-sm"
            aria-label="Search projects"
          />
        </div>
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {projects.length}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} currentUserId={user?.id} />
          ))}
        </div>
      ) : projects.length ? (
        <EmptyState
          icon={Search}
          title="No projects match your search"
          description="Try a different keyword or clear the search."
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="Create your first project"
          description="A project groups your tickets, Kanban board and team. Invite teammates once it exists."
          action={
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              Create a project
            </Button>
          }
        />
      )}

      <ProjectFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
