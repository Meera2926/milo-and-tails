import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, PawPrint, Store, CalendarDays, ShieldCheck, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, StatCard } from '../../components/ui';
import { STATUS_STYLES } from '../../lib/constants';

const BAR_COLOURS = {
  Requested: '#E9A13B', Accepted: '#12836C', Completed: '#0E4A3C', Rejected: '#D9455F', Cancelled: '#B8C4BD',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
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

  if (loading) return <PageLoader label="Loading platform statistics" />;
  if (error) return <ErrorNote message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        eyebrow="Administrator"
        title="Platform overview"
        description="Who is on Milo & Tails, what they are booking, and what still needs a decision from you."
        actions={
          stats.pendingProviders > 0 && (
            <Link to="/admin/providers?status=pending" className="btn-primary">
              <ShieldCheck className="h-4 w-4" /> {stats.pendingProviders} provider{stats.pendingProviders === 1 ? '' : 's'} to review
            </Link>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.users.total} sub={`${stats.users.owners} owners · ${stats.users.providers} providers`} icon={Users} />
        <StatCard label="Pets registered" value={stats.pets} icon={PawPrint} />
        <StatCard label="Active services" value={stats.services} icon={Store} />
        <StatCard label="Total bookings" value={stats.bookings} sub={`${stats.bookingsLast30Days} in the last 30 days`} icon={CalendarDays} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting verification"
          value={stats.pendingProviders}
          sub={stats.pendingProviders ? 'Providers cannot take bookings until approved' : 'Queue is clear'}
          icon={ShieldCheck}
          tone={stats.pendingProviders ? 'marigold' : 'default'}
        />
        <StatCard label="Reviews left" value={stats.reviews} />
        <StatCard label="Lost-pet locations shared" value={stats.locationsShared} icon={MapPin} tone="moss" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Bookings by status</h2>
          {stats.bookingsByStatus.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">No bookings yet.</p>
          ) : (
            <>
              <div className="mt-5 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.bookingsByStatus} margin={{ top: 4, right: 8, bottom: 4, left: -22 }}>
                    <CartesianGrid stroke="#DCE5DF" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#5F6F69' }} axisLine={{ stroke: '#DCE5DF' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5F6F69' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(18,131,108,0.06)' }} />
                    <Bar dataKey="count" name="Bookings" radius={[6, 6, 0, 0]}>
                      {stats.bookingsByStatus.map((b) => (
                        <Cell key={b.status} fill={BAR_COLOURS[b.status] || '#12836C'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stats.bookingsByStatus.map((b) => (
                  <span key={b.status} className={`badge ${STATUS_STYLES[b.status]}`}>{b.status}: {b.count}</span>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Most-booked categories</h2>
          {stats.bookingsByCategory.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">No bookings yet.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {stats.bookingsByCategory.map((c) => {
                const max = stats.bookingsByCategory[0].count || 1;
                return (
                  <li key={c.category}>
                    <div className="flex items-center justify-between text-[13.5px]">
                      <span className="font-medium">{c.category}</span>
                      <span className="font-mono text-muted">{c.count}</span>
                    </div>
                    <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-canvas">
                      <span className="block h-full rounded-full bg-moss" style={{ width: `${(c.count / max) * 100}%` }} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
