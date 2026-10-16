import { useEffect, useState } from 'react';
import { Syringe, Stethoscope, Pill, Scale, CalendarDays } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { Spinner, ErrorNote } from '../ui';
import { fmtDate } from '../../lib/format';

const KIND = {
  vaccination: { icon: Syringe, ring: 'bg-moss-soft text-moss-deep' },
  health: { icon: Stethoscope, ring: 'bg-pine/10 text-pine' },
  medication: { icon: Pill, ring: 'bg-marigold-soft text-[#8A5B12]' },
  weight: { icon: Scale, ring: 'bg-canvas text-muted' },
  service: { icon: CalendarDays, ring: 'bg-moss-soft text-moss-deep' },
};

const FILTERS = [
  ['all', 'Everything'],
  ['vaccination', 'Vaccinations'],
  ['health', 'Vet & treatment'],
  ['medication', 'Medication'],
  ['service', 'Services'],
  ['weight', 'Weight'],
];

export default function PetTimeline({ pet }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/pets/${pet._id}/timeline`);
        if (alive) setEvents(data.events);
      } catch (err) {
        if (alive) setError(errorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pet._id]);

  if (loading) return <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>;

  const shown = filter === 'all' ? events : events.filter((e) => e.kind === filter);

  // Group by month so the reader can scan a long history quickly
  const groups = shown.reduce((acc, e) => {
    const key = fmtDate(e.date, 'MMMM yyyy');
    (acc[key] ||= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <ErrorNote message={error} />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              filter === id ? 'bg-pine text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="card card-pad text-center text-sm text-muted">
          Nothing recorded in this category yet.
        </p>
      ) : (
        <div className="card card-pad">
          {Object.entries(groups).map(([month, items]) => (
            <section key={month} className="mb-6 last:mb-0">
              <p className="eyebrow mb-3">{month}</p>
              <ol className="relative space-y-4 border-l border-line pl-6">
                {items.map((e) => {
                  const { icon: Icon, ring } = KIND[e.kind] || KIND.health;
                  return (
                    <li key={`${e.kind}-${e.id}`} className="relative">
                      <span className={`absolute -left-[2.15rem] grid h-7 w-7 place-items-center rounded-full ring-4 ring-surface ${ring}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[14.5px] font-semibold">{e.title}</p>
                        <span className="font-mono text-[11.5px] text-muted">{fmtDate(e.date, 'd MMM yyyy')}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted">
                        <span className="font-medium text-ink/70">{e.category}</span>
                        {e.detail ? ` · ${e.detail}` : ''}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
