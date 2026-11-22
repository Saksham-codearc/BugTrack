import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  FolderCog,
  KeyRound,
  Save,
  Trash2,
  User,
} from 'lucide-react';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { PROJECT_COLORS } from '../lib/constants';
import { formatDate } from '../lib/format';
import { cn } from '../lib/cn';

export default function SettingsPage() {
  const { project, canManage, canDelete, refetchProject, refetchProjects } = useOutletContext();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: project.title,
    description: project.description || '',
    color: project.color,
    status: project.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setForm({
      title: project.title,
      description: project.description || '',
      color: project.color,
      status: project.status,
    });
  }, [project]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch(`/projects/${project.id}`, form);
      toast.success('Project settings saved.', 'Updated');
      await refetchProject({ silent: true });
      await refetchProjects({ silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${project.id}`);
      toast.success(`${project.title} and its tickets were deleted.`, 'Project deleted');
      await refetchProjects({ silent: true });
      navigate('/projects', { replace: true });
    } catch (err) {
      toast.error(err.message, 'Could not delete project');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FolderCog className="h-4 w-4 text-slate-400" />
            Project details
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {canManage
              ? 'Update the name, description and look of this project.'
              : 'You have read-only access to these settings.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <Input
            label="Project name"
            value={form.title}
            onChange={update('title')}
            disabled={!canManage}
            maxLength={80}
            required
          />

          <Textarea
            label="Description"
            rows={4}
            value={form.description}
            onChange={update('description')}
            disabled={!canManage}
            maxLength={1000}
            hint={`${form.description.length}/1000 characters`}
          />

          <div>
            <span className="label">Accent color</span>
            <div className="flex flex-wrap items-center gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  disabled={!canManage}
                  onClick={() => setForm((current) => ({ ...current, color }))}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition disabled:cursor-not-allowed',
                    form.color === color
                      ? 'scale-110 border-slate-900 ring-2 ring-white'
                      : 'border-white hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Use color ${color}`}
                  aria-pressed={form.color === color}
                />
              ))}
            </div>
          </div>

          <Select
            label="Project status"
            value={form.status}
            onChange={update('status')}
            disabled={!canManage}
            hint="Archived projects stay accessible but are marked as inactive."
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>

          {canManage ? (
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" icon={Save} loading={saving}>
                Save changes
              </Button>
            </div>
          ) : null}
        </form>
      </section>

      <div className="space-y-5">
        <section className="card p-5">
          <h2 className="text-sm font-bold text-slate-900">Project information</h2>
          <dl className="mt-4 space-y-3.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-400">
                <KeyRound className="h-3.5 w-3.5" /> Key
              </dt>
              <dd className="font-mono font-semibold text-slate-700">{project.key}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-400">
                <User className="h-3.5 w-3.5" /> Owner
              </dt>
              <dd className="font-semibold text-slate-700">{project.owner?.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" /> Created
              </dt>
              <dd className="font-medium text-slate-600">{formatDate(project.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-400">
                <Archive className="h-3.5 w-3.5" /> Tickets issued
              </dt>
              <dd className="font-semibold text-slate-700">{project.ticketCounter}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Status</dt>
              <dd>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    project.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {project.status}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        {canDelete ? (
          <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-red-800">
              <AlertTriangle className="h-4 w-4" />
              Danger zone
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-red-700/80">
              Deleting this project permanently removes all tickets, comments, attachments and member access.
              This cannot be undone.
            </p>
            <Button
              variant="danger"
              icon={Trash2}
              className="mt-4"
              onClick={() => setConfirmDelete(true)}
            >
              Delete project
            </Button>
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete ${project.title}?`}
        description={`This will permanently delete ${project.stats?.total || 0} tickets, every comment and all uploaded files. This action cannot be undone.`}
        confirmLabel="Delete this project"
      />
    </div>
  );
}
