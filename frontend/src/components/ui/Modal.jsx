import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  hideClose = false,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px] animate-fade-in"
        aria-label="Close dialog"
        onClick={() => onClose?.()}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        className={cn(
          'relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl animate-scale-in sm:rounded-2xl',
          SIZES[size] || SIZES.md,
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div className="min-w-0">
              {title ? <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2> : null}
              {description ? (
                <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
              ) : null}
            </div>
            {!hideClose ? (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="-mr-1 -mt-1 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        )}

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
