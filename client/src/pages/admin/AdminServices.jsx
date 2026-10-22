import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { PageHeader, PageLoader, ErrorNote, EmptyState, Badge } from '../../components/ui';
import { money, fmtDate } from '../../lib/format';
import { SERVICE_CATEGORIES } from '../../lib/constants';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    api.get('/admin/services')
      .then(({ data }) => setServices(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading services" />;

  const filtered = category ? services.filter((s) => s.category === category) : services;

  return (
    <>
      <PageHeader
        eyebrow="Administrator"
        title="Services"
        description="Every service listed on the platform, including those from providers still awaiting verification."
        actions={
          <select className="select w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        }
      />

      <ErrorNote message={error} />

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No services listed" description="Services appear once verified providers publish them." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[11.5px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Provider</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Listed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-[12px] text-muted">{s.animalTypes.join(', ')}</p>
                  </td>
                  <td className="px-5 py-3 text-muted">{s.category}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{s.provider?.businessName || '—'}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-[12px] text-muted">{s.provider?.city}</span>
                      <Badge tone={s.provider?.status === 'verified' ? 'moss' : 'marigold'}>{s.provider?.status}</Badge>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono">{money(s.price)}</td>
                  <td className="px-5 py-3 font-mono text-[12px] text-muted">{s.durationMins} min</td>
                  <td className="px-5 py-3">
                    <Badge tone={s.isActive ? 'moss' : 'neutral'}>{s.isActive ? 'Visible' : 'Hidden'}</Badge>
                    <p className="mt-1 font-mono text-[11px] text-muted">{fmtDate(s.createdAt, 'd MMM yy')}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
