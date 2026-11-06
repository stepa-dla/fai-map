'use client';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {activeEvents, emptyEvents, parseEventsDocument, type EventsDocument} from '@/lib/event-labels';
import {PUBLISHED_EVENTS_URL} from '@/lib/github-events';

export function useRoomEvents() {
  const [published, setPublished] = useState(emptyEvents), [preview, setPreview] = useState<EventsDocument | null>(null);
  const [now, setNow] = useState(Date.now), [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let disposed = false, pending = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const source = location.hostname.endsWith('.chatgpt.site') ? PUBLISHED_EVENTS_URL : `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/room-events.json`;
        const url = `${source}?t=${Math.floor(Date.now() / 30000)}`;
        const response = await fetch(url, {cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])});
        if (!response.ok) throw new Error('unavailable');
        const text = await response.text(); if (text.length > 64000) throw new Error('size');
        const data = parseEventsDocument(JSON.parse(text));
        if (!disposed) {setPublished(data); setNow(Date.now()); setUnavailable(false);}
      } catch {if (!disposed) setUnavailable(true);}
      finally {pending = false;}
    };
    void refresh(); const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh); window.addEventListener('online', refresh);
    return () => {disposed = true; controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('online', refresh);};
  }, []);
  const documentForMap = preview || published;
  useEffect(() => {
    const future = Object.values(documentForMap.events).flatMap(e => e.endsAt && Date.parse(e.endsAt) > now ? [Date.parse(e.endsAt)] : []);
    if (!future.length) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(2147483647, Math.max(1, Math.min(...future) - Date.now() + 20)));
    return () => clearTimeout(timer);
  }, [documentForMap, now]);
  const active = useMemo(() => activeEvents(documentForMap, now), [documentForMap, now]);
  const showPreview = useCallback((doc: EventsDocument | null) => {setNow(Date.now()); setPreview(doc);}, []);
  const pendingPublication = !!preview && preview.updatedAt !== published.updatedAt;
  return {active, published, showPreview, preview, pendingPublication, unavailable};
}
