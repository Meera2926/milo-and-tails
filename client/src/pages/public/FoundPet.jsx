import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, AlertTriangle, CheckCircle2, PawPrint } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import Logo from '../../components/Logo';
import { PageLoader, ErrorNote, Badge } from '../../components/ui';

/**
 * The page a finder lands on after scanning a collar tag. No account needed.
 * Location is only captured after the finder presses the button AND the browser
 * grants permission — we never request coordinates on page load.
 */
export default function FoundPet() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [form, setForm] = useState({ finderName: '', finderContact: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(`/public/pet/${token}`);
        if (alive) setData(res.data);
      } catch (err) {
        if (alive) setError(errorMessage(err, 'This tag could not be found.'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const shareLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('This browser cannot share a location. You can still send a message below.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy),
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was declined. You can still send a message without it.'
            : 'Your location could not be read. You can still send a message without it.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post(`/public/pet/${token}/found`, {
        ...form,
        ...(coords || {}),
        scanId: data?.scanId,
      });
      setSent(res.data.message);
    } catch (err) {
      setLocationError(errorMessage(err, 'The alert could not be sent. Try again.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoader label="Opening this pet's tag" />;

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold">Tag not recognised</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  const { pet, owner } = data;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Logo />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Pet identity tag</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {pet.isLost && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-coral/30 bg-coral-soft px-4 py-3.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
            <div>
              <p className="font-semibold text-coral">This pet is reported lost</p>
              <p className="mt-0.5 text-[13px] text-coral/85">
                Thank you for stopping. Sharing your location below gets {pet.name} home fastest.
              </p>
            </div>
          </div>
        )}

        <section className="passport">
          <div className="flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-line bg-moss-soft">
              {pet.photo ? (
                <img src={pet.photo} alt={pet.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-moss-deep/50">
                  <PawPrint className="h-9 w-9" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="eyebrow">This is</p>
              <h1 className="mt-1 font-display text-3xl font-semibold">{pet.name}</h1>
              <p className="mt-1 text-[14px] text-muted">
                {[pet.breed, pet.animalType, pet.gender !== 'Unknown' ? pet.gender : null, pet.ageText]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {owner.city && <p className="mt-1 text-[13px] text-muted">Home area: {owner.city}</p>}
            </div>
          </div>

          {pet.description && (
            <p className="border-t border-line px-5 py-4 text-[14px] leading-relaxed text-muted">{pet.description}</p>
          )}

          {(pet.medicalWarning || pet.allergies?.length > 0) && (
            <div className="border-t border-line bg-coral-soft/60 px-5 py-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-coral">
                <AlertTriangle className="h-4 w-4" /> Important medical note
              </p>
              {pet.medicalWarning && <p className="mt-1.5 text-[14px] leading-relaxed text-coral/90">{pet.medicalWarning}</p>}
              {pet.allergies?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pet.allergies.map((a) => (
                    <Badge key={a.title} tone="coral">
                      Allergy: {a.title}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="passport-strip">
            MT&lt;&lt;{(pet.name || '').toUpperCase()}&lt;&lt;{(pet.animalType || '').toUpperCase()}
            {pet.breed ? `<<${pet.breed.toUpperCase().replace(/\s+/g, '<')}` : ''}&lt;&lt;&lt;&lt;&lt;
            <br />
            TAG{token.toUpperCase()}&lt;&lt;REGISTERED&lt;WITH&lt;MILO&amp;TAILS&lt;&lt;&lt;
          </div>
        </section>

        {sent ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-moss/25 bg-moss-soft px-5 py-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-moss-deep" />
            <div>
              <p className="font-semibold text-moss-deep">{sent}</p>
              <p className="mt-1 text-[13px] text-moss-deep/80">
                Please stay with {pet.name} if you safely can. The owner has been alerted right now.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="card card-pad mt-6">
            <h2 className="text-lg font-semibold">Contact {pet.name}&rsquo;s owner</h2>
            <p className="mt-1 text-[13px] text-muted">
              The owner is alerted inside Milo &amp; Tails. Your details are optional and only go to them.
            </p>

            <div className="mt-5 rounded-xl border border-line bg-canvas p-4">
              <p className="text-[13.5px] font-semibold">Share where you found {pet.name}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">
                Your browser will ask for permission first. Nothing is sent unless you allow it.
              </p>

              {coords ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="badge bg-moss-soft text-moss-deep">
                    <MapPin className="h-3.5 w-3.5" /> Location ready
                  </span>
                  <span className="font-mono text-[12px] text-muted">
                    {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)} (±{coords.accuracyMeters} m)
                  </span>
                  <button type="button" onClick={() => setCoords(null)} className="text-[12.5px] font-semibold text-muted underline">
                    Remove
                  </button>
                </div>
              ) : (
                <button type="button" onClick={shareLocation} disabled={locating} className="btn-secondary mt-3">
                  <MapPin className="h-4 w-4" />
                  {locating ? 'Waiting for permission…' : 'Share found location'}
                </button>
              )}
              {locationError && <p className="hint text-coral">{locationError}</p>}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="finderName">Your name</label>
                <input
                  id="finderName"
                  className="input"
                  placeholder="Optional"
                  value={form.finderName}
                  onChange={(e) => setForm({ ...form, finderName: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="finderContact">Phone or email</label>
                <input
                  id="finderContact"
                  className="input"
                  placeholder="So the owner can reach you"
                  value={form.finderContact}
                  onChange={(e) => setForm({ ...form, finderContact: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="message">Message</label>
              <textarea
                id="message"
                className="textarea"
                placeholder={`Where is ${pet.name} right now, and is anything wrong?`}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary mt-5 w-full sm:w-auto" disabled={sending}>
              {sending ? 'Sending…' : `Alert ${pet.name}'s owner`}
            </button>
          </form>
        )}

        {owner.name && (
          <p className="mt-5 text-center text-[13px] text-muted">
            Registered to {owner.name}
            {owner.phone && (
              <>
                {' · '}
                <a href={`tel:${owner.phone}`} className="font-semibold text-moss-deep underline underline-offset-2">
                  {owner.phone}
                </a>
              </>
            )}
          </p>
        )}
      </main>
    </div>
  );
}
