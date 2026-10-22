import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Users } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState, Badge, Avatar, ConfirmButton, Tabs } from '../../components/ui';
import { fmtDate } from '../../lib/format';

const TABS = [
  { id: 'all', label: 'Everyone' },
  { id: 'owner', label: 'Pet owners' },
  { id: 'provider', label: 'Providers' },
  { id: 'admin', label: 'Admins' },
];

const ROLE_TONE = { owner: 'moss', provider: 'marigold', admin: 'pine' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (user) => {
    try {
      const { data } = await api.patch(`/admin/users/${user._id}/active`);
      setUsers((list) => list.map((u) => (u._id === user._id ? { ...u, isActive: data.isActive } : u)));
      toast.success(data.isActive ? 'Account reactivated' : 'Account deactivated');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Loading users" />;

  const counts = TABS.reduce(
    (acc, t) => ({ ...acc, [t.id]: t.id === 'all' ? users.length : users.filter((u) => u.role === t.id).length }),
    {}
  );

  const filtered = users
    .filter((u) => tab === 'all' || u.role === tab)
    .filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        eyebrow="Administrator"
        title="Users"
        description="Every registered account. Deactivating one blocks sign-in without deleting their records."
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        }
      />

      <ErrorNote message={error} onRetry={load} />
      <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.id] }))} active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users match" description="Try a different search term or tab." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[11.5px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} src={u.avatar || undefined} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium">{u.name}</p>
                        <p className="truncate text-[12px] text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge></td>
                  <td className="px-5 py-3 text-muted">{u.city || '—'}</td>
                  <td className="px-5 py-3 font-mono text-[12px] text-muted">{fmtDate(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={u.isActive ? 'moss' : 'coral'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.role !== 'admin' && (
                      <ConfirmButton
                        className={u.isActive ? 'btn-outline btn-sm' : 'btn-secondary btn-sm'}
                        question={u.isActive ? `Deactivate ${u.name}? They will not be able to sign in.` : `Reactivate ${u.name}?`}
                        onConfirm={() => toggleActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </ConfirmButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
