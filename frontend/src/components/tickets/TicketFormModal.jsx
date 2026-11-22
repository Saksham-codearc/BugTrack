import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, Paperclip, Tag, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { PRIORITIES, STATUSES, TICKET_TYPES } from '../../lib/constants';
import { formatBytes, toDateInput } from '../../lib/format';
import { cn } from '../../lib/cn';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const emptyForm = (defaultStatus) => ({
  title: '',
  description: '',
  type: 'bug',
  status: defaultStatus || 'todo',
  priority: 'medium',
  assignee: '',
  dueDate: '',
  labels: '',
});

export default function TicketFormModal({
  open,
  onClose,
  project,
  ticket = null,
  defaultStatus = 'todo',
  onSaved,
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => emptyForm(defaultStatus));
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(ticket);
  const members = project?.members || [];

  useEffect(() => {
    if (!open) return;
    setError('');
    setFieldErrors({});
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (ticket) {
      setForm({
        title: ticket.title || '',
        description: ticket.description || '',
        type: ticket.type || 'bug',
        status: ticket.status || 'todo',
        priority: ticket.priority || 'medium',
        assignee: ticket.assignee?.id || '',
        dueDate: toDateInput(ticket.dueDate),
        labels: (ticket.labels || []).join(', '),
      });
    } else {
      setForm(emptyForm(defaultStatus));
    }
  }, [open, ticket, defaultStatus]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const valid = [];
    selected.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is larger than 5 MB.`, 'File skipped');
        return;
      }
      valid.push(file);
    });
    setFiles((current) => [...current, ...valid].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    if (form.title.trim().length < 3) {
      setFieldErrors({ title: 'Give the ticket a descriptive title (at least 3 characters).' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        status: form.status,
        priority: form.priority,
        assignee: form.assignee || null,
        dueDate: form.dueDate || null,
        labels: form.labels
          .split(',')
          .map((label) => label.trim())
          .filter(Boolean)
          .slice(0, 8),
      };

      let result;
      if (isEdit) {
        result = await api.patch(`/tickets/${ticket.id}`, payload);
      } else {
        result = await api.post(`/projects/${project.id}/tickets`, payload);
      }

      let savedTicket = result.ticket;

      if (files.length) {
        try {
          const formData = new FormData();
          files.forEach((file) => formData.append('files', file));
          const uploadResult = await api.upload(`/tickets/${savedTicket.id}/attachments`, formData);
          savedTicket = uploadResult.ticket;
          toast.success('Attachment uploaded.', 'Files saved');
        } catch (uploadError) {
          toast.error(uploadError.message, 'Ticket saved, but upload failed');
        }
      }

      toast.success(
        isEdit ? `${savedTicket.key} updated.` : `${savedTicket.key} is on the board.`,
        isEdit ? 'Ticket saved' : 'Ticket created'
      );
      onSaved?.(savedTicket);
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
      title={isEdit ? `Edit ${ticket?.key}` : 'Create a ticket'}
      description={
        isEdit
          ? 'Update the details, assignment or status. Changes sync to the board instantly.'
          : 'Report a bug or request a feature. Tickets are visible to everyone in this project.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="ticket-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Create ticket'}
          </Button>
        </>
      }
    >
      <form id="ticket-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Input
          label="Title"
          placeholder="e.g. Checkout page crashes on Safari 17"
          value={form.title}
          onChange={update('title')}
          error={fieldErrors.title}
          maxLength={140}
          autoFocus
          required
        />

        <Textarea
          label="Description"
          placeholder="What happened? Include steps to reproduce, expected behaviour and any context that helps."
          rows={6}
          value={form.description}
          onChange={update('description')}
          error={fieldErrors.description}
          maxLength={8000}
          hint="Markdown is displayed as plain text. Screenshots can be attached below."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Type" value={form.type} onChange={update('type')} error={fieldErrors.type}>
            {TICKET_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>

          <Select label="Priority" value={form.priority} onChange={update('priority')} error={fieldErrors.priority}>
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </Select>

          <Select label="Status" value={form.status} onChange={update('status')} error={fieldErrors.status}>
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Assignee"
            value={form.assignee}
            onChange={update('assignee')}
            error={fieldErrors.assignee}
            hint="Only project members can be assigned."
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name} — {member.role}
              </option>
            ))}
          </Select>

          <Input
            label="Due date"
            type="date"
            icon={CalendarDays}
            value={form.dueDate}
            onChange={update('dueDate')}
            error={fieldErrors.dueDate}
          />
        </div>

        <Input
          label="Labels"
          icon={Tag}
          placeholder="checkout, safari, urgent"
          value={form.labels}
          onChange={update('labels')}
          error={fieldErrors.labels}
          hint="Comma separated, up to 8 labels."
        />

        <div>
          <span className="label">Attachments</span>
          <label
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-center transition hover:border-brand-300 hover:bg-brand-50/40'
            )}
          >
            <Paperclip className="h-5 w-5 text-slate-400" />
            <span className="mt-1.5 text-xs font-semibold text-slate-600">
              Click to add screenshots or PDFs
            </span>
            <span className="mt-0.5 text-[10px] text-slate-400">Up to 3 files, 5 MB each</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,application/pdf"
              className="sr-only"
              onChange={handleFiles}
            />
          </label>

          {files.length ? (
            <div className="mt-2 space-y-1.5">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="min-w-0 truncate text-xs font-medium text-slate-600">{file.name}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
