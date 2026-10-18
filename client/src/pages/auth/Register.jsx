import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PawPrint, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../api/client';
import Logo from '../../components/Logo';
import { ErrorNote } from '../../components/ui';

const ROLES = [
  { id: 'owner', label: 'Pet owner', icon: PawPrint, blurb: 'Track your pets and book services.' },
  { id: 'provider', label: 'Vet or service provider', icon: Stethoscope, blurb: 'List services and take bookings.' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', phone: '', city: '',
    role: params.get('role') === 'provider' ? 'provider' : 'owner',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      const user = await register({ ...payload, email: payload.email.trim() });
      toast.success('Account created');
      navigate(user.role === 'provider' ? '/provider/profile' : '/owner', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not create the account.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-10">
      <Link to="/"><Logo /></Link>
      <h1 className="mt-8 text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-muted">One account covers every pet you look after, or every service you offer.</p>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <ErrorNote message={error} />

        <fieldset>
          <legend className="label">I am joining as</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLES.map(({ id, label, icon: Icon, blurb }) => (
              <label
                key={id}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                  form.role === id ? 'border-moss bg-moss-soft' : 'border-line bg-surface hover:border-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={id}
                  checked={form.role === id}
                  onChange={set('role')}
                  className="sr-only"
                />
                <Icon className={`h-5 w-5 ${form.role === id ? 'text-moss-deep' : 'text-muted'}`} />
                <p className="mt-2 text-[14px] font-semibold">{label}</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{blurb}</p>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" required className="input" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={set('email')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" className="input" value={form.phone} onChange={set('phone')} placeholder="Optional" />
          </div>
          <div>
            <label className="label" htmlFor="city">City</label>
            <input id="city" className="input" value={form.city} onChange={set('city')} placeholder="Helps match nearby providers" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={6} autoComplete="new-password" className="input" value={form.password} onChange={set('password')} />
            <p className="hint">At least 6 characters.</p>
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" required autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} />
          </div>
        </div>

        {form.role === 'provider' && (
          <p className="rounded-xl bg-marigold-soft px-4 py-3 text-[13px] leading-relaxed text-[#8A5B12]">
            After signing up you will set up your business profile. An administrator verifies it before your services
            appear in search and you can accept bookings.
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-moss-deep underline underline-offset-2">Sign in</Link>
      </p>
    </div>
  );
}
