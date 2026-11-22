import { Link } from 'react-router-dom';
import { Bug, CheckCircle2, GripVertical, MessageSquare, Zap } from 'lucide-react';

const FEATURES = [
  'Kanban boards with drag-and-drop status updates',
  'Threaded comments, attachments and @team collaboration',
  'Role-based access for admins, managers, developers and viewers',
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative">
          <Link to="/login" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-900/60">
              <Bug className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-xl font-extrabold tracking-tight">BugTrack</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Ship better software
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-brand-200">
            <Zap className="h-3 w-3" />
            Built for agile teams
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-[44px]">
            Every bug tracked.
            <br />
            Every release <span className="text-brand-300">on time.</span>
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            A Jira-style issue tracker that keeps product, design and engineering in sync — from the
            first bug report to the final release.
          </p>

          <ul className="mt-7 space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Aurora Web App · Sprint 12
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'To Do', color: 'bg-slate-400', cards: ['Checkout crash', 'Dark mode'] },
                { label: 'In Progress', color: 'bg-blue-400', cards: ['CSV export'] },
                { label: 'Done', color: 'bg-emerald-400', cards: ['Mobile avatar', 'Tailwind'] },
              ].map((column) => (
                <div key={column.label} className="rounded-lg bg-slate-900/80 p-2">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${column.color}`} />
                    <span className="text-[9px] font-semibold text-slate-400">{column.label}</span>
                  </div>
                  <div className="space-y-1.5">
                    {column.cards.map((card) => (
                      <div
                        key={card}
                        className="flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.05] px-1.5 py-1.5 text-[8px] text-slate-300"
                      >
                        <GripVertical className="h-2.5 w-2.5 text-slate-600" />
                        <span className="truncate">{card}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
            <MessageSquare className="h-3.5 w-3.5" />
          </span>
          Trusted by teams who care about the details.
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-600/25">
              <Bug className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-900">BugTrack</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Issue tracker
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
