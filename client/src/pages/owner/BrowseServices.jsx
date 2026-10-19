import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Store } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState, Field } from '../../components/ui';
import ProviderCard from '../../components/ProviderCard';
import { SERVICE_CATEGORIES, CATEGORY_EMOJI } from '../../lib/constants';

const BLANK = { q: '', category: '', city: '', maxPrice: '', minRating: '', sort: 'rating' };

export default function BrowseServices() {
  const [filters, setFilters] = useState(BLANK);
  const [applied, setApplied] = useState(BLANK);
  const [result, setResult] = useState({ providers: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams(Object.entries(applied).filter(([, v]) => v));
    api.get(`/providers?${params}`)
      .then(({ data }) => alive && setResult(data))
      .catch((err) => alive && setError(errorMessage(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [applied]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <PageHeader
        eyebrow="Pet services"
        title="Find a provider"
        description="Verified vets, groomers, boarding, sitting, walking and training. Filter, or let us match a provider to one of your pets."
      />

      <ErrorNote message={error} />

      {/* Category shortcuts */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setFilters({ ...filters, category: '' }); setApplied({ ...applied, category: '' }); }}
          className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
            !applied.category ? 'bg-pine text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
          }`}
        >
          All services
        </button>
        {SERVICE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { setFilters({ ...filters, category: c }); setApplied({ ...applied, category: c }); }}
            className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              applied.category === c ? 'bg-pine text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
            }`}
          >
            <span aria-hidden="true">{CATEGORY_EMOJI[c]}</span> {c}
          </button>
        ))}
      </div>

      {/* Filters */}
      <form
        className="card card-pad mb-6"
        onSubmit={(e) => { e.preventDefault(); setApplied(filters); }}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted" />
          <p className="text-[14px] font-semibold">Search and filter</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Keyword">
            <input className="input" value={filters.q} onChange={set('q')} placeholder="Name or description" />
          </Field>
          <Field label="City">
            <input className="input" value={filters.city} onChange={set('city')} placeholder="Chennai" />
          </Field>
          <Field label="Max price (₹)">
            <input type="number" min="0" className="input" value={filters.maxPrice} onChange={set('maxPrice')} placeholder="1500" />
          </Field>
          <Field label="Minimum rating">
            <select className="select" value={filters.minRating} onChange={set('minRating')}>
              <option value="">Any rating</option>
              <option value="3">3+ stars</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+ stars</option>
            </select>
          </Field>
          <Field label="Sort by">
            <select className="select" value={filters.sort} onChange={set('sort')}>
              <option value="rating">Highest rated</option>
              <option value="experience">Most experienced</option>
              <option value="price">Lowest price</option>
              <option value="newest">Newest</option>
            </select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary btn-sm"><Search className="h-4 w-4" /> Apply filters</button>
          <button type="button" className="btn-outline btn-sm" onClick={() => { setFilters(BLANK); setApplied(BLANK); }}>
            Clear
          </button>
        </div>
      </form>

      {loading ? (
        <PageLoader label="Finding providers" />
      ) : result.providers.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No providers match those filters"
          description="Try widening the price range, clearing the city, or picking a different service category."
          action={<button type="button" className="btn-primary mt-2" onClick={() => { setFilters(BLANK); setApplied(BLANK); }}>Clear filters</button>}
        />
      ) : (
        <>
          <p className="mb-4 text-[13px] text-muted">
            {result.total} provider{result.total === 1 ? '' : 's'} available
            {applied.category ? ` for ${applied.category.toLowerCase()}` : ''}.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.providers.map((p) => (
              <ProviderCard key={p._id} provider={p} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
