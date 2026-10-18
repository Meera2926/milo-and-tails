import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Field, ErrorNote, Badge, Avatar } from '../components/ui';
import { fmtDate } from '../lib/format';

const ROLE_LABEL = { owner: 'Pet owner', provider: 'Service provider', admin: 'Administrator' };

export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '', phone: user?.phone || '', city: user?.city || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    try {
      const { data } = await api.put('/auth/me', profile);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      setError('The two new passwords do not match.');
      return;
    }
    setSavingPassword(true);
    setError('');
    try {
      await api.put('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password updated');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Account" title="Your account" description="Update your contact details or change your password." />

      <ErrorNote message={error} />

      <div className="mb-6 card card-pad flex flex-wrap items-center gap-4">
        <Avatar name={user?.name} src={user?.avatar} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold">{user?.name}</p>
          <p className="text-[13px] text-muted">{user?.email}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
            Member since {fmtDate(user?.createdAt, 'MMMM yyyy')}
          </p>
        </div>
        <Badge tone="pine">{ROLE_LABEL[user?.role]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card card-pad space-y-4">
          <h2 className="text-lg font-semibold">Contact details</h2>
          <Field label="Full name" required>
            <input required className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </Field>
          <Field label="Phone" hint="Providers use this to reach you about a booking.">
            <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </Field>
          <Field label="City">
            <input className="input" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
          </Field>
          <Field label="Email" hint="Your email is used to sign in and cannot be changed here.">
            <input className="input" value={user?.email || ''} disabled />
          </Field>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <form onSubmit={changePassword} className="card card-pad space-y-4">
          <h2 className="text-lg font-semibold">Change password</h2>
          <Field label="Current password" required>
            <input type="password" required autoComplete="current-password" className="input" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
          </Field>
          <Field label="New password" required hint="At least 6 characters.">
            <input type="password" required minLength={6} autoComplete="new-password" className="input" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
          </Field>
          <Field label="Confirm new password" required>
            <input type="password" required autoComplete="new-password" className="input" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
          </Field>
          <button type="submit" className="btn-primary" disabled={savingPassword}>
            {savingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </>
  );
}
