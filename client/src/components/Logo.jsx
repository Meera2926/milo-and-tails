export default function Logo({ compact = false, onDark = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${onDark ? 'bg-marigold' : 'bg-pine'}`}>
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
          <circle cx="11" cy="11" r="2.6" fill={onDark ? '#0E4A3C' : '#E9A13B'} />
          <circle cx="17.5" cy="9.2" r="2.4" fill={onDark ? '#0E4A3C' : '#E9A13B'} />
          <circle cx="23" cy="13" r="2.2" fill={onDark ? '#0E4A3C' : '#E9A13B'} />
          <path
            d="M16.5 15c3.2 0 6 2.6 6 5.4 0 2.3-1.9 3.6-4.2 3.6-1 0-1.3-.4-2.3-.4s-1.3.4-2.3.4c-2.3 0-4.2-1.3-4.2-3.6 0-2.8 2.8-5.4 7-5.4Z"
            fill={onDark ? '#0E4A3C' : '#EEF3EF'}
          />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block font-display text-[17px] font-semibold ${onDark ? 'text-white' : 'text-ink'}`}>
            Milo &amp; Tails
          </span>
          <span className={`block font-mono text-[10px] uppercase tracking-[0.18em] ${onDark ? 'text-white/60' : 'text-muted'}`}>
            Pet care &amp; services
          </span>
        </span>
      )}
    </span>
  );
}
