import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, BellRing, CalendarDays, Plus, Search, QrCode } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, StatCard, PageLoader, ErrorNote, EmptyState } from '../../components/ui';
import PetCard from '../../components/PetCard';
import ReminderList from '../../components/ReminderList';
import BookingCard from '../../components/BookingCard';
import { useAuth } from '../../context/AuthContext';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ pets: [], reminders: [], overdue: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [pets, reminders, bookings] = await Promise.all([
        api.get('/pets'),
        api.get('/reminders?days=45'),
        api.get('/bookings/mine'),
      ]);
      setState({
        pets: pets.data,
        reminders: reminders.data.reminders,
        overdue: reminders.data.overdue,
        bookings: bookings.data.filter((b) => ['Requested', 'Accepted'].includes(b.status)),
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoader label="Loading your dashboard" />;

  return (
    <>
      <PageHeader
        eyebrow="Pet owner"
        title={`Hello, ${user?.name?.split(' ')[0]}`}
        description="Everything due, booked and worth knowing across your pets."
        actions={
          <>
            <Link to="/owner/services" className="btn-outline"><Search className="h-4 w-4" /> Find a service</Link>
            <Link to="/owner/pets/new" className="btn-primary"><Plus className="h-4 w-4" /> Add a pet</Link>
          </>
        }
      />

      <ErrorNote message={error} onRetry={load} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pets registered" value={state.pets.length} icon={PawPrint} />
        <StatCard
          label="Care due soon"
          value={state.reminders.length}
          sub="Next 45 days"
          icon={BellRing}
          tone={state.reminders.length ? 'marigold' : 'default'}
        />
        <StatCard
          label="Overdue"
          value={state.overdue.length}
          sub={state.overdue.length ? 'Needs attention today' : 'Nothing overdue'}
          icon={BellRing}
          tone={state.overdue.length ? 'coral' : 'default'}
        />
        <StatCard label="Upcoming bookings" value={state.bookings.length} icon={CalendarDays} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My pets</h2>
            <Link to="/owner/pets" className="text-[13px] font-semibold text-moss-deep hover:underline">View all</Link>
          </div>
          {state.pets.length === 0 ? (
            <EmptyState
              icon={PawPrint}
              title="No pets yet"
              description="Add your first pet to start a health passport, generate a collar tag and book services."
              action={<Link to="/owner/pets/new" className="btn-primary mt-2"><Plus className="h-4 w-4" /> Add a pet</Link>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {state.pets.slice(0, 4).map((p) => (
                <PetCard key={p._id} pet={p} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Coming up</h2>
            <Link to="/owner/reminders" className="text-[13px] font-semibold text-moss-deep hover:underline">All reminders</Link>
          </div>
          <ReminderList reminders={state.reminders} limit={6} />

          <div className="mt-6 rounded-2xl bg-pine px-5 py-5 text-white">
            <QrCode className="h-5 w-5 text-marigold" />
            <h3 className="mt-3 text-[16px] font-semibold text-white">Collar tags ready to print</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
              Every pet already has a tag. Open a pet, go to the Tag section and print it for the collar.
            </p>
          </div>
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming bookings</h2>
          <Link to="/owner/bookings" className="text-[13px] font-semibold text-moss-deep hover:underline">All bookings</Link>
        </div>
        {state.bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No bookings scheduled"
            description="Browse verified vets, groomers, boarding, sitting, walking and training near you."
            action={<Link to="/owner/services" className="btn-primary mt-2">Find a service</Link>}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {state.bookings.slice(0, 4).map((b) => (
              <BookingCard key={b._id} booking={b} />
            ))}
          </div>
        )}
      </section>

    </>
  );
}
