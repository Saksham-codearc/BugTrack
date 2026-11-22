import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/constants';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`, 'Signed in');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const useDemo = (account) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Welcome back</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Sign in to BugTrack</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Pick up where your team left off — boards, tickets and discussions are waiting.
        </p>
      </div>

      {error ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          icon={Mail}
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-[34px] rounded-md p-1 text-slate-400 transition hover:text-slate-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Button type="submit" className="w-full" loading={submitting} iconRight={ArrowRight}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-3.5 w-3.5 text-slate-400" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Demo accounts</p>
        </div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          After running the seed script, click an account to fill the form. Password:{' '}
          <span className="font-mono font-semibold text-slate-700">{DEMO_PASSWORD}</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => useDemo(account)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
            >
              <span className="block text-[11px] font-semibold text-slate-800">{account.label}</span>
              <span className="block text-[10px] text-slate-400">{account.role}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to BugTrack?{' '}
        <Link to="/register" className="font-semibold text-brand-600 transition hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
