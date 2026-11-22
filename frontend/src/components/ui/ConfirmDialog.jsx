import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  tone = 'danger',
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      hideClose={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={
            tone === 'danger'
              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50'
              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50'
          }
        >
          <AlertTriangle className={tone === 'danger' ? 'h-5 w-5 text-red-600' : 'h-5 w-5 text-brand-600'} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </Modal>
  );
}
