import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-16 w-16 text-lg',
};

export default function Avatar({ user, name, size = 'md', className, ring = false, title }) {
  const displayName = name || user?.name || 'Unknown';
  const color = user?.avatarColor || '#64748b';

  return (
    <span
      title={title || displayName}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold uppercase tracking-wide text-white',
        SIZES[size] || SIZES.md,
        ring && 'ring-2 ring-white',
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials(displayName)}
    </span>
  );
}

export function AvatarGroup({ members = [], max = 3, size = 'sm' }) {
  const visible = members.slice(0, max);
  const remaining = members.length - visible.length;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((member) => {
        const user = member.user || member;
        return <Avatar key={user.id || user.email} user={user} size={size} ring className="border border-white" />;
      })}
      {remaining > 0 ? (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full border border-white bg-slate-100 font-semibold text-slate-600 ring-2 ring-white',
            SIZES[size] || SIZES.sm
          )}
        >
          +{remaining}
        </span>
      ) : null}
    </div>
  );
}
