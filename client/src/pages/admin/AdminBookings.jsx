import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState, StatusBadge, Tabs } from '../../components/ui';
import { money, fmtDate } from '../../lib/format';
import { BOOKING_STATUSES } from '../../lib/constants';

const TABS = [{ id: 'all', label: 'All' }, ...BOOKING_STATUSES.map((s) => ({ id: s, label: s }))];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api.get('/admin/bookings')
      .then(({ data }) => setBookings(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading bookings" />;

  const counts = TABS.reduce(
    (acc, t) => ({ ...acc, [t.id]: t.id === 'all' ? bookings.length : bookings.filter((b) => b.status === t.id).length }),
    {}
  );
  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);

  return (
    <>
      <PageHeader
        eyebrow="Administrator"
        title="Bookings"
        description="The 200 most recent bookings across the platform."
      />

      <ErrorNote message={error} />
      <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.id] }))} active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No bookings in this list" description="Bookings appear here as soon as owners make them." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[11.5px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Pet &amp; owner</th>
                <th className="px-5 py-3 font-medium">Provider</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b._id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium">{b.service?.title}</p>
                    <p className="text-[12px] text-muted">{b.service?.category}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{b.pet?.name}</p>
                    <p className="text-[12px] text-muted">{b.owner?.name}</p>
                  </td>
                  <td className="px-5 py-3 text-muted">{b.provider?.businessName}</td>
                  <td className="px-5 py-3">
                    <p className="font-mono text-[12.5px]">{fmtDate(b.date)}</p>
                    <p className="font-mono text-[11.5px] text-muted">{b.timeSlot}</p>
                  </td>
                  <td className="px-5 py-3 font-mono">{money(b.price)}</td>
                  <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
