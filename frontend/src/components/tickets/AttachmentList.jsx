import { Download, FileText, Trash2 } from 'lucide-react';
import { assetUrl } from '../../lib/api';
import { formatBytes, formatDate } from '../../lib/format';

export default function AttachmentList({ attachments = [], canEdit = false, onDelete, deletingId }) {
  if (!attachments.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-400">
        No attachments yet. Add screenshots from the edit dialog.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => {
        const isImage = attachment.mimetype?.startsWith('image/');
        return (
          <div
            key={attachment.id}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            {isImage ? (
              <a
                href={assetUrl(attachment.url)}
                target="_blank"
                rel="noreferrer"
                className="block h-32 overflow-hidden bg-slate-100"
                title={`Open ${attachment.originalName}`}
              >
                <img
                  src={assetUrl(attachment.url)}
                  alt={attachment.originalName}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </a>
            ) : (
              <a
                href={assetUrl(attachment.url)}
                target="_blank"
                rel="noreferrer"
                className="flex h-32 items-center justify-center bg-slate-50"
              >
                <FileText className="h-10 w-10 text-slate-400" />
              </a>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-2.5">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-slate-700">{attachment.originalName}</p>
                <p className="text-[10px] text-slate-400">
                  {formatBytes(attachment.size)} · {formatDate(attachment.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <a
                  href={assetUrl(attachment.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={`Download ${attachment.originalName}`}
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => onDelete?.(attachment)}
                    disabled={deletingId === attachment.id}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label={`Delete ${attachment.originalName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
