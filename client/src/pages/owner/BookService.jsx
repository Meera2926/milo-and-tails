import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, PawPrint, Store, CalendarDays, Clock } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, Field, Badge, RatingStars, Spinner } from '../../components/ui';
import { money, fmtDate } from '../../lib/format';
import { SERVICE_CATEGORIES, CATEGORY_EMOJI } from '../../lib/constants';

const STEPS = ['Pet', 'Service', 'Provider', 'Date & time', 'Confirm'];

export default function BookService() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState(0);
  const [pets, setPets] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [petId, setPetId] = useState(params.get('petId') || '');
  const [category, setCategory] = useState('');
  const [providerId, setProviderId] = useState('');
  const [serviceId, setServiceId] = useState(params.get('serviceId') || '');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');

  const [slots, setSlots] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load pets, and resolve a deep link from a provider page into the right step
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/pets');
        setPets(data);
        if (!petId && data.length === 1) setPetId(data[0]._id);

        const preselected = params.get('serviceId');
        if (preselected) {
          const svc = await api.get(`/services/${preselected}`);
          setCategory(svc.data.category);
          setProviderId(svc.data.provider._id);
          setStep(petId || data.length === 1 ? 3 : 0);
        }
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pet = useMemo(() => pets.find((p) => p._id === petId), [pets, petId]);

  // Providers that serve this category and this animal type
  useEffect(() => {
    if (step !== 2 || !category) return;
    setProviders([]);
    api.get(`/providers?category=${encodeURIComponent(category)}`)
      .then(({ data }) => {
        const usable = data.providers
          .map((p) => ({ ...p, services: (p.services || []).filter((s) => !pet || s.animalTypes.includes(pet.animalType)) }))
          .filter((p) => p.services.length > 0);
        setProviders(usable);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [step, category, pet]);

  const provider = providers.find((p) => p._id === providerId);
  const service =
    provider?.services.find((s) => s._id === serviceId) || provider?.services[0] || null;

  // Open slots for the chosen date
  useEffect(() => {
    if (!serviceId || !date) {
      setSlots(null);
      return;
    }
    setSlotsLoading(true);
    setSlot('');
    api.get(`/services/${serviceId}/slots?date=${date}`)
      .then(({ data }) => setSlots(data.slots))
      .catch((err) => {
        setSlots([]);
        setError(errorMessage(err));
      })
      .finally(() => setSlotsLoading(false));
  }, [serviceId, date]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      await api.post('/bookings', { petId, serviceId, date, timeSlot: slot, notes });
      toast.success('Booking requested. The provider will confirm shortly.');
      navigate('/owner/bookings');
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader label="Setting up the booking" />;

  if (pets.length === 0) {
    return (
      <>
        <PageHeader title="Book a service" />
        <div className="card card-pad text-center">
          <p className="text-sm text-muted">Add a pet before booking a service.</p>
          <Link to="/owner/pets/new" className="btn-primary mt-4">Add a pet</Link>
        </div>
      </>
    );
  }

  const canContinue = [petId, category, providerId && serviceId, date && slot, true][step];

  return (
    <>
      <Link to="/owner/services" className="btn-ghost btn-sm mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to services
      </Link>

      <PageHeader eyebrow="Pet services" title="Book a service" description="Five short steps. Nothing is sent until you confirm." />

      {/* Step rail — the order carries real meaning, so it is numbered */}
      <ol className="mb-6 flex flex-wrap gap-x-2 gap-y-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                i === step ? 'bg-pine text-white' : i < step ? 'bg-moss-soft text-moss-deep' : 'bg-surface text-muted ring-1 ring-line'
              }`}
            >
              <span className="font-mono">{i < step ? <Check className="h-3.5 w-3.5" /> : `0${i + 1}`}</span>
              {label}
            </button>
            {i < STEPS.length - 1 && <span className="text-line">—</span>}
          </li>
        ))}
      </ol>

      <ErrorNote message={error} />

      <div className="card card-pad">
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold">Which pet is this for?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {pets.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setPetId(p._id)}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors ${
                    petId === p._id ? 'border-moss bg-moss-soft' : 'border-line hover:border-muted/40'
                  }`}
                >
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-moss-soft">
                    {p.photo ? (
                      <img src={p.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full place-items-center text-moss-deep/50"><PawPrint className="h-5 w-5" /></span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-semibold">{p.name}</span>
                    <span className="block text-[12.5px] text-muted">{[p.breed, p.animalType, p.size].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold">What does {pet?.name} need?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {SERVICE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCategory(c); setProviderId(''); setServiceId(''); }}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${
                    category === c ? 'border-moss bg-moss-soft' : 'border-line hover:border-muted/40'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">{CATEGORY_EMOJI[c]}</span>
                  <span className="mt-1.5 block text-[14.5px] font-semibold">{c}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold">Choose a provider and service</h2>
            <p className="mt-1 text-[13px] text-muted">
              Showing verified providers offering {category?.toLowerCase()} for {pet?.animalType?.toLowerCase()}s.
            </p>
            {providers.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                No verified provider currently offers this service for {pet?.animalType?.toLowerCase()}s. Try another category.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {providers.map((p) => (
                  <article key={p._id} className={`rounded-xl border-2 p-4 transition-colors ${providerId === p._id ? 'border-moss bg-moss-soft/50' : 'border-line'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-[16px] font-semibold">{p.businessName}</h3>
                        <p className="text-[12.5px] text-muted">{p.city}{p.experienceYears ? ` · ${p.experienceYears} yrs` : ''}</p>
                        <div className="mt-1"><RatingStars value={p.rating?.average || 0} count={p.rating?.count} /></div>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {p.services.map((s) => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => { setProviderId(p._id); setServiceId(s._id); }}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left ${
                            serviceId === s._id ? 'border-moss bg-surface' : 'border-line bg-surface hover:border-muted/40'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-[13.5px] font-semibold">{s.title}</span>
                            <span className="block text-[12px] text-muted">{s.durationMins} min</span>
                          </span>
                          <span className="font-mono text-[13.5px] font-semibold">{money(s.price)}</span>
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold">Pick a date and time</h2>
            <div className="mt-4 max-w-xs">
              <Field label="Date" required>
                <input
                  type="date"
                  className="input"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>

            {!date ? (
              <p className="mt-4 text-[13px] text-muted">Choose a date to see the provider&rsquo;s open slots.</p>
            ) : slotsLoading ? (
              <div className="mt-5 flex items-center gap-2 text-sm text-muted"><Spinner /> Checking availability…</div>
            ) : !slots || slots.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                This provider has no slots on {fmtDate(date)}. Try another date.
              </p>
            ) : (
              <div className="mt-5">
                <p className="label">Open time slots</p>
                <div className="flex flex-wrap gap-2">
                  {slots.map(({ slot: s, available }) => (
                    <button
                      key={s}
                      type="button"
                      disabled={!available}
                      onClick={() => setSlot(s)}
                      className={`rounded-xl px-3.5 py-2 font-mono text-[13px] font-medium transition-colors ${
                        slot === s
                          ? 'bg-pine text-white'
                          : available
                          ? 'bg-surface text-ink ring-1 ring-line hover:ring-moss'
                          : 'cursor-not-allowed bg-canvas text-muted/50 line-through'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="hint">Slots already taken are struck through.</p>
              </div>
            )}

            <div className="mt-5 max-w-lg">
              <Field label="Note for the provider" hint="Anything they should know — anxious around dryers, on medication, arriving late.">
                <textarea className="textarea min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
              </Field>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-semibold">Confirm this booking</h2>
            <dl className="mt-4 divide-y divide-line rounded-xl border border-line">
              {[
                [PawPrint, 'Pet', pet ? `${pet.name} · ${pet.animalType}` : '—'],
                [Store, 'Provider', provider?.businessName || '—'],
                [Check, 'Service', service ? `${service.title} (${service.durationMins} min)` : '—'],
                [CalendarDays, 'Date', fmtDate(date)],
                [Clock, 'Time', slot],
              ].map(([Icon, k, v]) => (
                <div key={k} className="flex items-center gap-3 px-4 py-3">
                  <Icon className="h-4 w-4 shrink-0 text-muted" />
                  <dt className="w-24 shrink-0 text-[13px] text-muted">{k}</dt>
                  <dd className="text-[14px] font-medium">{v}</dd>
                </div>
              ))}
              <div className="flex items-center gap-3 bg-canvas px-4 py-3">
                <span className="h-4 w-4" />
                <dt className="w-24 shrink-0 text-[13px] text-muted">Price</dt>
                <dd className="font-mono text-[16px] font-semibold">{money(service?.price)}</dd>
              </div>
            </dl>
            {notes && (
              <p className="mt-3 rounded-xl bg-canvas px-4 py-3 text-[13px] text-muted">
                <span className="font-semibold text-ink">Your note: </span>{notes}
              </p>
            )}
            <p className="mt-3 text-[12.5px] text-muted">
              The booking is sent as a request. <Badge tone="marigold">Requested</Badge> becomes{' '}
              <Badge tone="moss">Accepted</Badge> once the provider confirms.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
          {step > 0 && (
            <button type="button" className="btn-outline" onClick={() => setStep(step - 1)}>Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary" disabled={!canContinue} onClick={() => setStep(step + 1)}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={confirm} disabled={submitting}>
              {submitting ? 'Sending request…' : 'Confirm booking'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
