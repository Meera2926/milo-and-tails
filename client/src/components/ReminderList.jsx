import { Link } from 'react-router-dom';
import { Syringe, Pill, CalendarClock } from 'lucide-react';
import { fmtDate, daysLabel } from '../lib/format';

const ICONS = { vaccination: Syringe, medication: Pill, appointment: CalendarClock };

const URGENCY = {
  overdue: 'border-coral/30 bg-coral-soft',
  soon: 'border-marigold/40 bg-marigold-soft',
  upcoming: 'border-line bg-surface',
  ongoing: 'border-line bg-surface',
};

const URGENCY_TEXT = {
  overdue: 'text-coral',
  soon: 'text-[#8A5B12]',
  upcoming: 'text-muted',
  ongoing: 'text-muted',
};

export default function ReminderList({ reminders = [], limit }) {
  const list = limit ? reminders.slice(0, limit) : reminders;

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
        Nothing due in this window. Add vaccination dates to keep the schedule ahead of you.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {list.map((r) => {
        const Icon = ICONS[r.kind] || CalendarClock;
        return (
          <li key={r.id}>
            <Link
              to={r.petId ? `/owner/pets/${r.petId}` : '#'}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-shadow hover:shadow-card ${URGENCY[r.urgency]}`}
            >
              <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${URGENCY_TEXT[r.urgency]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-snug">{r.title}</p>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {r.pet?.name ? `${r.pet.name} · ` : ''}
                  {r.detail}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${URGENCY_TEXT[r.urgency]}`}>
                  {daysLabel(r.daysAway)}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted">{fmtDate(r.date, 'd MMM')}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
