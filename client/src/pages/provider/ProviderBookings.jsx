import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, AlertTriangle } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState, Tabs, Modal, Field } from '../../components/ui';
import BookingCard from '../../components/BookingCard';

const TABS = [
  { id: 'Requested', label: 'New requests' },
  { id: 'Accepted', label: 'Accepted' },
  { id: 'Completed', label: 'Completed' },
  { id: 'all', label: 'All' },
];

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Requested');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/bookings/provider');
      setBookings(data);
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

  const setStatus = async (id, status, statusReason = '') => {
    setBusy(true);
    try {
      await api.patch(`/bookings/${id}/status`, { status, reason: statusReason });
      toast.success(`Booking ${status.toLowerCase()}`);
      setRejecting(null);
      setReason('');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader label="Loading bookings" />;

  const counts = TABS.reduce(
    (acc, t) => ({ ...acc, [t.id]: t.id === 'all' ? bookings.length : bookings.filter((b) => b.status === t.id).length }),
    {}
  );
  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);

  return (
    <>
      <PageHeader
        eyebrow="Service provider"
        title="Bookings"
        description="Accept or decline requests, then mark the work complete so the owner can review it."
      />

      <ErrorNote message={error} onRetry={load} />
      <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.id] }))} active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={tab === 'Requested' ? 'No new requests' : 'Nothing here yet'}
          description="Requests appear as soon as an owner books one of your services. Keep your availability up to date so they can."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((b) => (
            <div key={b._id}>
              {b.pet?.medicalWarning && (
                <p className="mb-2 flex items-start gap-2 rounded-xl bg-coral-soft px-3.5 py-2.5 text-[12.5px] font-medium text-coral">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {b.pet.name}: {b.pet.medicalWarning}
                </p>
              )}
              <BookingCard
                booking={b}
                perspective="provider"
                actions={
                  <>
                    {b.status === 'Requested' && (
                      <>
                        <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => setStatus(b._id, 'Accepted')}>
                          Accept
                        </button>
                        <button type="button" className="btn-outline btn-sm" onClick={() => setRejecting(b)}>
                          Decline
                        </button>
                      </>
                    )}
                    {b.status === 'Accepted' && (
                      <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => setStatus(b._id, 'Completed')}>
                        Mark completed
                      </button>
                    )}
                    {b.owner?.phone && (
                      <a href={`tel:${b.owner.phone}`} className="btn-outline btn-sm">Call owner</a>
                    )}
                  </>
                }
              />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Decline this request"
        description={rejecting ? `${rejecting.service?.title} for ${rejecting.pet?.name}` : ''}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStatus(rejecting._id, 'Rejected', reason);
          }}
          className="space-y-4"
        >
          <Field label="Reason" hint="The owner sees this, so a short explanation helps them rebook.">
            <textarea className="textarea min-h-[90px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Fully booked that morning — happy to take 4 PM instead." maxLength={300} />
          </Field>
          <div className="flex gap-2">
            <button type="submit" className="btn-danger" disabled={busy}>Decline request</button>
            <button type="button" className="btn-outline" onClick={() => setRejecting(null)}>Keep it</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
