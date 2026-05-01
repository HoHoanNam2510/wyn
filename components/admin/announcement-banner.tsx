'use client';

import { useSyncExternalStore } from 'react';
import { X } from 'lucide-react';

type Announcement = { id: string; title: string; content: string };

const STORAGE_KEY = 'wyn_dismissed_announcements';

// Module-level store — client only (this file is 'use client')
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined = undefined;
let cachedIds: string[] = [];

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedIds = raw ? (JSON.parse(raw) as string[]) : [];
    }
    return cachedIds;
  } catch {
    return cachedIds;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Server always returns [] — matches initial client hydration, no mismatch
function getServerSnapshot(): string[] {
  return [];
}

function saveDismissed(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
  cachedRaw = undefined; // invalidate cache
  listeners.forEach((cb) => cb());
}

export function AnnouncementBanner({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const dismissedIds = useSyncExternalStore(
    subscribe,
    readFromStorage,
    getServerSnapshot
  );

  const visible = announcements.filter((a) => !dismissedIds.includes(a.id));

  function dismiss(id: string) {
    const current = readFromStorage();
    if (!current.includes(id)) {
      saveDismissed([...current, id]);
    }
  }

  const current = visible[0];
  if (!current) return null;

  return (
    <div className="flex items-start gap-3 bg-primary text-primary-foreground px-6 py-3">
      <div className="flex-1">
        <p className="text-base font-bold leading-tight">{current.title}</p>
        <p className="text-sm mt-0.5 opacity-90">{current.content}</p>
      </div>
      <button
        onClick={() => dismiss(current.id)}
        className="shrink-0 rounded p-0.5 mt-0.5 hover:bg-white/20 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
