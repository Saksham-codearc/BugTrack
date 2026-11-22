import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, containerClassName, id, required, rows = 4, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={containerClassName}>
      {label ? (
        <label htmlFor={inputId} className="label">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={cn(
          'input resize-y leading-6',
          error && 'border-red-300 focus:border-red-400 focus:ring-red-500/10',
          className
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
      {!error && hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});

export default Textarea;
