import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, Field } from '../../components/ui';
import { ANIMAL_TYPES, GENDERS, SIZES } from '../../lib/constants';
import { toInputDate } from '../../lib/format';

const BLANK = {
  name: '', animalType: 'Dog', breed: '', dob: '', gender: 'Unknown',
  size: 'Medium', weightKg: '', description: '', medicalWarning: '',
};

const SHARING = [
  ['showBreed', 'Breed'],
  ['showDescription', 'Description'],
  ['showMedicalWarning', 'Medical warning and allergies'],
  ['showOwnerName', 'Your name'],
  ['showOwnerPhone', 'Your phone number'],
];

export default function PetForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(BLANK);
  const [publicProfile, setPublicProfile] = useState({
    showBreed: true, showDescription: true, showMedicalWarning: true, showOwnerName: false, showOwnerPhone: false,
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const { data } = await api.get(`/pets/${id}`);
        setForm({
          name: data.name || '', animalType: data.animalType || 'Dog', breed: data.breed || '',
          dob: toInputDate(data.dob), gender: data.gender || 'Unknown', size: data.size || 'Medium',
          weightKg: data.weightKg ?? '', description: data.description || '', medicalWarning: data.medicalWarning || '',
        });
        if (data.publicProfile) setPublicProfile(data.publicProfile);
        setPreview(data.photo || '');
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null) body.append(k, v);
      });
      body.append('publicProfile', JSON.stringify(publicProfile));
      if (photo) body.append('photo', photo);

      const { data } = editing
        ? await api.put(`/pets/${id}`, body)
        : await api.post('/pets', body);

      toast.success(editing ? `${data.name}'s profile updated` : `${data.name} added`);
      navigate(`/owner/pets/${data._id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <Link to={editing ? `/owner/pets/${id}` : '/owner/pets'} className="btn-ghost btn-sm mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <PageHeader
        eyebrow="Pet care"
        title={editing ? `Edit ${form.name || 'pet'}` : 'Add a pet'}
        description="Only the name and animal type are required — you can fill in the rest later."
      />

      <form onSubmit={submit} className="space-y-6">
        <ErrorNote message={error} />

        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Pet details</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Pet name" required>
              <input className="input" required value={form.name} onChange={set('name')} placeholder="Milo" />
            </Field>
            <Field label="Animal type" required>
              <select className="select" value={form.animalType} onChange={set('animalType')}>
                {ANIMAL_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Breed">
              <input className="input" value={form.breed} onChange={set('breed')} placeholder="Golden Retriever" />
            </Field>
            <Field label="Date of birth" hint="Used to show the pet's age on the tag.">
              <input type="date" className="input" value={form.dob} onChange={set('dob')} max={toInputDate(new Date())} />
            </Field>
            <Field label="Gender">
              <select className="select" value={form.gender} onChange={set('gender')}>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Size" hint="Providers are matched partly on the sizes they handle.">
              <select className="select" value={form.size} onChange={set('size')}>
                {SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Current weight (kg)" hint={editing ? 'Log new weigh-ins from the growth dashboard.' : 'Starts the growth chart.'}>
              <input
                type="number" step="0.1" min="0.1" max="200" className="input"
                value={form.weightKg} onChange={set('weightKg')} placeholder="31.2" disabled={editing}
              />
            </Field>
            <Field label="Photo">
              <div className="flex items-center gap-4">
                {preview ? (
                  <img src={preview} alt="" className="h-16 w-16 rounded-xl border border-line object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-xl bg-moss-soft text-moss-deep">
                    <Upload className="h-5 w-5" />
                  </span>
                )}
                <input type="file" accept="image/*" onChange={pickPhoto} className="text-[13px] text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-moss-soft file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-pine" />
              </div>
            </Field>
          </div>

          <div className="mt-5 grid gap-5">
            <Field label="Description" hint="Colour, collar, temperament — what helps someone recognise your pet.">
              <textarea className="textarea" value={form.description} onChange={set('description')} maxLength={600} />
            </Field>
            <Field
              label="Medical warning"
              hint="Shown prominently to anyone who scans the collar tag. Keep it to what a stranger must know."
            >
              <textarea
                className="textarea min-h-[80px]" value={form.medicalWarning} onChange={set('medicalWarning')}
                maxLength={300} placeholder="Allergic to chicken. Do not feed chicken-based treats."
              />
            </Field>
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="text-lg font-semibold">What a finder can see</h2>
          <p className="mt-1 text-[13px] text-muted">
            When someone scans the collar tag they always see the pet&rsquo;s name, photo and age. Everything below is your
            choice. Your address is never shown.
          </p>
          <div className="mt-4 space-y-2.5">
            {SHARING.map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 hover:bg-canvas">
                <input
                  type="checkbox"
                  checked={Boolean(publicProfile[key])}
                  onChange={(e) => setPublicProfile({ ...publicProfile, [key]: e.target.checked })}
                  className="h-4 w-4 accent-[#12836C]"
                />
                <span className="text-[14px] font-medium">{label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add pet'}
          </button>
          <Link to={editing ? `/owner/pets/${id}` : '/owner/pets'} className="btn-outline">Cancel</Link>
        </div>
      </form>
    </>
  );
}
