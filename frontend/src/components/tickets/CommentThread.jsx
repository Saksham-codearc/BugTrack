import { useCallback, useEffect, useState } from 'react';
import {
  CornerDownRight,
  Loader2,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { formatDateTime, relativeTime } from '../../lib/format';
import { cn } from '../../lib/cn';

function CommentNode({
  comment,
  currentUser,
  canModerate,
  onReply,
  onEdit,
  onRequestDelete,
  depth = 0,
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [busy, setBusy] = useState(false);

  const isAuthor = comment.author?.id === currentUser?.id;
  const canDelete = isAuthor || canModerate;

  const submitReply = async (event) => {
    event.preventDefault();
    if (!replyText.trim()) return;
    setBusy(true);
    const ok = await onReply(comment.id, replyText.trim());
    setBusy(false);
    if (ok) {
      setReplyText('');
      setReplying(false);
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editText.trim() || editText.trim() === comment.text) {
      setEditing(false);
      return;
    }
    setBusy(true);
    const ok = await onEdit(comment.id, editText.trim());
    setBusy(false);
    if (ok) setEditing(false);
  };

  return (
    <div className={cn(depth > 0 && 'ml-4 border-l border-slate-200 pl-4 sm:ml-6 sm:pl-5')}>
      <div className="group flex gap-3 py-3">
        <Avatar user={comment.author} size="sm" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[13px] font-semibold text-slate-800">{comment.author?.name}</span>
            {isAuthor ? (
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-600">
                You
              </span>
            ) : null}
            <span
              className="text-[10px] text-slate-400"
              title={formatDateTime(comment.createdAt)}
            >
              {relativeTime(comment.createdAt)}
              {comment.updatedAt !== comment.createdAt ? ' · edited' : ''}
            </span>
          </div>

          {editing ? (
            <form onSubmit={submitEdit} className="mt-2">
              <textarea
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                rows={3}
                className="input text-sm"
                autoFocus
              />
              <div className="mt-2 flex items-center gap-2">
                <Button type="submit" size="sm" loading={busy} disabled={!editText.trim()}>
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setEditText(comment.text);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-6 text-slate-600">
              {comment.text}
            </p>
          )}

          {!editing ? (
            <div className="mt-1.5 flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              <button
                type="button"
                onClick={() => setReplying((value) => !value)}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <CornerDownRight className="h-3 w-3" />
                Reply
              </button>
              {isAuthor ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => onRequestDelete(comment)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}

          {replying ? (
            <form onSubmit={submitReply} className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                rows={2}
                placeholder={`Reply to ${comment.author?.name?.split(' ')[0] || 'this comment'}…`}
                className="input border-0 bg-transparent p-1 text-sm shadow-none focus:ring-0"
                autoFocus
              />
              <div className="mt-1.5 flex items-center justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => setReplying(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={busy} disabled={!replyText.trim()} icon={Send}>
                  Reply
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </div>

      {(comment.replies || []).map((reply) => (
        <CommentNode
          key={reply.id}
          comment={reply}
          currentUser={currentUser}
          canModerate={canModerate}
          onReply={onReply}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function CommentThread({ ticketId, currentUser, canModerate = false }) {
  const toast = useToast();
  const { socket } = useSocket();
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadComments = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const data = await api.get(`/tickets/${ticketId}/comments`);
        setComments(data.comments || []);
        setTotal(data.total || 0);
      } catch (error) {
        if (!silent) toast.error(error.message, 'Could not load comments');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [ticketId, toast]
  );

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = (payload) => {
      if (String(payload?.ticketId || payload?.ticket) === String(ticketId)) {
        loadComments({ silent: true });
      }
    };

    socket.on('comment:created', refresh);
    socket.on('comment:updated', refresh);
    socket.on('comment:deleted', refresh);

    return () => {
      socket.off('comment:created', refresh);
      socket.off('comment:updated', refresh);
      socket.off('comment:deleted', refresh);
    };
  }, [socket, ticketId, loadComments]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tickets/${ticketId}/comments`, { text: text.trim() });
      setText('');
      toast.success('Comment added to the discussion.', 'Comment posted');
      await loadComments({ silent: true });
    } catch (error) {
      toast.error(error.message, 'Could not post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (parentId, replyText) => {
    try {
      await api.post(`/tickets/${ticketId}/comments`, { text: replyText, parentId });
      toast.success('Reply added to the thread.', 'Reply posted');
      await loadComments({ silent: true });
      return true;
    } catch (error) {
      toast.error(error.message, 'Could not post reply');
      return false;
    }
  };

  const handleEdit = async (commentId, newText) => {
    try {
      await api.patch(`/comments/${commentId}`, { text: newText });
      toast.success('Comment updated.', 'Saved');
      await loadComments({ silent: true });
      return true;
    } catch (error) {
      toast.error(error.message, 'Could not update comment');
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const data = await api.delete(`/comments/${deleteTarget.id}`);
      toast.success(
        data.commentIds?.length > 1
          ? `${data.commentIds.length} comments removed.`
          : 'Comment removed.',
        'Deleted'
      );
      setDeleteTarget(null);
      await loadComments({ silent: true });
    } catch (error) {
      toast.error(error.message, 'Could not delete comment');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          Discussion
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
            {total}
          </span>
        </h2>
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex gap-3">
        <Avatar user={currentUser} size="sm" className="mt-1" />
        <div className="min-w-0 flex-1">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            placeholder="Add to the discussion… share findings, blockers or next steps."
            className="input resize-y text-sm"
            maxLength={2000}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">
              {text.length}/2000 · Everyone in this project can comment
            </span>
            <Button type="submit" size="sm" loading={posting} disabled={!text.trim()} icon={Send}>
              Comment
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-3 divider" />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading discussion…
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <MessageSquare className="h-8 w-8 text-slate-200" />
          <p className="mt-2 text-sm font-semibold text-slate-600">No comments yet</p>
          <p className="mt-0.5 text-xs text-slate-400">Start the conversation above.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              canModerate={canModerate}
              onReply={handleReply}
              onEdit={handleEdit}
              onRequestDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this comment?"
        description={
          deleteTarget?.replies?.length
            ? 'This comment has replies. Deleting it will also remove the whole thread.'
            : 'This cannot be undone. The thread will be removed for everyone.'
        }
        confirmLabel="Delete comment"
      />
    </section>
  );
}
