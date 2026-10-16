import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Paperclip, Syringe, FileText, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { Badge, ConfirmButton, Field, Modal, Spinner } from '../ui';
import { fmtDate, toInputDate } from '../../lib/format';
import { HEALTH_RECORD_TYPES } from '../../lib/constants';

const BLANK_RECORD = {
  type: 'Vet Visit', title: '', description: '', date: new Date().toISOString().slice(0, 10),
  vetName: '', clinic: '', severity: 'Low',
  dosage: '', frequency: '', startDate: '', endDate: '', isActive: true,
};

const BLANK_VACC = { name: '', givenOn: new Date().toISOString().slice(0, 10), nextDueDate: '', vetName: '', batchNo: '', notes: '' };

export default function PetPassport({ pet, onRefresh }) {
  const [records, setRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState({ all: [], upcoming: [], overdue: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const [recordOpen, setRecordOpen] = useState(false);
  const [vaccOpen, setVaccOpen] = useState(false);
  const [record, setRecord] = useState(BLANK_RECORD);
  const [vacc, setVacc] = useState(BLANK_VACC);
  const [files, setFiles] = useState([]);
  const [vaccDoc, setVaccDoc] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [r, v] = await Promise.all([
        api.get(`/health-records/pet/${pet._id}`),
        api.get(`/vaccinations/pet/${pet._id}`),
      ]);
      setRecords(r.data);
      setVaccinations(v.data);
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

  const saveRecord = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = new FormData();
      ['type', 'title', 'description', 'date', 'vetName', 'clinic', 'severity'].forEach((k) => {
        if (record[k]) body.append(k, record[k]);
      });
      if (record.type === 'Medication') {
        body.append(
          'medication',
          JSON.stringify({
            dosage: record.dosage, frequency: record.frequency,
            startDate: record.startDate || undefined, endDate: record.endDate || undefined,
            isActive: record.isActive,
          })
        );
      }
      files.forEach((f) => body.append('attachments', f));
      await api.post(`/health-records/pet/${pet._id}`, body);
      toast.success('Added to the passport');
      setRecordOpen(false);
      setRecord(BLANK_RECORD);
      setFiles([]);
      load();
      onRefresh?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveVaccination = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(vacc).forEach(([k, v]) => v && body.append(k, v));
      if (vaccDoc) body.append('document', vaccDoc);
      await api.post(`/vaccinations/pet/${pet._id}`, body);
      toast.success('Vaccination recorded');
      setVaccOpen(false);
      setVacc(BLANK_VACC);
      setVaccDoc(null);
      load();
      onRefresh?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id) => {
    try {
      await api.delete(`/health-records/${id}`);
      setRecords((list) => list.filter((r) => r._id !== id));
      toast.success('Record deleted');
      onRefresh?.();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const deleteVaccination = async (id) => {
    try {
      await api.delete(`/vaccinations/${id}`);
      load();
      toast.success('Vaccination record deleted');
      onRefresh?.();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>;

  const shown = filter === 'All' ? records : records.filter((r) => r.type === filter);

  return (
    <div className="space-y-6">
      {/* Signature: the passport booklet header, carrying the machine-readable strip */}
      <section className="passport">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="eyebrow">Smart health passport</p>
            <h2 className="mt-1 font-display text-xl font-semibold">{pet.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary btn-sm" onClick={() => setVaccOpen(true)}>
              <Syringe className="h-4 w-4" /> Add vaccination
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={() => setRecordOpen(true)}>
              <Plus className="h-4 w-4" /> Add record
            </button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 px-5 py-4 text-[13px] sm:grid-cols-4">
          {[
            ['Animal', pet.animalType], ['Breed', pet.breed || '—'],
            ['Records', records.length], ['Vaccinations', vaccinations.all.length],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted">{k}</dt>
              <dd className="mt-0.5 font-mono font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="passport-strip">
          MT&lt;&lt;{pet.name.toUpperCase()}&lt;&lt;{pet.animalType.toUpperCase()}&lt;&lt;REC:{String(records.length).padStart(3, '0')}
          &lt;&lt;VAC:{String(vaccinations.all.length).padStart(3, '0')}
          {vaccinations.overdue.length ? `<<OVERDUE:${vaccinations.overdue.length}` : '<<STATUS:CURRENT'}&lt;&lt;&lt;
        </div>
      </section>

      <section className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Vaccinations</h3>
          <div className="flex gap-1.5">
            {vaccinations.overdue.length > 0 && <Badge tone="coral">{vaccinations.overdue.length} overdue</Badge>}
            {vaccinations.upcoming.length > 0 && <Badge tone="marigold">{vaccinations.upcoming.length} upcoming</Badge>}
          </div>
        </div>

        {vaccinations.all.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            No vaccinations recorded. Add one with its next due date to start reminders.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line text-[12px] uppercase tracking-wider text-muted">
                  <th className="pb-2 font-medium">Vaccine</th>
                  <th className="pb-2 font-medium">Given</th>
                  <th className="pb-2 font-medium">Next due</th>
                  <th className="pb-2 font-medium">Vet</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {vaccinations.all.map((v) => {
                  const overdue = v.nextDueDate && new Date(v.nextDueDate) < new Date();
                  return (
                    <tr key={v._id} className="border-b border-line last:border-0">
                      <td className="py-3 font-medium">
                        {v.name}
                        {v.batchNo && <span className="ml-2 font-mono text-[11px] text-muted">#{v.batchNo}</span>}
                        {v.document?.url && (
                          <a href={v.document.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex text-moss-deep" title="Open document">
                            <Paperclip className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </td>
                      <td className="py-3 font-mono text-[12.5px]">{fmtDate(v.givenOn)}</td>
                      <td className="py-3">
                        {v.nextDueDate ? (
                          <Badge tone={overdue ? 'coral' : 'moss'}>{fmtDate(v.nextDueDate)}</Badge>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 text-muted">{v.vetName || '—'}</td>
                      <td className="py-3 text-right">
                        <ConfirmButton
                          className="btn-ghost btn-sm text-coral"
                          question={`Delete the ${v.name} record?`}
                          onConfirm={() => deleteVaccination(v._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </ConfirmButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Medical records</h3>
          <select className="select w-auto text-[13px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option>
            {HEALTH_RECORD_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        {shown.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            {filter === 'All' ? 'No records yet. Add a vet visit, allergy, condition, prescription or report.' : `No ${filter.toLowerCase()} records.`}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {shown.map((r) => (
              <li key={r._id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={r.type === 'Allergy' ? 'coral' : r.type === 'Medication' ? 'marigold' : 'moss'}>{r.type}</Badge>
                      {r.type === 'Condition' && <Badge tone={r.severity === 'High' ? 'coral' : 'neutral'}>{r.severity}</Badge>}
                      {r.type === 'Medication' && r.medication?.isActive && <Badge tone="moss">Active</Badge>}
                    </div>
                    <p className="mt-2 text-[15px] font-semibold">{r.title}</p>
                    {r.description && <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{r.description}</p>}
                    {r.type === 'Medication' && (
                      <p className="mt-1.5 font-mono text-[12px] text-muted">
                        {[r.medication?.dosage, r.medication?.frequency].filter(Boolean).join(' · ')}
                        {r.medication?.endDate ? ` · until ${fmtDate(r.medication.endDate)}` : ''}
                      </p>
                    )}
                    {(r.vetName || r.clinic) && (
                      <p className="mt-1.5 text-[12.5px] text-muted">{[r.vetName, r.clinic].filter(Boolean).join(' · ')}</p>
                    )}
                    {r.attachments?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {r.attachments.map((a) => (
                          <a
                            key={a.url}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2.5 py-1.5 text-[12px] font-medium hover:bg-moss-soft"
                          >
                            <FileText className="h-3.5 w-3.5" /> {a.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[11.5px] text-muted">{fmtDate(r.date)}</span>
                    <ConfirmButton
                      className="btn-ghost btn-sm text-coral"
                      question={`Delete "${r.title}"?`}
                      onConfirm={() => deleteRecord(r._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </ConfirmButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add health record */}
      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Add a health record" description="Vet visits, allergies, conditions, prescriptions and reports all live here.">
        <form onSubmit={saveRecord} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Record type" required>
              <select className="select" value={record.type} onChange={(e) => setRecord({ ...record, type: e.target.value })}>
                {HEALTH_RECORD_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Date" required>
              <input type="date" required className="input" value={record.date} onChange={(e) => setRecord({ ...record, date: e.target.value })} />
            </Field>
          </div>
          <Field label="Title" required>
            <input required className="input" value={record.title} onChange={(e) => setRecord({ ...record, title: e.target.value })} placeholder="Annual health check" />
          </Field>
          <Field label="Details">
            <textarea className="textarea" value={record.description} onChange={(e) => setRecord({ ...record, description: e.target.value })} />
          </Field>

          {record.type === 'Condition' && (
            <Field label="Severity">
              <select className="select" value={record.severity} onChange={(e) => setRecord({ ...record, severity: e.target.value })}>
                {['Low', 'Moderate', 'High'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          )}

          {record.type === 'Medication' && (
            <div className="rounded-xl bg-canvas p-4">
              <p className="text-[13px] font-semibold">Medication schedule</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Dosage">
                  <input className="input" value={record.dosage} onChange={(e) => setRecord({ ...record, dosage: e.target.value })} placeholder="1 tablet" />
                </Field>
                <Field label="Frequency">
                  <input className="input" value={record.frequency} onChange={(e) => setRecord({ ...record, frequency: e.target.value })} placeholder="Twice daily" />
                </Field>
                <Field label="Start date">
                  <input type="date" className="input" value={record.startDate} onChange={(e) => setRecord({ ...record, startDate: e.target.value })} />
                </Field>
                <Field label="End date" hint="Drives the reminder countdown.">
                  <input type="date" className="input" value={record.endDate} onChange={(e) => setRecord({ ...record, endDate: e.target.value })} />
                </Field>
              </div>
              <label className="mt-3 flex items-center gap-2.5 text-[13.5px] font-medium">
                <input type="checkbox" className="h-4 w-4 accent-[#12836C]" checked={record.isActive} onChange={(e) => setRecord({ ...record, isActive: e.target.checked })} />
                Currently being given
              </label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vet name">
              <input className="input" value={record.vetName} onChange={(e) => setRecord({ ...record, vetName: e.target.value })} />
            </Field>
            <Field label="Clinic">
              <input className="input" value={record.clinic} onChange={(e) => setRecord({ ...record, clinic: e.target.value })} />
            </Field>
          </div>

          <Field label="Attach documents" hint="Reports or prescriptions — up to 5 images or PDFs, 5 MB each.">
            <input
              type="file" multiple accept="image/*,.pdf"
              onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
              className="text-[13px] text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-moss-soft file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-pine"
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add record'}</button>
            <button type="button" className="btn-outline" onClick={() => setRecordOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Add vaccination */}
      <Modal open={vaccOpen} onClose={() => setVaccOpen(false)} title="Record a vaccination" description="Setting a next due date turns on the reminder for this vaccine.">
        <form onSubmit={saveVaccination} className="space-y-4">
          <Field label="Vaccine name" required>
            <input required className="input" value={vacc.name} onChange={(e) => setVacc({ ...vacc, name: e.target.value })} placeholder="Rabies" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Given on" required>
              <input type="date" required className="input" value={vacc.givenOn} onChange={(e) => setVacc({ ...vacc, givenOn: e.target.value })} />
            </Field>
            <Field label="Next due" hint="Leave blank for one-off vaccines.">
              <input type="date" className="input" value={vacc.nextDueDate} onChange={(e) => setVacc({ ...vacc, nextDueDate: e.target.value })} />
            </Field>
            <Field label="Vet name">
              <input className="input" value={vacc.vetName} onChange={(e) => setVacc({ ...vacc, vetName: e.target.value })} />
            </Field>
            <Field label="Batch number">
              <input className="input" value={vacc.batchNo} onChange={(e) => setVacc({ ...vacc, batchNo: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea className="textarea min-h-[80px]" value={vacc.notes} onChange={(e) => setVacc({ ...vacc, notes: e.target.value })} />
          </Field>
          <Field label="Vaccination card or certificate">
            <input
              type="file" accept="image/*,.pdf" onChange={(e) => setVaccDoc(e.target.files?.[0] || null)}
              className="text-[13px] text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-moss-soft file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-pine"
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Record vaccination'}</button>
            <button type="button" className="btn-outline" onClick={() => setVaccOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
