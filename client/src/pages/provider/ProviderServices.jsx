import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ClipboardList, Clock } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState, Modal, Field, Badge, ConfirmButton } from '../../components/ui';
import { SERVICE_CATEGORIES, ANIMAL_TYPES } from '../../lib/constants';
import { money } from '../../lib/format';

const BLANK = {
  title: '', category: SERVICE_CATEGORIES[0], description: '', price: '', durationMins: 60,
  animalTypes: ['Dog', 'Cat'], isActive: true,
};

export default function ProviderServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/services/mine');
      setServices(data);
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

  const startNew = () => {
    setEditing(null);
    setForm(BLANK);
    setOpen(true);
  };

  const startEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title, category: s.category, description: s.description || '', price: s.price,
      durationMins: s.durationMins, animalTypes: s.animalTypes || [], isActive: s.isActive,
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), durationMins: Number(form.durationMins) };
      if (editing) await api.put(`/services/${editing._id}`, payload);
      else await api.post('/services', payload);
      toast.success(editing ? 'Service updated' : 'Service published');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/services/${id}`);
      setServices((list) => list.filter((s) => s._id !== id));
      toast.success('Service removed');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const toggleAnimal = (a) =>
    setForm((f) => ({
      ...f,
      animalTypes: f.animalTypes.includes(a) ? f.animalTypes.filter((x) => x !== a) : [...f.animalTypes, a],
    }));

  if (loading) return <PageLoader label="Loading your services" />;

  return (
    <>
      <PageHeader
        eyebrow="Service provider"
        title="Services"
        description="Each service carries its own price and duration. Owners book against your weekly availability."
        actions={<button type="button" className="btn-primary" onClick={startNew}><Plus className="h-4 w-4" /> Add a service</button>}
      />

      <ErrorNote message={error} onRetry={load} />

      {services.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No services published"
          description="Add what you offer — a consultation, a grooming package, a night of boarding — with its price and duration."
          action={<button type="button" className="btn-primary mt-2" onClick={startNew}><Plus className="h-4 w-4" /> Add your first service</button>}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {services.map((s) => (
            <li key={s._id} className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="eyebrow">{s.category}</p>
                    {!s.isActive && <Badge tone="neutral">Hidden</Badge>}
                  </div>
                  <h3 className="mt-1 font-display text-[17px] font-semibold">{s.title}</h3>
                  {s.description && <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{s.description}</p>}
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-muted">
                    <Clock className="h-3.5 w-3.5" /> {s.durationMins} min · {s.animalTypes.join(', ')}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-lg font-semibold">{money(s.price)}</p>
              </div>
              <div className="mt-4 flex gap-2 border-t border-line pt-4">
                <button type="button" className="btn-outline btn-sm" onClick={() => startEdit(s)}>
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <ConfirmButton
                  className="btn-ghost btn-sm text-coral"
                  question={`Remove "${s.title}"? Existing bookings are kept.`}
                  onConfirm={() => remove(s._id)}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit service' : 'Add a service'}
        description="Owners see this exactly as written."
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Service name" required>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Full grooming — small & medium dogs" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required>
              <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Price (₹)" required>
              <input type="number" min="0" required className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Duration (minutes)" required>
              <input type="number" min="10" max="1440" required className="input" value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: e.target.value })} />
            </Field>
            <Field label="Visible to owners">
              <label className="flex h-[42px] items-center gap-2.5 text-[13.5px] font-medium">
                <input type="checkbox" className="h-4 w-4 accent-[#12836C]" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Listed in search
              </label>
            </Field>
          </div>
          <Field label="Description">
            <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
          </Field>
          <Field label="Animals this service is for" hint="Owners can only book if their pet matches.">
            <div className="flex flex-wrap gap-2">
              {ANIMAL_TYPES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAnimal(a)}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    form.animalTypes.includes(a) ? 'bg-moss text-white' : 'bg-surface text-muted ring-1 ring-line'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish service'}
            </button>
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
