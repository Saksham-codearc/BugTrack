import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

export default function Dropdown({ trigger, children, align = 'right', className, panelClassName }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div onClick={() => setOpen((value) => !value)} className="contents">
        {trigger}
      </div>
      {open ? (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({ children, className, icon: Icon, danger = false, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}
