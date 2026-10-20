import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Inbox, CheckCircle2, Star, AlertTriangle, Store } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, StatCard, EmptyState, Badge, RatingStars } from '../../components/ui';
import { money, fmtDate } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

const STATUS_NOTE = {
  pending: {
    tone: 'marigold',
    title: 'Your profile is waiting for verification',
    body: 'An administrator reviews new providers before their services appear in search. You can keep editing your profile in the meantime.',
  },
  rejected: {
    tone: 'coral',
    title: 'Your profile was not approved',
    body: 'Update the details below and save — saving sends it back for review automatically.',
  },
};

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    api.get('/providers/me/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => {
        if (err.response?.status === 404) setNoProfile(true);
        else setError(errorMessage(err));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading your dashboard" />;

  if (noProfile) {
    return (
      <>
        <PageHeader eyebrow="Service provider" title={`Welcome, ${user?.name?.split(' ')[0]}`} />
        <EmptyState
          icon={Store}
          title="Set up your business profile"
          description="Tell pet owners what you offer, where you work and which animals you handle. An administrator verifies it before your services go live."
          action={<Link to="/provider/profile" className="btn-primary mt-2">Create profile</Link>}
        />
      </>
    );
  }

  const note = STATUS_NOTE[stats.provider.status];

  return (
    <>
      <PageHeader
        eyebrow="Service provider"
        title={stats.provider.businessName}
        description={`${stats.provider.city} · ${stats.provider.experienceYears} years of experience`}
        actions={
          <>
            <Link to="/provider/services" className="btn-outline">Manage services</Link>
            <Link to="/provider/bookings" className="btn-primary">Booking requests</Link>
          </>
        }
      />

      <ErrorNote message={error} />

      {note && (
        <div className={`mb-6 flex items-start gap-3 rounded-2xl border px-5 py-4 ${note.tone === 'coral' ? 'border-coral/30 bg-coral-soft' : 'border-marigold/40 bg-marigold-soft'}`}>
          <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${note.tone === 'coral' ? 'text-coral' : 'text-[#8A5B12]'}`} />
          <div>
            <p className={`font-semibold ${note.tone === 'coral' ? 'text-coral' : 'text-[#8A5B12]'}`}>{note.title}</p>
            <p className={`mt-0.5 text-[13px] ${note.tone === 'coral' ? 'text-coral/85' : 'text-[#8A5B12]/85'}`}>{note.body}</p>
            {stats.provider.rejectionReason && (
              <p className="mt-2 rounded-lg bg-surface/70 px-3 py-2 text-[13px] text-coral">
                Reason given: {stats.provider.rejectionReason}
              </p>
            )}
            <Link to="/provider/profile" className="btn-outline btn-sm mt-3">Open profile</Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New requests"
          value={stats.requested}
          sub={stats.requested ? 'Waiting on your reply' : 'Nothing waiting'}
          icon={Inbox}
          tone={stats.requested ? 'marigold' : 'default'}
        />
        <StatCard label="Accepted" value={stats.accepted} sub="Scheduled work" icon={ClipboardList} />
        <StatCard label="Completed" value={stats.completed} sub={`${money(stats.totalEarnings)} earned`} icon={CheckCircle2} tone="moss" />
        <StatCard
          label="Rating"
          value={stats.provider.rating.count ? stats.provider.rating.average.toFixed(1) : '—'}
          sub={`${stats.provider.rating.count} review${stats.provider.rating.count === 1 ? '' : 's'}`}
          icon={Star}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Your listing at a glance</h2>
          <dl className="mt-4 space-y-3 text-[13.5px]">
            {[
              ['Verification', <Badge key="s" tone={stats.provider.status === 'verified' ? 'moss' : stats.provider.status === 'rejected' ? 'coral' : 'marigold'}>{stats.provider.status}</Badge>],
              ['Active services', stats.activeServices],
              ['Categories', stats.provider.categories.join(', ') || 'None yet'],
              ['Animals handled', stats.provider.handlesAnimalTypes.join(', ')],
              ['Sizes handled', stats.provider.handlesSizes.join(', ')],
              ['Open days', stats.provider.availability.map((a) => a.day).join(', ') || 'None set'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <Link to="/provider/profile" className="btn-outline btn-sm mt-4">Edit profile</Link>
        </section>

        <section className="card card-pad">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Latest reviews</h2>
            <Link to="/provider/reviews" className="text-[13px] font-semibold text-moss-deep hover:underline">All reviews</Link>
          </div>
          {stats.recentReviews.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
              No reviews yet. Owners can review you once a booking is marked completed.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {stats.recentReviews.map((r) => (
                <li key={r._id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-semibold">{r.owner?.name}</p>
                    <span className="font-mono text-[11px] text-muted">{fmtDate(r.createdAt, 'd MMM yy')}</span>
                  </div>
                  <div className="mt-1"><RatingStars value={r.rating} showNumber={false} /></div>
                  {r.comment && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
