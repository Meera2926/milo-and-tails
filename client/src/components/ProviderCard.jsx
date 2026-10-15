import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck } from 'lucide-react';
import { Badge, RatingStars, Avatar } from './ui';
import { money } from '../lib/format';
import { CATEGORY_EMOJI } from '../lib/constants';

export default function ProviderCard({ provider, footer }) {
  return (
    <article className="card card-pad flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar name={provider.businessName} src={provider.photo || undefined} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-[17px] font-semibold">{provider.businessName}</h3>
            {provider.status === 'verified' && <BadgeCheck className="h-4 w-4 shrink-0 text-moss" aria-label="Verified" />}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
            <MapPin className="h-3.5 w-3.5" /> {provider.city}
            {provider.experienceYears ? ` · ${provider.experienceYears} yrs experience` : ''}
          </p>
          <div className="mt-1.5">
            <RatingStars value={provider.rating?.average || 0} count={provider.rating?.count} />
          </div>
        </div>
      </div>

      {provider.description && <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{provider.description}</p>}

      <div className="flex flex-wrap gap-1.5">
        {(provider.categories || []).map((c) => (
          <Badge key={c} tone="moss">
            <span aria-hidden="true">{CATEGORY_EMOJI[c]}</span> {c}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[13px] text-muted">
          From <span className="font-mono font-semibold text-ink">{money(provider.priceFrom ?? 0)}</span>
        </p>
        {footer || (
          <Link to={`/owner/providers/${provider._id}`} className="btn-primary btn-sm">
            View &amp; book
          </Link>
        )}
      </div>
    </article>
  );
}
