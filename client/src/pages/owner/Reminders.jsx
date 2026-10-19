import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, StatCard } from '../../components/ui';
import ReminderList from '../../components/ReminderList';
import { BellRing, AlertTriangle, CalendarClock } from 'lucide-react';

const WINDOWS = [
  [14, 'Next 2 weeks'],
  [45, 'Next 45 days'],
  [90, 'Next 3 months'],
];

export default function Reminders() {
  const [days, setDays] = useState(45);
  const [data, setData] = useState({ reminders: [], overdue: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (window) => {
    setLoading(true);
    try {
      const res = await api.get(`/reminders?days=${window}`);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
  }, [days]);

  const byKind = (k) => data.reminders.filter((r) => r.kind === k).length;

  return (
    <>
      <PageHeader
        eyebrow="Pet care"
        title="Care reminders"
        description="Vaccinations coming due, medication still running and appointments already booked — across every pet."
        actions={
          <div className="flex gap-1.5">
            {WINDOWS.map(([d, label]) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                  days === d ? 'bg-pine text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <ErrorNote message={error} onRetry={() => load(days)} />

      {loading ? (
        <PageLoader label="Checking what is due" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Overdue"
              value={data.overdue.length}
              sub={data.overdue.length ? 'Book these first' : 'Nothing overdue'}
              icon={AlertTriangle}
              tone={data.overdue.length ? 'coral' : 'default'}
            />
            <StatCard label="Vaccinations due" value={byKind('vaccination')} icon={BellRing} />
            <StatCard label="Appointments booked" value={byKind('appointment')} icon={CalendarClock} />
          </div>

          {data.overdue.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold text-coral">Overdue</h2>
              <ReminderList reminders={data.overdue} />
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Everything scheduled</h2>
            <ReminderList reminders={data.reminders} />
          </section>
        </>
      )}
    </>
  );
}
