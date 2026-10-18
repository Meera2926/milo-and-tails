import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, PawPrint } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState } from '../../components/ui';
import PetCard from '../../components/PetCard';

export default function MyPets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/pets');
      setPets(data);
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

  if (loading) return <PageLoader label="Loading your pets" />;

  return (
    <>
      <PageHeader
        eyebrow="Pet care"
        title="My pets"
        description="Each pet keeps its own health passport, growth chart, care timeline and collar tag."
        actions={<Link to="/owner/pets/new" className="btn-primary"><Plus className="h-4 w-4" /> Add a pet</Link>}
      />
      <ErrorNote message={error} onRetry={load} />

      {pets.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="No pets registered yet"
          description="Add a pet to start tracking vaccinations, weight and vet visits — and to generate its QR collar tag."
          action={<Link to="/owner/pets/new" className="btn-primary mt-2"><Plus className="h-4 w-4" /> Add your first pet</Link>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((p) => (
            <PetCard key={p._id} pet={p} />
          ))}
        </div>
      )}
    </>
  );
}
