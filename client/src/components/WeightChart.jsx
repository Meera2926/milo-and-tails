import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';

/** Growth chart for the pet dashboard. Falls back to a prompt when there is one point or none. */
export default function WeightChart({ history = [], height = 240 }) {
  const data = [...history]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((w) => ({
      date: typeof w.date === 'string' ? w.date : new Date(w.date).toISOString(),
      weight: w.weightKg,
    }));

  if (data.length < 2) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-line px-4 py-10 text-center" style={{ height }}>
        <p className="max-w-xs text-sm text-muted">
          Log at least two weigh-ins to see the growth curve. Weight is the quickest way to spot a health change early.
        </p>
      </div>
    );
  }

  const values = data.map((d) => d.weight);
  const pad = Math.max(0.5, (Math.max(...values) - Math.min(...values)) * 0.25);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
          <CartesianGrid stroke="#DCE5DF" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => format(parseISO(v), 'MMM yy')}
            tick={{ fontSize: 11, fill: '#5F6F69' }}
            axisLine={{ stroke: '#DCE5DF' }}
            tickLine={false}
          />
          <YAxis
            domain={[Math.min(...values) - pad, Math.max(...values) + pad]}
            tick={{ fontSize: 11, fill: '#5F6F69' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => `${v}kg`}
          />
          <Tooltip
            labelFormatter={(v) => format(parseISO(v), 'd MMM yyyy')}
            formatter={(v) => [`${v} kg`, 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#12836C"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: '#12836C', strokeWidth: 0 }}
            activeDot={{ r: 5.5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
