import { useEffect, useState } from 'react';
import { AlertCircle, FolderPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { api } from '../../lib/api';
import { PROJECT_COLORS } from '../../lib/constants';
import { useProjects } from '../../context/ProjectsContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/cn';

const EMPTY = { title: '', key: '', description: '', color: PROJECT_COLORS[0] };

export default function ProjectFormModal({ open, onClose, project = null, onSaved }) {
  const { refetchProjects } = useProjects();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(project);

  useEffect(() => {
    if (!open) return;
    setError('');
    setFieldErrors({});
    if (project) {
      setForm({
        title: project.title || '',
        key: project.key || '',
        description: project.description || '',
        color: project.color || PROJECT_COLORS[0],
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, project]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    if (form.title.trim().length < 2) {
      setFieldErrors({ title: 'Give the project a name with at least 2 characters.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        color: form.color,
      };
      if (!isEdit && form.key.trim()) payload.key = form.key.trim().toUpperCase();

      const data = isEdit
        ? await api.patch(`/projects/${project.id}`, payload)
        : await api.post('/projects', payload);

      await refetchProjects({ silent: true });
      toast.success(
        isEdit ? 'Project details updated.' : `${data.project.title} is ready for tickets.`,
        isEdit ? 'Project saved' : 'Project created'
      );
      onSaved?.(data.project);
      onClose();
    } catch (err) {
      setError(err.message);
      const mapped = {};
      (err.errors || []).forEach((item) => {
        mapped[item.field] = item.message;
      });
      setFieldErrors(mapped);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? 'Edit project' : 'Create a project'}
      description={
        isEdit
          ? 'Update how this project appears to your team.'
          : 'Projects group tickets, members and boards. You can change these details later.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={saving} icon={FolderPlus}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Input
          label="Project name"
          placeholder="e.g. Aurora Web App"
          value={form.title}
          onChange={update('title')}
          error={fieldErrors.title}
          maxLength={80}
          autoFocus
          required
        />

        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <Input
            label="Key"
            placeholder="AUR"
            value={form.key}
            onChange={(event) =>
              setForm((current) => ({ ...current, key: event.target.value.toUpperCase() }))
            }
            error={fieldErrors.key}
            hint={isEdit ? 'Keys are permanent.' : 'Auto-generated if empty.'}
            maxLength={8}
            disabled={isEdit}
          />
          <div>
            <span className="label">Accent color</span>
            <div className="flex flex-wrap items-center gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, color }))}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition',
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
        </div>

        <Textarea
          label="Description"
          placeholder="What is this project about? Who is it for?"
          rows={4}
          value={form.description}
          onChange={update('description')}
          error={fieldErrors.description}
          maxLength={1000}
          hint={`${form.description.length}/1000 characters`}
        />
      </form>
    </Modal>
  );
}
