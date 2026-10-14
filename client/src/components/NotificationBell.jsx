import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../api/client';
import { fmtRelative } from '../lib/format';

const ICONS = { booking: '📅', reminder: '⏰', 'qr-scan': '📍', provider: '🏷️', system: '🔔' };

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* the bell should never break the page */
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClickAway = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    setUnread(0);
    setItems((list) => list.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl border border-line bg-surface p-2.5 text-muted hover:text-ink"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,22rem)] animate-fade-up overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-[12.5px] font-semibold text-moss-deep hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Nothing new yet.</p>
            ) : (
              items.slice(0, 12).map((n) => (
                <Link
                  key={n._id}
                  to={n.link || '#'}
                  onClick={() => setOpen(false)}
                  className={`flex gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-canvas ${
                    n.isRead ? '' : 'bg-moss-soft/40'
                  }`}
                >
                  <span aria-hidden="true">{ICONS[n.type] || '🔔'}</span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold leading-snug">{n.title}</span>
                    {n.message && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{n.message}</span>}
                    <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-wider text-muted">
                      {fmtRelative(n.createdAt)}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
