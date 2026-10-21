import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState, StatCard, RatingStars, Avatar } from '../../components/ui';
import { fmtDate } from '../../lib/format';

export default function ProviderReviews() {
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/providers/me');
        setProvider(me.data);
        if (me.data) {
          const { data } = await api.get(`/reviews/provider/${me.data._id}`);
          setReviews(data);
        }
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader label="Loading reviews" />;

  const spread = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));
  const max = Math.max(1, ...spread.map((s) => s.count));

  return (
    <>
      <PageHeader
        eyebrow="Service provider"
        title="Ratings and reviews"
        description="Only owners whose booking you marked completed can leave a review."
      />

      <ErrorNote message={error} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Average rating"
          value={provider?.rating?.count ? provider.rating.average.toFixed(1) : '—'}
          sub={`out of 5 · ${provider?.rating?.count || 0} review${provider?.rating?.count === 1 ? '' : 's'}`}
          icon={Star}
          tone="marigold"
        />
        <StatCard label="Completed bookings" value={provider?.completedBookings || 0} />
        <div className="card card-pad">
          <p className="text-[13px] font-medium text-muted">Rating spread</p>
          <ul className="mt-3 space-y-1.5">
            {spread.map(({ n, count }) => (
              <li key={n} className="flex items-center gap-2.5">
                <span className="w-3 font-mono text-[11px] text-muted">{n}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                  <span className="block h-full rounded-full bg-marigold" style={{ width: `${(count / max) * 100}%` }} />
                </span>
                <span className="w-4 text-right font-mono text-[11px] text-muted">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">What owners said</h2>
        {reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Complete a booking and the owner will be invited to rate the service."
          />
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r._id} className="card card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.owner?.name} src={r.owner?.avatar} />
                    <div>
                      <p className="text-[14px] font-semibold">{r.owner?.name}</p>
                      {r.pet?.name && <p className="text-[12.5px] text-muted">for {r.pet.name} · {r.pet.animalType}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <RatingStars value={r.rating} showNumber={false} />
                    <p className="mt-0.5 font-mono text-[11px] text-muted">{fmtDate(r.createdAt)}</p>
                  </div>
                </div>
                {r.comment && <p className="mt-3 text-[14px] leading-relaxed text-muted">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
