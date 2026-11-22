import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  MessageSquare,
  Paperclip,
  Pencil,
  Tag,
  Trash2,
  UserRound,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AttachmentList from '../components/tickets/AttachmentList';
import CommentThread from '../components/tickets/CommentThread';
import TicketFormModal from '../components/tickets/TicketFormModal';
import { PriorityBadge, StatusBadge, TypeBadge } from '../components/tickets/TicketBadges';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { PRIORITIES, STATUSES } from '../lib/constants';
import { formatDate, formatDateTime, isOverdue, relativeTime } from '../lib/format';
import { canDeleteTicket, canEditTickets, canModerateComments } from '../lib/permissions';
import { cn } from '../lib/cn';

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const { project, role, refetchProject, refetchProjects } = useOutletContext();
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingField, setUpdatingField] = useState('');
  const [deletingAttachmentId, setDeletingAttachmentId] = useState('');

  const canWrite = canEditTickets(role);
  const canDelete = canDeleteTicket(role, ticket, user?.id);
  const canModerate = canModerateComments(role);

  const loadTicket = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const data = await api.get(`/tickets/${ticketId}`);
        setTicket(data.ticket);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [ticketId]
  );

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleUpdated = (payload) => {
      if (payload?.id === ticketId) {
        setTicket(payload);
        refetchProject({ silent: true });
      }
    };
    const handleDeleted = (payload) => {
      if (payload?.ticketId === ticketId) {
        toast.info('This ticket was deleted by a project member.', 'Ticket removed');
        navigate(`/projects/${project.id}/board`, { replace: true });
      }
    };

    socket.on('ticket:updated', handleUpdated);
    socket.on('ticket:deleted', handleDeleted);
    return () => {
      socket.off('ticket:updated', handleUpdated);
      socket.off('ticket:deleted', handleDeleted);
    };
  }, [socket, ticketId, project.id, navigate, refetchProject, toast]);

  const updateField = async (field, value) => {
    setUpdatingField(field);
    try {
      const data = await api.patch(`/tickets/${ticket.id}`, { [field]: value });
      setTicket(data.ticket);
      toast.success(`${ticket.key} updated.`, 'Saved');
      refetchProject({ silent: true });
    } catch (err) {
      toast.error(err.message, 'Could not update ticket');
    } finally {
      setUpdatingField('');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tickets/${ticket.id}`);
      toast.success(`${ticket.key} was removed from the board.`, 'Ticket deleted');
      await refetchProject({ silent: true });
      await refetchProjects({ silent: true });
      navigate(`/projects/${project.id}/board`, { replace: true });
    } catch (err) {
      toast.error(err.message, 'Could not delete ticket');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleDeleteAttachment = async (attachment) => {
    setDeletingAttachmentId(attachment.id);
    try {
      const data = await api.delete(`/tickets/${ticket.id}/attachments/${attachment.id}`);
      setTicket(data.ticket);
      toast.success('Attachment removed.', 'Deleted');
    } catch (err) {
      toast.error(err.message, 'Could not remove attachment');
    } finally {
      setDeletingAttachmentId('');
    }
  };

  if (loading && !ticket) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-2/3" />
        <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Ticket unavailable"
        description={error}
        action={
          <Link to={`/projects/${project.id}/board`}>
            <Button variant="secondary" icon={ArrowLeft}>
              Back to board
            </Button>
          </Link>
        }
      />
    );
  }

  if (!ticket) return null;

  const overdue = isOverdue(ticket.dueDate, ticket.status);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/projects/${project.id}/board`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-brand-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to board
        </Link>
        <span className="text-[11px] text-slate-400">Updated {relativeTime(ticket.updatedAt)}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={ticket.type} />
            <span className="font-mono text-[11px] font-bold text-slate-400">{ticket.key}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.labels?.map((label) => (
              <Badge key={label} className="bg-slate-50 text-slate-500 ring-slate-200">
                <Tag className="h-2.5 w-2.5" />
                {label}
              </Badge>
            ))}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-slate-900">
            {ticket.title}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
            <span>Reported by {ticket.reporter?.name}</span>
            <span>·</span>
            <span>{formatDateTime(ticket.createdAt)}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {ticket.commentsCount} comments
            </span>
            {ticket.dueDate ? (
              <>
                <span>·</span>
                <span className={cn('inline-flex items-center gap-1', overdue && 'font-semibold text-red-600')}>
                  <CalendarDays className="h-3 w-3" />
                  Due {formatDate(ticket.dueDate)}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canWrite ? (
            <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          ) : null}
          {canDelete ? (
            <Button variant="danger-soft" icon={Trash2} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Description</h2>
            {ticket.description ? (
              <p className="mt-3 whitespace-pre-wrap text-[13px] leading-7 text-slate-600">
                {ticket.description}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-slate-400">No description was provided.</p>
            )}
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Paperclip className="h-4 w-4 text-slate-400" />
                Attachments
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
                  {ticket.attachments?.length || 0}
                </span>
              </h2>
              {canWrite ? (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  + Add files
                </button>
              ) : null}
            </div>
            <div className="mt-3">
              <AttachmentList
                attachments={ticket.attachments || []}
                canEdit={canWrite}
                onDelete={handleDeleteAttachment}
                deletingId={deletingAttachmentId}
              />
            </div>
          </section>

          <CommentThread
            ticketId={ticket.id}
            currentUser={user}
            canModerate={canModerate}
          />
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Ticket details</h2>

            <div className="space-y-4">
              <div>
                <span className="label">Status</span>
                {canWrite ? (
                  <select
                    value={ticket.status}
                    disabled={updatingField === 'status'}
                    onChange={(event) => updateField('status', event.target.value)}
                    className="input h-9 py-1.5 text-xs font-semibold"
                  >
                    {STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={ticket.status} />
                )}
              </div>

              <div>
                <span className="label">Assignee</span>
                {canWrite ? (
                  <select
                    value={ticket.assignee?.id || ''}
                    disabled={updatingField === 'assignee'}
                    onChange={(event) => updateField('assignee', event.target.value || null)}
                    className="input h-9 py-1.5 text-xs font-medium"
                  >
                    <option value="">Unassigned</option>
                    {project.members.map((member) => (
                      <option key={member.user.id} value={member.user.id}>
                        {member.user.name}
                      </option>
                    ))}
                  </select>
                ) : ticket.assignee ? (
                  <span className="flex items-center gap-2">
                    <Avatar user={ticket.assignee} size="xs" />
                    <span className="text-xs font-medium text-slate-600">{ticket.assignee.name}</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Unassigned</span>
                )}
              </div>

              <div>
                <span className="label">Priority</span>
                {canWrite ? (
                  <select
                    value={ticket.priority}
                    disabled={updatingField === 'priority'}
                    onChange={(event) => updateField('priority', event.target.value)}
                    className="input h-9 py-1.5 text-xs font-semibold"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <PriorityBadge priority={ticket.priority} />
                )}
              </div>
            </div>

            <div className="my-5 divider" />

            <dl className="space-y-3.5 text-xs">
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-2 text-slate-400">
                  <UserRound className="h-3.5 w-3.5" /> Reporter
                </dt>
                <dd className="flex items-center gap-1.5 text-right font-medium text-slate-600">
                  {ticket.reporter?.name}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-2 text-slate-400">
                  <Tag className="h-3.5 w-3.5" /> Type
                </dt>
                <dd>
                  <TypeBadge type={ticket.type} />
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-2 text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" /> Due date
                </dt>
                <dd className={cn('font-medium', overdue ? 'text-red-600' : 'text-slate-600')}>
                  {formatDate(ticket.dueDate)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-2 text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" /> Created
                </dt>
                <dd className="text-right font-medium text-slate-600">{formatDate(ticket.createdAt)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-2 text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" /> Updated
                </dt>
                <dd className="text-right font-medium text-slate-600">{relativeTime(ticket.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900">Project</h2>
            <Link
              to={`/projects/${project.id}/board`}
              className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-700"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
              {project.title}
              <span className="font-mono text-[10px] text-slate-400">({project.key})</span>
            </Link>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              Ticket keys increase sequentially within this project. Comments and changes sync live to everyone
              viewing the board.
            </p>
          </section>
        </aside>
      </div>

      {canWrite ? (
        <TicketFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          project={project}
          ticket={ticket}
          onSaved={async (updated) => {
            setTicket(updated);
            await loadTicket({ silent: true });
            refetchProject({ silent: true });
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete ${ticket.key}?`}
        description={`“${ticket.title}” and all of its comments and attachments will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete ticket"
      />
    </div>
  );
}
