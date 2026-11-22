import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
      <Link to="/" className="flex items-center gap-1 rounded px-1 py-0.5 transition hover:text-brand-700">
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Dashboard</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
            {item.to && !isLast ? (
              <Link to={item.to} className="truncate rounded px-1 py-0.5 transition hover:text-brand-700">
                {item.label}
              </Link>
            ) : (
              <span className="truncate px-1 py-0.5 text-slate-700">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
