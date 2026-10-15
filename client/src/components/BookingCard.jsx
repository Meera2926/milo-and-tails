import { CalendarDays, Clock, PawPrint } from 'lucide-react';
import { StatusBadge } from './ui';
import { fmtDate, money } from '../lib/format';

export default function BookingCard({ booking, perspective = 'owner', actions }) {
  const counterparty =
    perspective === 'owner' ? booking.provider?.businessName : booking.owner?.name;
  const counterpartyLabel = perspective === 'owner' ? 'Provider' : 'Pet owner';

  return (
    <article className="card card-pad">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{booking.service?.category}</p>
          <h3 className="mt-1 font-display text-[17px] font-semibold">{booking.service?.title}</h3>
          <p className="mt-0.5 text-[13px] text-muted">
            {counterpartyLabel}: <span className="font-medium text-ink">{counterparty || '—'}</span>
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[13px] sm:grid-cols-4">
        <div>
          <dt className="flex items-center gap-1.5 text-muted"><PawPrint className="h-3.5 w-3.5" /> Pet</dt>
          <dd className="mt-0.5 font-medium">{booking.pet?.name}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-muted"><CalendarDays className="h-3.5 w-3.5" /> Date</dt>
          <dd className="mt-0.5 font-mono font-medium">{fmtDate(booking.date)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-muted"><Clock className="h-3.5 w-3.5" /> Slot</dt>
          <dd className="mt-0.5 font-mono font-medium">{booking.timeSlot}</dd>
        </div>
        <div>
          <dt className="text-muted">Price</dt>
          <dd className="mt-0.5 font-mono font-medium">{money(booking.price)}</dd>
        </div>
      </dl>

      {booking.notes && (
        <p className="mt-3 rounded-xl bg-canvas px-3.5 py-2.5 text-[13px] text-muted">
          <span className="font-semibold text-ink">Note from owner: </span>
          {booking.notes}
        </p>
      )}
      {booking.statusReason && (
        <p className="mt-3 rounded-xl bg-coral-soft px-3.5 py-2.5 text-[13px] text-coral">{booking.statusReason}</p>
      )}
      {actions && <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">{actions}</div>}
    </article>
  );
}
