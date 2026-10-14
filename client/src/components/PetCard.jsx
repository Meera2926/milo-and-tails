import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { Badge } from './ui';
import { fmtDate } from '../lib/format';

export default function PetCard({ pet }) {
  return (
    <Link
      to={`/owner/pets/${pet._id}`}
      className="card group overflow-hidden transition-shadow hover:shadow-lift focus-visible:shadow-lift"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-moss-soft">
        {pet.photo ? (
          <img
            src={pet.photo}
            alt={pet.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center text-moss-deep/50">
            <PawPrint className="h-10 w-10" />
          </div>
        )}
        {pet.isLost && (
          <span className="absolute left-3 top-3 badge bg-coral text-white">Reported lost</span>
        )}
      </div>
      <div className="card-pad">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">{pet.name}</h3>
          <Badge tone="moss">{pet.animalType}</Badge>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          {pet.breed || 'Breed not recorded'} · {pet.gender}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12.5px]">
          <div>
            <dt className="text-muted">Weight</dt>
            <dd className="font-mono font-medium">{pet.weightKg ? `${pet.weightKg} kg` : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted">Born</dt>
            <dd className="font-mono font-medium">{pet.dob ? fmtDate(pet.dob, 'MMM yyyy') : '—'}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
