import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays, Star, Plus } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState, Tabs, Modal, Field, ConfirmButton } from '../../components/ui';
import BookingCard from '../../components/BookingCard';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'Completed', label: 'Completed' },
  { id: 'all', label: 'All' },
];

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');

  const [reviewFor, setReviewFor] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings/mine');
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

  const cancel = async (id) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'Cancelled' });
      toast.success('Booking cancelled');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/reviews', { bookingId: reviewFor._id, rating, comment });
      toast.success('Thanks — your review is published');
      setReviewFor(null);
      setComment('');
      setRating(5);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading your bookings" />;

  const filtered =
    tab === 'upcoming'
      ? bookings.filter((b) => ['Requested', 'Accepted'].includes(b.status))
      : tab === 'all'
      ? bookings
      : bookings.filter((b) => b.status === tab);

  const counts = {
    upcoming: bookings.filter((b) => ['Requested', 'Accepted'].includes(b.status)).length,
    Completed: bookings.filter((b) => b.status === 'Completed').length,
    all: bookings.length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Pet services"
        title="My bookings"
        description="Track every request from the moment you send it through to the review."
        actions={<Link to="/owner/services" className="btn-primary"><Plus className="h-4 w-4" /> New booking</Link>}
      />

      <ErrorNote message={error} onRetry={load} />
      <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.id] }))} active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={tab === 'Completed' ? 'No completed services yet' : 'No bookings here'}
          description="Browse verified vets, groomers, boarding and sitting near you, then book in five steps."
          action={<Link to="/owner/services" className="btn-primary mt-2">Find a service</Link>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              perspective="owner"
              actions={
                <>
                  <Link to={`/owner/providers/${b.provider?._id}`} className="btn-outline btn-sm">View provider</Link>
                  {['Requested', 'Accepted'].includes(b.status) && (
                    <ConfirmButton
                      className="btn-ghost btn-sm text-coral"
                      question="Cancel this booking? The provider is notified."
                      onConfirm={() => cancel(b._id)}
                    >
                      Cancel booking
                    </ConfirmButton>
                  )}
                  {b.status === 'Completed' && !b.isReviewed && (
                    <button type="button" className="btn-secondary btn-sm" onClick={() => setReviewFor(b)}>
                      <Star className="h-4 w-4" /> Write a review
                    </button>
                  )}
                  {b.status === 'Completed' && b.isReviewed && (
                    <span className="text-[12.5px] font-medium text-muted">Reviewed</span>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(reviewFor)}
        onClose={() => setReviewFor(null)}
        title="Rate this service"
        description={reviewFor ? `${reviewFor.service?.title} with ${reviewFor.provider?.businessName}` : ''}
        size="sm"
      >
        <form onSubmit={submitReview} className="space-y-4">
          <Field label="Rating" required>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  className={`text-2xl leading-none transition-transform hover:scale-110 ${n <= rating ? 'text-marigold' : 'text-line'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </Field>
          <Field label="Your review" hint="What went well, and what could have been better?">
            <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={800} />
          </Field>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Publishing…' : 'Publish review'}</button>
            <button type="button" className="btn-outline" onClick={() => setReviewFor(null)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
