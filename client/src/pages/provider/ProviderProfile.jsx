import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, Field, Badge } from '../../components/ui';
import { SERVICE_CATEGORIES, ANIMAL_TYPES, SIZES, DAYS, DEFAULT_SLOTS } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

const BLANK = {
  businessName: '', description: '', experienceYears: 0, city: '', address: '', phone: '', priceFrom: 0,
};

export default function ProviderProfile() {
  const { user, setProviderProfile } = useAuth();
  const [form, setForm] = useState(BLANK);
  const [categories, setCategories] = useState([]);
  const [animals, setAnimals] = useState(['Dog', 'Cat']);
  const [sizes, setSizes] = useState(['Small', 'Medium', 'Large']);
  const [availability, setAvailability] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/providers/me')
      .then(({ data }) => {
        if (!data) return;
        setForm({
          businessName: data.businessName || '', description: data.description || '',
          experienceYears: data.experienceYears ?? 0, city: data.city || '',
          address: data.address || '', phone: data.phone || user?.phone || '', priceFrom: data.priceFrom ?? 0,
        });
        setCategories(data.categories || []);
        setAnimals(data.handlesAnimalTypes || []);
        setSizes(data.handlesSizes || []);
        setAvailability(data.availability || []);
        setPreview(data.photo || '');
        setStatus(data.status);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const dayEntry = (day) => availability.find((a) => a.day === day);

  const toggleDay = (day) => {
    setAvailability((prev) =>
      prev.some((a) => a.day === day) ? prev.filter((a) => a.day !== day) : [...prev, { day, slots: [] }]
    );
  };

  const toggleSlot = (day, slot) => {
    setAvailability((prev) =>
      prev.map((a) =>
        a.day === day
          ? { ...a, slots: a.slots.includes(slot) ? a.slots.filter((s) => s !== slot) : [...a.slots, slot].sort() }
          : a
      )
    );
  };

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      body.append('categories', JSON.stringify(categories));
      body.append('handlesAnimalTypes', JSON.stringify(animals));
      body.append('handlesSizes', JSON.stringify(sizes));
      body.append('availability', JSON.stringify(availability));
      if (photo) body.append('photo', photo);

      const { data } = await api.post('/providers', body);
      setStatus(data.status);
      setProviderProfile(data);
      toast.success(status ? 'Profile saved' : 'Profile submitted for verification');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader
        eyebrow="Service provider"
        title="Business profile"
        description="This is what pet owners see in search. An administrator verifies it before your services go live."
        actions={
          status && (
            <Badge tone={status === 'verified' ? 'moss' : status === 'rejected' ? 'coral' : 'marigold'}>
              {status === 'verified' ? 'Verified' : status === 'rejected' ? 'Not approved' : 'Pending verification'}
            </Badge>
          )
        }
      />

      <form onSubmit={submit} className="space-y-6">
        <ErrorNote message={error} />

        <section className="card card-pad">
          <h2 className="text-lg font-semibold">About your business</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Business or clinic name" required>
              <input required className="input" value={form.businessName} onChange={set('businessName')} placeholder="Paws & Care Veterinary Clinic" />
            </Field>
            <Field label="City" required hint="Owners filter providers by city.">
              <input required className="input" value={form.city} onChange={set('city')} placeholder="Chennai" />
            </Field>
            <Field label="Years of experience">
              <input type="number" min="0" max="60" className="input" value={form.experienceYears} onChange={set('experienceYears')} />
            </Field>
            <Field label="Contact phone">
              <input className="input" value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Address">
              <input className="input" value={form.address} onChange={set('address')} placeholder="Anna Nagar, Chennai" />
            </Field>
            <Field label="Starting price (₹)" hint="Shown as 'from' on your card.">
              <input type="number" min="0" className="input" value={form.priceFrom} onChange={set('priceFrom')} />
            </Field>
          </div>
          <div className="mt-5 grid gap-5">
            <Field label="Description" hint="What you do, who you are good with, what makes the visit easy.">
              <textarea className="textarea" value={form.description} onChange={set('description')} maxLength={1200} />
            </Field>
            <Field label="Profile photo or logo">
              <div className="flex items-center gap-4">
                {preview ? (
                  <img src={preview} alt="" className="h-16 w-16 rounded-xl border border-line object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-xl bg-moss-soft text-moss-deep"><Upload className="h-5 w-5" /></span>
                )}
                <input type="file" accept="image/*" onChange={pickPhoto} className="text-[13px] text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-moss-soft file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-pine" />
              </div>
            </Field>
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="text-lg font-semibold">What you offer</h2>
          <p className="mt-1 text-[13px] text-muted">These drive which searches you appear in.</p>

          <div className="mt-5 space-y-5">
            <div>
              <p className="label">Service categories</p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(categories, setCategories, c)}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                      categories.includes(c) ? 'bg-pine text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">Animals you handle</p>
              <div className="flex flex-wrap gap-2">
                {ANIMAL_TYPES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggle(animals, setAnimals, a)}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                      animals.includes(a) ? 'bg-moss text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">Sizes you handle</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(sizes, setSizes, s)}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                      sizes.includes(s) ? 'bg-moss text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Weekly availability</h2>
          <p className="mt-1 text-[13px] text-muted">
            Turn on the days you work, then pick the slots you offer. Owners can only book a slot you have opened.
          </p>

          <div className="mt-5 space-y-3">
            {DAYS.map((day) => {
              const entry = dayEntry(day);
              return (
                <div key={day} className={`rounded-xl border p-4 ${entry ? 'border-moss/30 bg-moss-soft/40' : 'border-line'}`}>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={Boolean(entry)} onChange={() => toggleDay(day)} className="h-4 w-4 accent-[#12836C]" />
                    <span className="text-[14px] font-semibold">{day}</span>
                    {entry && <span className="text-[12.5px] text-muted">{entry.slots.length} slot{entry.slots.length === 1 ? '' : 's'}</span>}
                  </label>
                  {entry && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {DEFAULT_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => toggleSlot(day, slot)}
                          className={`rounded-lg px-3 py-1.5 font-mono text-[12px] font-medium transition-colors ${
                            entry.slots.includes(slot) ? 'bg-pine text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : status ? 'Save changes' : 'Submit for verification'}
        </button>
      </form>
    </>
  );
}
