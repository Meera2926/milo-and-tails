import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../api/client';
import Logo from '../../components/Logo';
import { ErrorNote } from '../../components/ui';

const HOME_FOR = { owner: '/owner', provider: '/provider', admin: '/admin' };

const DEMO = [
  { label: 'Pet owner', email: 'priya@example.com', password: 'owner123' },
  { label: 'Vet / provider', email: 'vet@example.com', password: 'provider123' },
  { label: 'Admin', email: 'admin@miloandtails.com', password: 'admin123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(params.get('expired') ? 'Your session expired. Sign in again.' : '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(location.state?.from || HOME_FOR[user.role] || '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in. Check your details and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/"><Logo /></Link>
          <h1 className="mt-8 text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Pick up where you left off with your pets and bookings.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <ErrorNote message={error} />
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted">
            New here?{' '}
            <Link to="/register" className="font-semibold text-moss-deep underline underline-offset-2">
              Create an account
            </Link>
          </p>

          <div className="mt-8 rounded-xl border border-dashed border-line p-4">
            <p className="eyebrow">Demo accounts</p>
            <div className="mt-2.5 space-y-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => setForm({ email: d.email, password: d.password })}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-canvas"
                >
                  <span className="font-semibold">{d.label}</span>
                  <span className="font-mono text-muted">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden bg-pine px-16 py-16 lg:flex lg:flex-col lg:justify-center">
        <blockquote className="max-w-md">
          <p className="font-display text-[30px] font-semibold leading-tight text-white">
            &ldquo;The vaccination card lives in a drawer. The pet does not.&rdquo;
          </p>
          <p className="mt-5 text-[14px] leading-relaxed text-white/70">
            Milo &amp; Tails puts the passport, the reminders and the collar tag in the same place — so the
            information is with you when it actually matters.
          </p>
        </blockquote>
      </aside>
    </div>
  );
}
