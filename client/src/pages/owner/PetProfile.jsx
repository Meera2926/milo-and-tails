import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, PawPrint, Trash2, CalendarPlus } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageLoader, ErrorNote, Tabs, Badge, ConfirmButton } from '../../components/ui';
import PetOverview from '../../components/pet/PetOverview';
import PetPassport from '../../components/pet/PetPassport';
import PetTimeline from '../../components/pet/PetTimeline';
import PetServices from '../../components/pet/PetServices';
import PetTag from '../../components/pet/PetTag';

export default function PetProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/pets/${id}/dashboard`);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async () => {
    try {
      const { data: res } = await api.delete(`/pets/${id}`);
      toast.success(res.message);
      navigate('/owner/pets');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Opening the profile" />;
  if (error) return <ErrorNote message={error} onRetry={load} />;

  const { pet } = data;

  const TABS = [
    { id: 'overview', label: 'Growth & health' },
    { id: 'passport', label: 'Health passport' },
    { id: 'timeline', label: 'Care timeline' },
    { id: 'services', label: 'Services', count: data.serviceHistory.length },
    { id: 'tag', label: 'QR tag' },
  ];

  return (
    <>
      <Link to="/owner/pets" className="btn-ghost btn-sm mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> All pets
      </Link>

      <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-line bg-moss-soft">
            {pet.photo ? (
              <img src={pet.photo} alt={pet.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-moss-deep/50"><PawPrint className="h-8 w-8" /></div>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-semibold">{pet.name}</h1>
              {pet.isLost && <Badge tone="coral">Reported lost</Badge>}
            </div>
            <p className="mt-1 text-[13.5px] text-muted">
              {[pet.breed, pet.animalType, pet.gender !== 'Unknown' ? pet.gender : null, pet.ageText, pet.size]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/owner/book?petId=${pet._id}`} className="btn-primary btn-sm">
            <CalendarPlus className="h-4 w-4" /> Book a service
          </Link>
          <Link to={`/owner/pets/${pet._id}/edit`} className="btn-outline btn-sm">
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          <ConfirmButton
            question={`Delete ${pet.name}'s profile? Health records, vaccinations and tag history go with it.`}
            onConfirm={remove}
            className="btn-ghost btn-sm text-coral"
          >
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
        </div>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={(t) => setParams({ tab: t })} />

      {tab === 'overview' && <PetOverview data={data} onRefresh={load} />}
      {tab === 'passport' && <PetPassport pet={pet} onRefresh={load} />}
      {tab === 'timeline' && <PetTimeline pet={pet} />}
      {tab === 'services' && <PetServices pet={pet} history={data.serviceHistory} upcoming={data.upcomingBookings} />}
      {tab === 'tag' && <PetTag pet={pet} onRefresh={load} />}
    </>
  );
}
