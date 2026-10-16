import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { EmptyState, StatusBadge, RatingStars } from '../ui';
import { fmtDate, money } from '../../lib/format';
import { CATEGORY_EMOJI } from '../../lib/constants';

export default function PetServices({ pet, history = [], upcoming = [] }) {
  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Booked and waiting</h2>
          <ul className="mt-4 space-y-3">
            {upcoming.map((b) => (
              <li key={b._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3">
                <div>
                  <p className="text-[14px] font-semibold">
                    <span aria-hidden="true">{CATEGORY_EMOJI[b.service?.category]} </span>
                    {b.service?.title}
                  </p>
                  <p className="text-[12.5px] text-muted">
                    {b.provider?.businessName} · {fmtDate(b.date)} · {b.timeSlot}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Service history</h2>
        {history.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={`No completed services for ${pet.name} yet`}
            description="Vet visits, grooming, boarding, sitting, walking and training all appear here once a provider marks them complete."
            action={<Link to="/owner/services" className="btn-primary mt-2">Browse services</Link>}
          />
        ) : (
          <ul className="space-y-3">
            {history.map((b) => (
              <li key={b._id} className="card card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">{b.service?.category}</p>
                    <p className="mt-1 text-[15px] font-semibold">{b.service?.title}</p>
                    <p className="mt-0.5 text-[13px] text-muted">{b.provider?.businessName}</p>
                    {b.provider?.rating?.count > 0 && (
                      <div className="mt-1.5">
                        <RatingStars value={b.provider.rating.average} count={b.provider.rating.count} />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[13px] font-medium">{fmtDate(b.date)}</p>
                    <p className="mt-1 font-mono text-[13px] text-muted">{money(b.price)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
