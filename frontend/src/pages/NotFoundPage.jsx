import { Link } from 'react-router-dom';
import { ArrowLeft, Bug } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-600/20">
        <Bug className="h-8 w-8 text-white" />
      </div>
      <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">This page wandered off</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        The page you are looking for does not exist, or you may not have access to it.
      </p>
      <Link to="/" className="mt-6">
        <Button icon={ArrowLeft}>Back to dashboard</Button>
      </Link>
    </div>
  );
}
