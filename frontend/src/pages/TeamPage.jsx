import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Crown,
  Mail,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import { RoleBadge } from '../components/tickets/TicketBadges';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import { api } from '../lib/api';
import { ROLES, ROLE_MAP } from '../lib/constants';

const ROLE_ORDER = { admin: 4, manager: 3, developer: 2, viewer: 1 };

export default function TeamPage() {
  const { project, role, canManage, refetchProject, refetchProjects } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [updatingMember, setUpdatingMember] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const debouncedEmail = useDebounce(email, 300);

  useEffect(() => {
    let active = true;
    if (!canManage || debouncedEmail.trim().length < 2) {
      setSuggestions([]);
      return () => {
        active = false;
      };
    }
    api
      .get(`/users?q=${encodeURIComponent(debouncedEmail.trim())}`)
      .then((data) => {
        if (active) {
          const memberIds = new Set(project.members.map((member) => member.user.id));
          setSuggestions((data.users || []).filter((candidate) => !memberIds.has(candidate.id)));
        }
      })
      .catch(() => {
        if (active) setSuggestions([]);
      });
    return () => {
      active = false;
    };
  }, [debouncedEmail, canManage, project.members]);

  const members = useMemo(
    () =>
      [...project.members].sort((a, b) => {
        if (a.user.id === project.owner?.id) return -1;
        if (b.user.id === project.owner?.id) return 1;
        const rank = (ROLE_ORDER[b.role] || 0) - (ROLE_ORDER[a.role] || 0);
        return rank || a.user.name.localeCompare(b.user.name);
      }),
    [project.members, project.owner]
  );

  const inviteRoleOptions = role === 'admin'
    ? ROLES
    : ROLES.filter((item) => ['developer', 'viewer'].includes(item.value));

  const handleInvite = async (event) => {
    event.preventDefault();
    setInviteError('');
    if (!email.trim()) return;
    setInviting(true);
    try {
      const data = await api.post(`/projects/${project.id}/members`, {
        email: email.trim(),
        role: inviteRole,
      });
      toast.success(data.message || 'Member added to the project.', 'Team updated');
      setEmail('');
      setSuggestions([]);
      await refetchProject({ silent: true });
      await refetchProjects({ silent: true });
    } catch (error) {
      setInviteError(error.message);
    } finally {
      setInviting(false);
    }
  };

  const canChangeRole = (member) => {
    if (!canManage) return false;
    if (member.user.id === project.owner?.id) return false;
    if (role === 'admin') return true;
    return ['developer', 'viewer'].includes(member.role);
  };

  const availableRoleOptions = role === 'admin'
    ? ROLES
    : ROLES.filter((item) => ['developer', 'viewer'].includes(item.value));

  const handleRoleChange = async (member, newRole) => {
    setUpdatingMember(member.user.id);
    try {
      await api.patch(`/projects/${project.id}/members/${member.user.id}`, { role: newRole });
      toast.success(`${member.user.name} is now a ${ROLE_MAP[newRole]?.label.toLowerCase()}.`, 'Role updated');
      await refetchProject({ silent: true });
      await refetchProjects({ silent: true });
    } catch (error) {
      toast.error(error.message, 'Could not update role');
    } finally {
      setUpdatingMember(null);
    }
  };

  const canRemove = (member) =>
    canManage &&
    member.user.id !== project.owner?.id &&
    member.user.id !== user?.id &&
    (role === 'admin' || ['developer', 'viewer'].includes(member.role));

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/projects/${project.id}/members/${removeTarget.user.id}`);
      toast.success(`${removeTarget.user.name} was removed from ${project.title}.`, 'Member removed');
      setRemoveTarget(null);
      await refetchProject({ silent: true });
      await refetchProjects({ silent: true });
    } catch (error) {
      toast.error(error.message, 'Could not remove member');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Users className="h-4 w-4 text-slate-400" />
              Team members
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {members.length} member{members.length === 1 ? '' : 's'} in this project
            </p>
          </div>
          <RoleBadge role={role} />
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => {
            const isOwner = member.user.id === project.owner?.id;
            const isYou = member.user.id === user?.id;
            const editable = canChangeRole(member);
            return (
              <div key={member.user.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar user={member.user} size="md" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-slate-800">{member.user.name}</p>
                      {isYou ? (
                        <Badge className="bg-brand-50 text-brand-600 ring-brand-100">You</Badge>
                      ) : null}
                      {isOwner ? (
                        <Badge className="bg-amber-50 text-amber-700 ring-amber-200">
                          <Crown className="h-2.5 w-2.5" /> Owner
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-slate-400">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-12 sm:pl-0">
                  {editable ? (
                    <select
                      value={member.role}
                      onChange={(event) => handleRoleChange(member, event.target.value)}
                      disabled={updatingMember === member.user.id}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:opacity-50"
                      aria-label={`Role for ${member.user.name}`}
                    >
                      {availableRoleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}

                  {canRemove(member) ? (
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(member)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Remove member"
                      aria-label={`Remove ${member.user.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="space-y-5">
        {canManage ? (
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserPlus className="h-4 w-4 text-slate-400" />
              Invite a teammate
            </h2>
            <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
              Add an existing BugTrack account by email. They will appear on the board immediately.
            </p>

            <form onSubmit={handleInvite} className="mt-4 space-y-3.5">
              {inviteError ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {inviteError}
                </div>
              ) : null}

              <div className="relative">
                <Input
                  label="Email address"
                  type="email"
                  icon={Mail}
                  placeholder="teammate@company.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setInviteError('');
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                  required
                />

                {showSuggestions && suggestions.length > 0 ? (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lift">
                    <p className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Matching accounts
                    </p>
                    {suggestions.slice(0, 5).map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setEmail(candidate.email);
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                      >
                        <Avatar user={candidate} size="xs" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-slate-700">
                            {candidate.name}
                          </span>
                          <span className="block truncate text-[10px] text-slate-400">{candidate.email}</span>
                        </span>
                        <Search className="h-3 w-3 text-slate-300" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <Select
                label="Project role"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
              >
                {inviteRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Button type="submit" className="w-full" icon={UserPlus} loading={inviting} disabled={!email.trim()}>
                Add to project
              </Button>
              <p className="text-[10px] leading-4 text-slate-400">
                No account yet? Ask them to register first, then invite their email.
              </p>
            </form>
          </section>
        ) : (
          <section className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Read-only team view</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your role is <strong>{ROLE_MAP[role]?.label}</strong>. Only managers and admins can invite or
              remove members. You can still comment on tickets and follow every update.
            </p>
          </section>
        )}

        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Shield className="h-4 w-4 text-slate-400" />
            Role permissions
          </h2>
          <div className="mt-4 space-y-3">
            {ROLES.map((item) => (
              <div key={item.value} className="flex gap-2.5">
                <span
                  className={
                    role === item.value
                      ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50'
                      : 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100'
                  }
                >
                  {role === item.value ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ShieldCheck className="h-3 w-3 text-slate-400" />
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <RoleBadge role={item.value} />
                    {role === item.value ? (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                        Your role
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        loading={removing}
        title={`Remove ${removeTarget?.user.name || 'this member'}?`}
        description={`They will immediately lose access to ${project.title} and its tickets. You can invite them again later.`}
        confirmLabel="Remove member"
      />
    </div>
  );
}
