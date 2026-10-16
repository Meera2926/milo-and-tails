import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Printer, RefreshCcw, MapPin, ExternalLink, Copy, AlertTriangle } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { Spinner, Badge, ConfirmButton } from '../ui';
import { fmtDateTime } from '../../lib/format';

export default function PetTag({ pet, onRefresh }) {
  const [qr, setQr] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [q, s] = await Promise.all([api.get(`/pets/${pet._id}/qr`), api.get(`/pets/${pet._id}/scans`)]);
      setQr(q.data);
      setScans(s.data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet._id]);

  const toggleLost = async () => {
    setBusy(true);
    try {
      await api.put(`/pets/${pet._id}`, { isLost: !pet.isLost });
      toast.success(pet.isLost ? `${pet.name} marked as home` : `${pet.name} reported lost`);
      onRefresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/pets/${pet._id}/qr/regenerate`);
      toast.success(data.message);
      load();
      onRefresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(qr.url);
    toast.success('Tag link copied');
  };

  const printTag = () => window.print();

  if (loading) return <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>;

  const located = scans.filter((s) => s.hasLocation);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-tag, #printable-tag * { visibility: visible; }
          #printable-tag { position: absolute; inset: 0 auto auto 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {pet.isLost && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-coral/30 bg-coral-soft px-5 py-4 no-print">
          <AlertTriangle className="h-5 w-5 text-coral" />
          <div className="flex-1">
            <p className="font-semibold text-coral">{pet.name} is marked as lost</p>
            <p className="text-[13px] text-coral/85">You are alerted the moment the tag is scanned, and again if a location is shared.</p>
          </div>
          <button type="button" className="btn-outline btn-sm" onClick={toggleLost} disabled={busy}>
            {pet.name} is home
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* The printable collar tag */}
        <section id="printable-tag" className="passport w-full max-w-sm">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <span className="font-display text-[15px] font-semibold">Milo &amp; Tails</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-pine/70">Pet identity tag</span>
          </div>
          <div className="px-5 py-5 text-center">
            <p className="eyebrow">If found, scan me</p>
            <img src={qr.dataUrl} alt={`QR code linking to ${pet.name}'s lost-pet page`} className="mx-auto mt-3 h-44 w-44" />
            <p className="mt-3 font-display text-2xl font-semibold">{pet.name}</p>
            <p className="text-[13px] text-muted">
              {[pet.breed, pet.animalType].filter(Boolean).join(' · ')}
            </p>
            {pet.medicalWarning && (
              <p className="mt-3 rounded-lg bg-coral-soft px-3 py-2 text-[12px] font-semibold leading-snug text-coral">
                {pet.medicalWarning}
              </p>
            )}
          </div>
          <div className="passport-strip">
            MT&lt;&lt;{pet.name.toUpperCase()}&lt;&lt;{pet.animalType.toUpperCase()}&lt;&lt;&lt;&lt;&lt;
            <br />
            TAG{qr.token.toUpperCase()}&lt;&lt;SCAN&lt;TO&lt;CONTACT&lt;OWNER&lt;&lt;&lt;
          </div>
        </section>

        <div className="space-y-4 no-print">
          <section className="card card-pad">
            <h2 className="text-lg font-semibold">Your pet&rsquo;s tag</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
              Print this and clip it to the collar. Scanning opens a public page with only the details you chose to
              share — never your address. Change what is visible from <span className="font-semibold text-ink">Edit pet</span>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-primary btn-sm" onClick={printTag}>
                <Printer className="h-4 w-4" /> Print tag
              </button>
              <a href={qr.url} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                <ExternalLink className="h-4 w-4" /> Preview finder page
              </a>
              <button type="button" className="btn-outline btn-sm" onClick={copyLink}>
                <Copy className="h-4 w-4" /> Copy link
              </button>
              {!pet.isLost && (
                <button type="button" className="btn-danger btn-sm" onClick={toggleLost} disabled={busy}>
                  Report {pet.name} lost
                </button>
              )}
            </div>
            <div className="mt-4 rounded-xl bg-canvas px-4 py-3">
              <p className="eyebrow">Tag link</p>
              <p className="mt-1 break-all font-mono text-[12px] text-muted">{qr.url}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="text-[12.5px] text-muted">
                Lost the physical tag, or think the link was shared? Create a new one — the old tag stops working.
              </p>
              <ConfirmButton
                className="btn-outline btn-sm"
                question="Create a new tag? Any printed copies of the old tag will stop working."
                onConfirm={regenerate}
              >
                <RefreshCcw className="h-4 w-4" /> New tag
              </ConfirmButton>
            </div>
          </section>

          <section className="card card-pad">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Scan history</h2>
              <Badge tone={located.length ? 'moss' : 'neutral'}>{located.length} location{located.length === 1 ? '' : 's'} shared</Badge>
            </div>

            {scans.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                The tag has not been scanned yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {scans.map((s) => (
                  <li key={s._id} className={`rounded-xl border px-4 py-3 ${s.hasLocation ? 'border-moss/25 bg-moss-soft/50' : 'border-line'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold">
                          {s.hasLocation ? 'Location shared' : 'Tag scanned'}
                          {s.finderName ? ` by ${s.finderName}` : ''}
                        </p>
                        {s.message && <p className="mt-1 text-[13px] leading-relaxed text-muted">&ldquo;{s.message}&rdquo;</p>}
                        {s.finderContact && (
                          <p className="mt-1 text-[13px]">
                            Contact:{' '}
                            <a href={`tel:${s.finderContact}`} className="font-semibold text-moss-deep underline underline-offset-2">
                              {s.finderContact}
                            </a>
                          </p>
                        )}
                        {s.hasLocation && (
                          <p className="mt-1 font-mono text-[11.5px] text-muted">
                            {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
                            {s.accuracyMeters ? ` (±${s.accuracyMeters} m)` : ''}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-muted">{fmtDateTime(s.createdAt)}</span>
                    </div>
                    {s.hasLocation && (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=17/${s.latitude}/${s.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary btn-sm mt-3"
                      >
                        <MapPin className="h-4 w-4" /> Open on map
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
