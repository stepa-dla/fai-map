import {parseEventsDocument, sameEvent, editableRoomIds, type EventLabel, type EventsDocument} from './event-labels';

// Public repository coordinates only. Never put a token in this file.
export const EVENT_REPOSITORY = 'stepa-dla/fai-map';
export const EVENT_BRANCH = 'main';
export const EVENT_FILE = 'public/room-events.json';
export const GITHUB_ACTIONS_URL = `https://github.com/${EVENT_REPOSITORY}/actions`;
export const PUBLISHED_EVENTS_URL = 'https://stepa-dla.github.io/fai-map/room-events.json';
const endpoint = `https://api.github.com/repos/${EVENT_REPOSITORY}/contents/${EVENT_FILE}`;
export type EventSource = {sha: string; document: EventsDocument};
export class EventConflictError extends Error {}

function headers(token: string) {
  return {'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${token}`, 'X-GitHub-Api-Version': '2026-03-10'};
}
function errorForStatus(status: number): Error {
  if (status === 401) return new Error('Klíč není platný nebo už vypršel. Připoj se znovu.');
  if (status === 403 || status === 429) return new Error('GitHub požadavek nepovolil. Zkontroluj přístup k fai-map a oprávnění Contents: Read and write, případně zkus uložení později.');
  if (status === 404) return new Error('Soubor popisků na GitHubu chybí nebo k němu nemáš přístup. Nejdřív nahraj aktualizaci editoru do repozitáře.');
  if (status === 409 || status === 422) return new EventConflictError('Soubor se mezitím změnil nebo větev nedovoluje přímé uložení. Načti aktuální popisky a zkontroluj je.');
  return new Error('GitHub teď není dostupný. Popisek se nepodařilo potvrzeně uložit.');
}
async function request(url: string, init: RequestInit) {
  try {return await fetch(url, {...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000)});}
  catch {throw new Error('Spojení s GitHubem se přerušilo. Načti aktuální popisky a ověř, zda se změna uložila.');}
}
export function encodeDocument(document: EventsDocument) {
  const bytes = new TextEncoder().encode(JSON.stringify(parseEventsDocument(document), null, 2) + '\n');
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
}
export async function readEventSource(token: string): Promise<EventSource> {
  const response = await request(`${endpoint}?ref=${encodeURIComponent(EVENT_BRANCH)}`, {headers: headers(token)});
  if (!response.ok) throw errorForStatus(response.status);
  const file = await response.json() as {type?: unknown; encoding?: unknown; size?: unknown; sha?: unknown; content?: unknown} | null;
  if (!file || file.type !== 'file' || file.encoding !== 'base64' || typeof file.size !== 'number' || file.size > 64000 || typeof file.sha !== 'string' || typeof file.content !== 'string') throw new Error('GitHub vrátil neočekávaný soubor popisků.');
  let raw: unknown;
  try {raw = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(atob(file.content.replace(/\s/g, '')), ch => ch.charCodeAt(0))));}
  catch {throw new Error('Soubor popisků není platný text JSON.');}
  return {sha: file.sha, document: parseEventsDocument(raw)};
}
export async function saveRoomEvent(token: string, roomId: string, next: EventLabel | null, expected: EventLabel | undefined): Promise<EventSource> {
  if (!editableRoomIds.has(roomId)) throw new Error('Tuto místnost nelze upravovat.');
  const latest = await readEventSource(token);
  if (!sameEvent(latest.document.events[roomId], expected)) throw new EventConflictError('Tento popisek mezitím někdo upravil. Tvůj text zůstává ve formuláři; načti aktuální verzi před dalším uložením.');
  if (sameEvent(next || undefined, latest.document.events[roomId])) return latest;
  const events = {...latest.document.events};
  if (next) events[roomId] = next; else delete events[roomId];
  const document = parseEventsDocument({version: 1, updatedAt: new Date().toISOString(), events});
  const response = await request(endpoint, {method: 'PUT', headers: {...headers(token), 'Content-Type': 'application/json'}, body: JSON.stringify({message: `Update event label: ${roomId}`, branch: EVENT_BRANCH, sha: latest.sha, content: encodeDocument(document)})});
  if (!response.ok) throw errorForStatus(response.status);
  const result = await response.json() as {content?: {sha?: unknown}} | null;
  if (typeof result?.content?.sha !== 'string') throw new Error('GitHub nepotvrdil novou verzi. Před opakováním načti aktuální popisky.');
  return {sha: result.content.sha, document};
}
