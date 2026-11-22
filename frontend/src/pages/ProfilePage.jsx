import { useState } from 'react';
import { Check, KeyRound, Lock, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, tokenStore } from '../lib/api';
import { AVATAR_COLORS } from '../lib/constants';
import { cn } from '../lib/cn';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({ name: user?.name || '', avatarColor: user?.avatarColor || AVATAR_COLORS[0] });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleProfile = async (event) => {
    event.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      const data = await api.patch('/auth/me', {
        name: profile.name.trim(),
        avatarColor: profile.avatarColor,
      });
      setUser(data.user);
      toast.success('Your profile was updated.', 'Saved');
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');

    if (passwords.newPassword.length < 8) {
      setPasswordError('Your new password must be at least 8 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const data = await api.patch('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (data.token) tokenStore.set(data.token);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Your password has been changed.', 'Security updated');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Your profile"
        description="Manage how you appear to teammates and keep your account secure."
        breadcrumbs={[{ label: 'Profile' }]}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-brand-600 via-violet-600 to-brand-500" />
            <div className="px-5 pb-5">
              <div className="-mt-9 flex items-end justify-between">
                <Avatar user={{ ...user, avatarColor: profile.avatarColor }} size="xl" ring className="ring-4 ring-white" />
                <Badge className="mb-1 bg-brand-50 text-brand-700 ring-brand-200">
                  {user?.role === 'admin' ? 'Global admin' : 'Member'}
                </Badge>
              </div>
              <h2 className="mt-3 text-lg font-bold text-slate-900">{user?.name}</h2>
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Mail className="h-3 w-3" />
                {user?.email}
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Your avatar and name appear on tickets, comments and project member lists.
              </p>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              Account & security
            </h2>
            <ul className="mt-3 space-y-2.5 text-[11px] leading-5 text-slate-500">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Passwords are hashed with bcrypt and never stored in plain text.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Sessions use signed JWT tokens and expire automatically.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Project access is enforced by role on every API request.
              </li>
            </ul>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserRound className="h-4 w-4 text-slate-400" />
              Profile details
            </h2>
            <form onSubmit={handleProfile} className="mt-4 space-y-4">
              {profileError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{profileError}</div>
              ) : null}

              <Input
                label="Full name"
                value={profile.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                maxLength={60}
                required
              />

              <div>
                <span className="label">Avatar color</span>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProfile((current) => ({ ...current, avatarColor: color }))}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 transition',
                        profile.avatarColor === color
                          ? 'scale-110 border-slate-900 ring-2 ring-white'
                          : 'border-white hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Use avatar color ${color}`}
                    >
                      {profile.avatarColor === color ? <Check className="h-4 w-4 text-white" /> : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <Button type="submit" icon={Save} loading={savingProfile}>
                  Save profile
                </Button>
              </div>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <KeyRound className="h-4 w-4 text-slate-400" />
              Change password
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Use at least 8 characters. You will stay signed in on this device.
            </p>

            <form onSubmit={handlePassword} className="mt-4 space-y-4">
              {passwordError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{passwordError}</div>
              ) : null}

              <Input
                label="Current password"
                type="password"
                icon={Lock}
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, currentPassword: event.target.value }))
                }
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="New password"
                  type="password"
                  icon={Lock}
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  required
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  icon={Lock}
                  autoComplete="new-password"
                  value={passwords.confirmPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <Button type="submit" variant="secondary" loading={savingPassword}>
                  Update password
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
