import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, MapPin, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState, Tabs, Badge, Modal, Field, Avatar, RatingStars } from '../../components/ui';
import { fmtDate, money } from '../../lib/format';

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

export default function AdminProviders() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('status') || 'pending';
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/providers');
      setProviders(data);
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

  const decide = async (id, status, rejectionReason = '') => {
    setBusy(true);
    try {
      await api.patch(`/providers/${id}/status`, { status, reason: rejectionReason });
      toast.success(status === 'verified' ? 'Provider verified' : `Provider ${status}`);
      setRejecting(null);
      setReason('');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader label="Loading providers" />;

  const counts = TABS.reduce(
    (acc, t) => ({ ...acc, [t.id]: t.id === 'all' ? providers.length : providers.filter((p) => p.status === t.id).length }),
    {}
  );
  const filtered = tab === 'all' ? providers : providers.filter((p) => p.status === tab);

  return (
    <>
      <PageHeader
        eyebrow="Administrator"
        title="Provider verification"
        description="Approved providers appear in owner search and can accept bookings. Nobody else does."
      />

      <ErrorNote message={error} onRetry={load} />
      <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.id] }))} active={tab} onChange={(t) => setParams({ status: t })} />

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={`No ${tab} providers`} description="Nothing needs your attention in this list." />
      ) : (
        <ul className="space-y-4">
          {filtered.map((p) => (
            <li key={p._id} className="card card-pad">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Avatar name={p.businessName} src={p.photo || undefined} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[17px] font-semibold">{p.businessName}</h3>
                    <Badge tone={p.status === 'verified' ? 'moss' : p.status === 'rejected' ? 'coral' : 'marigold'}>
                      {p.status === 'verified' && <BadgeCheck className="h-3.5 w-3.5" />}
                      {p.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">
                    {p.user?.name} · {p.user?.email}
                    {p.phone ? ` · ${p.phone}` : ''}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px] text-muted">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.city}</span>
                    <span>{p.experienceYears} yrs experience</span>
                    <span>From {money(p.priceFrom)}</span>
                    <span>Applied {fmtDate(p.createdAt)}</span>
                  </p>
                  {p.description && <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{p.description}</p>}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {p.categories.map((c) => <Badge key={c} tone="moss">{c}</Badge>)}
                    {p.handlesAnimalTypes.map((a) => <Badge key={a}>{a}s</Badge>)}
                  </div>
                  {p.rating?.count > 0 && <div className="mt-2"><RatingStars value={p.rating.average} count={p.rating.count} /></div>}
                  {p.rejectionReason && (
                    <p className="mt-2.5 rounded-lg bg-coral-soft px-3 py-2 text-[12.5px] text-coral">
                      Rejected: {p.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {p.status !== 'verified' && (
                  <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => decide(p._id, 'verified')}>
                    <BadgeCheck className="h-4 w-4" /> Verify provider
                  </button>
                )}
                {p.status !== 'rejected' && (
                  <button type="button" className="btn-outline btn-sm" onClick={() => setRejecting(p)}>Reject</button>
                )}
                {p.status !== 'pending' && (
                  <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => decide(p._id, 'pending')}>
                    Move back to pending
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(rejecting)} onClose={() => setRejecting(null)} title="Reject this provider" description={rejecting?.businessName} size="sm">
        <form onSubmit={(e) => { e.preventDefault(); decide(rejecting._id, 'rejected', reason); }} className="space-y-4">
          <Field label="Reason" hint="The provider sees this and can fix the profile and resubmit.">
            <textarea className="textarea min-h-[90px]" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Business address and licence details are missing." />
          </Field>
          <div className="flex gap-2">
            <button type="submit" className="btn-danger" disabled={busy}>Reject provider</button>
            <button type="button" className="btn-outline" onClick={() => setRejecting(null)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
