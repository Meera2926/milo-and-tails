import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useEffect } from 'react';
import { STATUS_STYLES } from '../lib/constants';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`${className} animate-spin text-moss`} aria-hidden="true" />;
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted" role="status">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}…</p>
    </div>
  );
}

export function ErrorNote({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-coral/30 bg-coral-soft px-4 py-3 text-sm text-coral">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-1 font-semibold underline underline-offset-2">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/** Empty states are an invitation to act, so they always carry the next step. */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card card-pad flex flex-col items-center gap-3 py-12 text-center">
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-moss-soft text-moss-deep">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'bg-surface',
    moss: 'bg-moss-soft border-moss/20',
    marigold: 'bg-marigold-soft border-marigold/30',
    coral: 'bg-coral-soft border-coral/25',
  };
  return (
    <div className={`card card-pad ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted" />}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold leading-none">{value}</p>
      {sub && <p className="mt-2 text-[12.5px] text-muted">{sub}</p>}
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_STYLES[status] || 'bg-line text-muted'}`}>{status}</span>;
}

export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-canvas text-muted',
    moss: 'bg-moss-soft text-moss-deep',
    marigold: 'bg-marigold-soft text-[#8A5B12]',
    coral: 'bg-coral-soft text-coral',
    pine: 'bg-pine/10 text-pine',
  };
  return <span className={`badge ${tones[tone]} ${className}`}>{children}</span>;
}

export function Modal({ open, onClose, title, description, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} animate-fade-up rounded-t-2xl bg-surface shadow-lift sm:rounded-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, error, children, required }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label} {required && <span className="text-coral">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="hint text-coral">{error}</p> : hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function Avatar({ name = '', src, size = 'md', className = '' }) {
  const sizes = { sm: 'h-8 w-8 text-[11px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-sm' };
  const letters = name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('');
  if (src) {
    return <img src={src} alt="" className={`${sizes[size]} rounded-full border border-line object-cover ${className}`} />;
  }
  return (
    <span className={`${sizes[size]} grid shrink-0 place-items-center rounded-full bg-pine font-semibold text-white ${className}`}>
      {letters || '?'}
    </span>
  );
}

export function RatingStars({ value = 0, count, size = 'sm', showNumber = true }) {
  const rounded = Math.round(value * 2) / 2;
  const px = size === 'lg' ? 'text-lg' : 'text-[13px]';
  return (
    <span className={`inline-flex items-center gap-1.5 ${px}`}>
      <span className="text-marigold" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i}>{rounded >= i ? '★' : rounded >= i - 0.5 ? '⯨' : '☆'}</span>
        ))}
      </span>
      {showNumber && (
        <span className="text-[12.5px] font-medium text-muted">
          {value ? value.toFixed(1) : 'New'}
          {count ? ` (${count})` : ''}
        </span>
      )}
      <span className="sr-only">{value ? `${value} out of 5` : 'Not rated yet'}</span>
    </span>
  );
}

export function ConfirmButton({ onConfirm, children, question = 'Are you sure?', className = 'btn-danger btn-sm' }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        // eslint-disable-next-line no-alert
        if (window.confirm(question)) onConfirm();
      }}
    >
      {children}
    </button>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line pb-px" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
            active === t.id ? 'border-moss text-moss-deep' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="ml-1.5 rounded-full bg-canvas px-1.5 py-0.5 text-[11px] text-muted">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
