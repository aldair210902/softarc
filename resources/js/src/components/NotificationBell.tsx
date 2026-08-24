import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Ticket, Target, Info, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { apiGet, apiMutate } from '../lib/api';

type AppNotification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  createdAtHuman?: string;
};

type NotifResponse = {
  items: AppNotification[];
  unread: number;
};

function typeIcon(type: string) {
  if (type === 'ticket') return Ticket;
  if (type === 'lead') return Target;
  if (type === 'expiry') return CalendarClock;
  return Info;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotifResponse>({ items: [], unread: 0 });
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (fresh = false) => {
    try {
      const res = await apiGet<NotifResponse>('/api/notifications?limit=20', { fresh });
      setData(res || { items: [], unread: 0 });
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    void load(true);
    const id = window.setInterval(() => void load(true), 20000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void load(true).finally(() => setLoading(false));
  }, [open, load]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const markOne = async (n: AppNotification) => {
    if (!n.read) {
      await apiMutate('post', `/api/notifications/${n.id}/read`);
      setData((prev) => ({
        unread: Math.max(0, prev.unread - 1),
        items: prev.items.map((i) => (i.id === n.id ? { ...i, read: true } : i)),
      }));
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const markAll = async () => {
    await apiMutate('post', '/api/notifications/read-all');
    setData((prev) => ({
      unread: 0,
      items: prev.items.map((i) => ({ ...i, read: true })),
    }));
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)} title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {data.unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-[10px] font-bold text-sa-text flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.8)]">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-sa-panel border border-sa-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-sa-border flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-sa-text">Notificaciones</p>
              <p className="text-[11px] text-sa-faint">{data.unread} sin leer</p>
            </div>
            {data.unread > 0 && (
              <button
                type="button"
                onClick={() => void markAll()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {loading && data.items.length === 0 ? (
              <p className="text-sm text-sa-faint text-center py-8">Cargando…</p>
            ) : data.items.length === 0 ? (
              <p className="text-sm text-sa-faint text-center py-8 px-4">No tienes notificaciones.</p>
            ) : (
              data.items.map((n) => {
                const Icon = typeIcon(n.type);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void markOne(n)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-sa-border/80 hover:bg-sa-border/40 transition-colors flex gap-3',
                      !n.read && 'bg-blue-500/5',
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
                      n.type === 'ticket' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      n.type === 'lead' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      n.type === 'expiry' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-sa-border text-sa-muted border-sa-border-strong',
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm truncate', n.read ? 'text-sa-muted' : 'text-sa-text font-semibold')}>{n.title}</p>
                      {n.body && <p className="text-[11px] text-sa-faint line-clamp-2 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-[#475569] mt-1">{n.createdAtHuman}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
