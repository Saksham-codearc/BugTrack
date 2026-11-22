import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className, containerClassName, id, required, ...props },
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
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn('input', Icon && 'pl-10', error && 'border-red-300 focus:border-red-400 focus:ring-red-500/10', className)}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
      {!error && hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});

export default Input;
