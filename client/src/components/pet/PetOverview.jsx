import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Syringe, Pill, Scale, CalendarDays, Plus } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import WeightChart from '../WeightChart';
import { Badge, Field, Modal, StatCard } from '../ui';
import { fmtDate, daysLabel } from '../../lib/format';

const HEALTH_TONE = { Good: 'moss', Incomplete: 'marigold', 'Needs attention': 'coral' };

export default function PetOverview({ data, onRefresh }) {
  const { pet, healthStatus, alerts, weightHistory, currentWeight, upcomingVaccinations,
    overdueVaccinations, activeMedications, allergies, recentEvents, upcomingBookings, daysToNextVaccination } = data;

  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const logWeight = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/pets/${pet._id}/weight`, { weightKg: Number(weight), date, note });
      toast.success('Weight logged');
      setOpen(false);
      setWeight('');
      setNote('');
      onRefresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const trend =
    weightHistory.length >= 2
      ? weightHistory[weightHistory.length - 1].weightKg - weightHistory[weightHistory.length - 2].weightKg
      : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Health status"
          value={healthStatus}
          sub={alerts.length ? alerts[0] : 'No issues flagged'}
          icon={Activity}
          tone={HEALTH_TONE[healthStatus]}
        />
        <StatCard
          label="Current weight"
          value={currentWeight ? `${currentWeight} kg` : '—'}
          sub={trend === null ? 'Log a second weigh-in for a trend' : `${trend >= 0 ? '+' : ''}${trend.toFixed(1)} kg since last`}
          icon={Scale}
        />
        <StatCard
          label="Next vaccination"
          value={upcomingVaccinations[0] ? daysLabel(daysToNextVaccination) : '—'}
          sub={upcomingVaccinations[0]?.name || 'Nothing scheduled'}
          icon={Syringe}
          tone={overdueVaccinations.length ? 'coral' : upcomingVaccinations.length ? 'marigold' : 'default'}
        />
        <StatCard label="Active medication" value={activeMedications.length} icon={Pill} />
      </div>

      {alerts.length > 0 && (
        <div className="rounded-2xl border border-coral/25 bg-coral-soft px-5 py-4">
          <p className="text-[13.5px] font-semibold text-coral">Worth acting on</p>
          <ul className="mt-2 space-y-1 text-[13px] text-coral/90">
            {alerts.map((a) => (
              <li key={a}>· {a}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Growth chart</h2>
            <p className="text-[13px] text-muted">Weight over time, from every weigh-in you have logged.</p>
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Log weight
          </button>
        </div>
        <div className="mt-5">
          <WeightChart history={weightHistory} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Vaccination status</h2>
          {overdueVaccinations.length === 0 && upcomingVaccinations.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">
              No vaccination dates recorded yet. Add them in the Health passport tab to switch reminders on.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {[...overdueVaccinations, ...upcomingVaccinations].slice(0, 5).map((v) => {
                const overdue = new Date(v.nextDueDate) < new Date();
                return (
                  <li key={v._id} className="flex items-center justify-between gap-3 border-b border-line pb-2.5 last:border-0">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium">{v.name}</p>
                      <p className="text-[12.5px] text-muted">Given {fmtDate(v.givenOn)}</p>
                    </div>
                    <Badge tone={overdue ? 'coral' : 'marigold'}>
                      {overdue ? 'Overdue' : 'Due'} {fmtDate(v.nextDueDate, 'd MMM')}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Allergies &amp; active medication</h2>
          {allergies.length === 0 && activeMedications.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">Nothing recorded. Add allergies so they appear on the collar tag.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {allergies.length > 0 && (
                <div>
                  <p className="eyebrow">Allergies</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {allergies.map((a) => (
                      <Badge key={a._id} tone="coral">{a.title}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {activeMedications.length > 0 && (
                <div>
                  <p className="eyebrow">On medication</p>
                  <ul className="mt-2 space-y-2">
                    {activeMedications.map((m) => (
                      <li key={m._id} className="rounded-xl bg-canvas px-3.5 py-2.5">
                        <p className="text-[13.5px] font-medium">{m.title}</p>
                        <p className="text-[12.5px] text-muted">
                          {[m.medication?.dosage, m.medication?.frequency].filter(Boolean).join(' · ') || 'Ongoing'}
                          {m.medication?.endDate ? ` · until ${fmtDate(m.medication.endDate)}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Upcoming appointments</h2>
          {upcomingBookings.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">
              Nothing booked.{' '}
              <Link to="/owner/services" className="font-semibold text-moss-deep underline underline-offset-2">
                Find a provider
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {upcomingBookings.map((b) => (
                <li key={b._id} className="flex items-start gap-3 rounded-xl bg-canvas px-3.5 py-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-moss" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{b.service?.title}</p>
                    <p className="text-[12.5px] text-muted">
                      {b.provider?.businessName} · {fmtDate(b.date)} · {b.timeSlot}
                    </p>
                  </div>
                  <Badge tone={b.status === 'Accepted' ? 'moss' : 'marigold'}>{b.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card card-pad">
          <h2 className="text-lg font-semibold">Recent health events</h2>
          {recentEvents.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">No health records yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {recentEvents.map((r) => (
                <li key={r._id} className="border-b border-line pb-2.5 last:border-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13.5px] font-medium">{r.title}</p>
                    <span className="font-mono text-[11px] text-muted">{fmtDate(r.date, 'd MMM yy')}</span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-muted">{r.type}{r.vetName ? ` · ${r.vetName}` : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Log a weigh-in" description={`Adds a point to ${pet.name}'s growth chart.`} size="sm">
        <form onSubmit={logWeight} className="space-y-4">
          <Field label="Weight (kg)" required>
            <input type="number" step="0.1" min="0.1" max="200" required className="input" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
          <Field label="Date" required>
            <input type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Note" hint="Optional — for example 'after switching food'.">
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </Field>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Log weight'}</button>
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
