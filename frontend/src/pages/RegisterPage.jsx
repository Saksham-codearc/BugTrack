import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    if (form.password.length < 8) {
      setFieldErrors({ password: 'Use at least 8 characters.' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password });
      toast.success(`Your workspace is ready, ${user.name.split(' ')[0]}.`, 'Account created');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      const mapped = {};
      (err.errors || []).forEach((item) => {
        mapped[item.field] = item.message;
      });
      setFieldErrors(mapped);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Get started</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Start tracking bugs in minutes. You can invite your team once your first project is created.
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
          label="Full name"
          icon={User}
          placeholder="Ada Lovelace"
          autoComplete="name"
          value={form.name}
          onChange={update('name')}
          error={fieldErrors.name}
          required
        />
        <Input
          label="Work email"
          type="email"
          icon={Mail}
          placeholder="you@company.com"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          error={fieldErrors.email}
          required
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            error={fieldErrors.password}
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
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="Repeat your password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button type="submit" className="w-full" loading={submitting} iconRight={ArrowRight}>
          Create account
        </Button>
        <p className="text-center text-[11px] leading-5 text-slate-400">
          By creating an account you agree to keep your team’s bug reports constructive.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 transition hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
