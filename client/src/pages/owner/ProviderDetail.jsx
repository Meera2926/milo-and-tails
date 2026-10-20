import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, BadgeCheck, Phone, Clock, CalendarPlus } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageLoader, ErrorNote, Badge, RatingStars, Avatar, EmptyState } from '../../components/ui';
import { money, fmtDate } from '../../lib/format';
import { CATEGORY_EMOJI } from '../../lib/constants';

export default function ProviderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.get(`/providers/${id}`)
      .then((res) => alive && setData(res.data))
      .catch((err) => alive && setError(errorMessage(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <PageLoader label="Loading provider" />;
  if (error) return <ErrorNote message={error} />;

  const { provider, services, reviews } = data;

  return (
    <>
      <Link to="/owner/services" className="btn-ghost btn-sm mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> All providers
      </Link>

      <header className="card card-pad mb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={provider.businessName} src={provider.photo || undefined} size="lg" className="h-16 w-16 text-base" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold">{provider.businessName}</h1>
              {provider.status === 'verified' && (
                <Badge tone="moss"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Badge>
              )}
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {provider.city}</span>
              {provider.experienceYears > 0 && <span>{provider.experienceYears} years of experience</span>}
              {provider.phone && (
                <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {provider.phone}</span>
              )}
            </p>
            <div className="mt-2">
              <RatingStars value={provider.rating?.average || 0} count={provider.rating?.count} size="lg" />
            </div>
            {provider.description && (
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">{provider.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(provider.categories || []).map((c) => (
                <Badge key={c} tone="moss"><span aria-hidden="true">{CATEGORY_EMOJI[c]}</span> {c}</Badge>
              ))}
              {(provider.handlesAnimalTypes || []).map((a) => (
                <Badge key={a}>{a}s</Badge>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Services offered</h2>
          {services.length === 0 ? (
            <EmptyState title="No services listed yet" description="This provider has not published any services." />
          ) : (
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s._id} className="card card-pad">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow">{s.category}</p>
                      <h3 className="mt-1 font-display text-[17px] font-semibold">{s.title}</h3>
                      {s.description && <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.description}</p>}
                      <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-muted">
                        <Clock className="h-3.5 w-3.5" /> {s.durationMins} minutes
                        {s.animalTypes?.length ? ` · for ${s.animalTypes.join(', ').toLowerCase()}s` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-lg font-semibold">{money(s.price)}</p>
                      <Link to={`/owner/book?serviceId=${s._id}`} className="btn-primary btn-sm mt-2">
                        <CalendarPlus className="h-4 w-4" /> Book
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <section className="card card-pad">
            <h2 className="text-lg font-semibold">Weekly availability</h2>
            {(provider.availability || []).length === 0 ? (
              <p className="mt-3 text-[13.5px] text-muted">No standing hours published. Slots may still be open on specific dates.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {provider.availability.map((a) => (
                  <li key={a.day} className="flex gap-3 border-b border-line pb-2.5 last:border-0">
                    <span className="w-10 shrink-0 font-mono text-[12px] font-semibold uppercase text-pine">{a.day}</span>
                    <span className="text-[12.5px] text-muted">{a.slots.join(' · ') || 'Closed'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card card-pad">
            <h2 className="text-lg font-semibold">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-muted">
                No reviews yet. Reviews can only be left by owners whose booking was completed.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <li key={r._id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.owner?.name} size="sm" />
                        <div>
                          <p className="text-[13.5px] font-semibold">{r.owner?.name}</p>
                          {r.pet?.name && <p className="text-[11.5px] text-muted">for {r.pet.name}</p>}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-muted">{fmtDate(r.createdAt, 'd MMM yy')}</span>
                    </div>
                    <div className="mt-2">
                      <RatingStars value={r.rating} showNumber={false} />
                    </div>
                    {r.comment && <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
