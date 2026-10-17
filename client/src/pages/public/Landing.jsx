import { Link } from 'react-router-dom';
import { QrCode, ShieldCheck, LineChart, BellRing, ArrowRight } from 'lucide-react';
import Logo from '../../components/Logo';

const FEATURES = [
  {
    icon: QrCode,
    title: 'QR collar tag with location alert',
    body: 'Every pet gets a printable tag. A finder scans it, sees only what you chose to share, and can share their location with one tap — with their own permission, never silently.',
  },
  {
    icon: ShieldCheck,
    title: 'Smart health passport',
    body: 'Vaccinations, allergies, conditions, prescriptions and scanned reports live in one profile you can hand to any vet or boarding desk.',
  },
  {
    icon: LineChart,
    title: 'Growth and health dashboard',
    body: 'Weight over time, vaccination status, active medication and what is due next — read at a glance instead of dug out of a folder.',
  },
  {
    icon: BellRing,
    title: 'Reminders that arrive early',
    body: 'The next due date on every vaccination becomes a reminder, alongside running medication and booked appointments — all on one dashboard.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Create account</Link>
        </nav>
      </header>

      {/* Hero: the collar tag is the product's most characteristic object, so it leads. */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-16">
        <div className="animate-fade-up">
          <p className="eyebrow">Pet care &amp; service management</p>
          <h1 className="mt-3 text-[38px] font-semibold leading-[1.06] sm:text-[52px]">
            Everything about your pet,
            <span className="text-moss"> on one tag.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
            Milo &amp; Tails keeps the health passport, vaccination schedule and service bookings for every pet you
            care for — and turns all of it into a collar tag that helps a stranger get your pet home.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">
              Start with your first pet <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register?role=provider" className="btn-outline">
              Register as a vet or provider
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              ['4', 'Service categories'],
              ['3', 'Roles, one platform'],
              ['1', 'Tag per pet'],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="font-display text-2xl font-semibold">{n}</dt>
                <dd className="mt-1 text-[12.5px] leading-snug text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The printable tag, rendered as it appears in the app */}
        <div className="animate-fade-up lg:pl-6">
          <div className="passport mx-auto max-w-sm rotate-[-1.5deg] transition-transform duration-500 hover:rotate-0">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <Logo compact />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-pine/70">Pet identity tag</span>
            </div>
            <div className="flex gap-4 px-5 py-5">
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-pine p-2.5">
                <svg viewBox="0 0 21 21" className="h-full w-full" aria-hidden="true">
                  {/* Decorative QR-style pattern, not a scannable code */}
                  <rect width="21" height="21" fill="#0E4A3C" />
                  {[[0, 0], [14, 0], [0, 14]].map(([x, y]) => (
                    <g key={`${x}-${y}`}>
                      <rect x={x} y={y} width="7" height="7" fill="#EEF3EF" />
                      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#0E4A3C" />
                      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#EEF3EF" />
                    </g>
                  ))}
                  {[[9, 2], [11, 4], [9, 6], [13, 8], [9, 10], [15, 11], [11, 13], [9, 16], [13, 15], [16, 17], [11, 18], [2, 9], [4, 11], [6, 9], [8, 12], [2, 12], [5, 16], [17, 3], [19, 6], [18, 9]].map(([x, y]) => (
                    <rect key={`${x}.${y}`} x={x} y={y} width="1.6" height="1.6" fill="#EEF3EF" />
                  ))}
                </svg>
              </div>
              <div className="min-w-0">
                <p className="eyebrow">If found, scan me</p>
                <p className="mt-1 font-display text-2xl font-semibold">Milo</p>
                <p className="text-[13px] text-muted">Golden Retriever · 3 years</p>
                <p className="mt-2.5 inline-flex rounded-lg bg-coral-soft px-2.5 py-1.5 text-[11.5px] font-semibold leading-snug text-coral">
                  Allergic to chicken — no chicken treats
                </p>
              </div>
            </div>
            <div className="passport-strip">
              MT&lt;&lt;IND&lt;MILO&lt;&lt;GOLDEN&lt;RETRIEVER&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br />
              TAG4F9A2C71B0E&lt;&lt;VACC:CURRENT&lt;&lt;WT:31.2KG&lt;&lt;&lt;&lt;&lt;
            </div>
          </div>
          <p className="mt-4 text-center text-[12.5px] text-muted">
            Print it, clip it to the collar. A finder never sees your address.
          </p>
        </div>
      </section>

      <section className="border-y border-line bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-xl text-[26px] font-semibold leading-tight sm:text-[32px]">
            Four things that make the day-to-day easier
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <article key={title} className="border-t border-line pt-5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] tracking-[0.16em] text-muted">0{i + 1}</span>
                  <Icon className="h-[18px] w-[18px] text-moss" />
                </div>
                <h3 className="mt-3 text-[17px] font-semibold">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-[26px] font-semibold sm:text-[32px]">Built for three kinds of people</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { role: 'Pet owners', body: 'Track every pet, get reminders before a vaccination lapses, book grooming or a vet slot, and keep a tag on the collar.' },
            { role: 'Vets & providers', body: 'Publish services with real availability, accept or decline requests, mark work complete and build a rating that brings the next booking.' },
            { role: 'Administrators', body: 'Verify providers before they can take bookings, review every service and booking, and watch platform activity from one overview.' },
          ].map(({ role, body }) => (
            <article key={role} className="card card-pad">
              <h3 className="font-display text-lg font-semibold">{role}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl bg-pine px-6 py-7 text-white sm:px-8">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">Ready to add your first pet?</h3>
            <p className="mt-1.5 text-[14px] text-white/70">It takes about a minute, and the tag is generated for you.</p>
          </div>
          <Link to="/register" className="btn bg-marigold text-pine hover:bg-[#DC9430]">
            Create your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-line px-4 py-8 text-center text-[12.5px] text-muted sm:px-6">
        Milo &amp; Tails · A pet care and service management platform
      </footer>
    </div>
  );
}
