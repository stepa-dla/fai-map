import plan from './fai-source-plan.json';

export type EventLabel = {title: string; endsAt: string | null};
export type EventsDocument = {version: 1; updatedAt: string | null; events: Record<string, EventLabel>};
export const editableRooms = plan.rooms.filter(r => r.kind !== 'unknown' && !!r.code);
export const editableRoomIds = new Set(editableRooms.map(r => r.id));
export const emptyEvents = (): EventsDocument => ({version: 1, updatedAt: null, events: {}});
export const MAX_EVENT_TITLE = 48;
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v));

export function parseEventsDocument(value: unknown): EventsDocument {
  if (!value || typeof value !== 'object') throw new Error('Soubor popisků má neplatný formát.');
  const data = value as Partial<EventsDocument>;
  if (data.version !== 1 || !data.events || typeof data.events !== 'object' || Array.isArray(data.events) || (data.updatedAt !== null && !isDate(data.updatedAt))) throw new Error('Soubor popisků má neplatný formát.');
  const events: Record<string, EventLabel> = {};
  for (const [id, event] of Object.entries(data.events)) {
    if (!editableRoomIds.has(id) || !event || typeof event.title !== 'string' || !event.title.trim() || event.title.length > MAX_EVENT_TITLE || (event.endsAt !== null && !isDate(event.endsAt))) throw new Error('Soubor obsahuje neplatnou místnost nebo popisek.');
    events[id] = {title: event.title.trim(), endsAt: event.endsAt};
  }
  return {version: 1, updatedAt: data.updatedAt!, events};
}

export function activeEvents(doc: EventsDocument, now = Date.now()) {
  return Object.fromEntries(Object.entries(doc.events).filter(([, event]) => !event.endsAt || Date.parse(event.endsAt) > now));
}
export function sameEvent(a?: EventLabel, b?: EventLabel) {
  return a?.title === b?.title && a?.endsAt === b?.endsAt;
}
export function shortEventLines(title: string, width: number) {
  const words = title.split(/\s+/), lines: string[] = []; let line = '';
  for (const word of words) {
    if ((line ? line.length + 1 : 0) + word.length > width && line) {lines.push(line); line = '';}
    line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  return lines.slice(0, 2).map((value, i) => value.length > width || (i === 1 && lines.length > 2) ? value.slice(0, width - 1).trimEnd() + '…' : value);
}
export function toLocalDateTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso), pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
