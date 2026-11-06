'use client';
import {useEffect, useRef, useState} from 'react';
import {CalendarDays, Check, ExternalLink, KeyRound, LogOut, MapPin, Pencil, RotateCcw, Save, X} from 'lucide-react';
import {Dialog, DialogContent, DialogTitle} from '@/components/ui/dialog';
import {editableRooms, MAX_EVENT_TITLE, toLocalDateTime, type EventsDocument, type EventLabel} from '@/lib/event-labels';
import {EVENT_REPOSITORY, GITHUB_ACTIONS_URL, readEventSource, saveRoomEvent, EventConflictError, type EventSource} from '@/lib/github-events';

const sortedRooms = [...editableRooms].sort((a, b) => a.floor - b.floor || a.label.localeCompare(b.label, 'cs', {numeric: true}));
const defaultRoom = sortedRooms[0].id;
type Props = {
  open: boolean; onOpenChange: (open: boolean) => void;
  roomId: string; onRoomChange: (id: string) => void;
  onPickMap: () => void; onSaved: (document: EventsDocument) => void;
  onDisconnect: () => void; publishedAt: string | null;
};

export function EventEditor(props: Props) {
  const token = useRef('');
  const [keyInput, setKeyInput] = useState(''), [source, setSource] = useState<EventSource | null>(null);
  const [title, setTitle] = useState(''), [endsAt, setEndsAt] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [conflict, setConflict] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null), [removing, setRemoving] = useState(false);
  const expected = useRef<EventLabel | undefined>(undefined);
  const drafts = useRef(new Map<string, {title: string; endsAt: string; expected: EventLabel | undefined}>());
  const roomId = sortedRooms.some(r => r.id === props.roomId) ? props.roomId : defaultRoom;
  const room = sortedRooms.find(r => r.id === roomId)!;
  const loadForm = (id: string, doc: EventsDocument) => {
    const event = doc.events[id]; expected.current = event;
    setTitle(event?.title || ''); setEndsAt(toLocalDateTime(event?.endsAt || null));
    setError(''); setConflict(false); setRemoving(false);
  };
  // Switching rooms preserves unfinished text. Reopening the dialog does too.
  useEffect(() => {
    if (!source) return;
    const draft = drafts.current.get(roomId);
    if (draft) {setTitle(draft.title); setEndsAt(draft.endsAt); expected.current = draft.expected; setError(''); setConflict(false); setRemoving(false);}
    else loadForm(roomId, source.document);
  }, [roomId, !!source]); // Source changes after saving are handled explicitly.
  useEffect(() => () => {token.current = '';}, []);
  const remember = (nextTitle: string, nextEnd: string) => {
    setTitle(nextTitle); setEndsAt(nextEnd); setRemoving(false);
    drafts.current.set(roomId, {title: nextTitle, endsAt: nextEnd, expected: expected.current});
  };
  async function connect(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const candidate = keyInput.trim(); setKeyInput('');
    try {const next = await readEventSource(candidate); token.current = candidate; setSource(next); loadForm(roomId, next.document);}
    catch (e) {setError(e instanceof Error ? e.message : 'Připojení se nezdařilo.');}
    finally {setBusy(false);}
  }
  async function reload() {
    setBusy(true); setError('');
    try {const next = await readEventSource(token.current); setSource(next); expected.current = next.document.events[roomId]; setConflict(false); drafts.current.set(roomId, {title, endsAt, expected: expected.current});}
    catch (e) {setError(e instanceof Error ? e.message : 'Načtení se nezdařilo.');}
    finally {setBusy(false);}
  }
  async function save(remove = false) {
    setError(''); setConflict(false);
    const trimmed = title.trim();
    if (!remove && (!trimmed || trimmed.length > MAX_EVENT_TITLE)) {setError('Napiš název akce, nejvýše 48 znaků.'); return;}
    const end = endsAt ? new Date(endsAt) : null;
    if (!remove && end && (!Number.isFinite(end.getTime()) || end.getTime() <= Date.now())) {setError('Konec platnosti musí být v budoucnosti.'); return;}
    setBusy(true);
    try {
      const next = await saveRoomEvent(token.current, roomId, remove ? null : {title: trimmed, endsAt: end?.toISOString() || null}, expected.current);
      setSource(next); drafts.current.delete(roomId); loadForm(roomId, next.document); setSavedAt(next.document.updatedAt); props.onSaved(next.document);
    } catch (e) {setError(e instanceof Error ? e.message : 'Uložení se nezdařilo.'); setConflict(e instanceof EventConflictError);}
    finally {setBusy(false);}
  }
  function disconnect() {
    token.current = ''; setKeyInput(''); setSource(null); setError(''); setConflict(false); setSavedAt(null);
    drafts.current.clear(); props.onDisconnect();
  }
  const current = source?.document.events[roomId];
  const published = !!savedAt && savedAt === props.publishedAt;
  const changed = title.trim() !== (expected.current?.title || '') || endsAt !== toLocalDateTime(expected.current?.endsAt || null);
  return <Dialog open={props.open} onOpenChange={value => {if (!busy) props.onOpenChange(value);}}>
    <DialogContent className="event-editor" showCloseButton={false} aria-describedby="event-editor-description">
      <div className="editor-heading"><span className="editor-icon"><Pencil size={22}/></span><div><span className="eyebrow">FAI · SPRÁVA MAPY</span><DialogTitle>Popisky akcí</DialogTitle></div><button className="plain-button" aria-label="Zavřít editor" disabled={busy} onClick={() => props.onOpenChange(false)}><X size={21}/></button></div>
      <p id="event-editor-description" className="editor-intro">Krátký název akce u místnosti. Číslo učebny i navigace zůstávají.</p>
      {!source ? <form onSubmit={connect} className="editor-form">
        <div className="editor-login-note"><KeyRound size={20}/><div><strong>Připojení k tvému GitHubu</strong><p>Popisky se ukládají do {EVENT_REPOSITORY}. Žádná další služba ani účet.</p></div></div>
        <label htmlFor="editor-token">Přístupový klíč GitHubu</label>
        <input id="editor-token" type="password" autoComplete="off" spellCheck={false} value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="github_pat_…" required disabled={busy}/>
        <p className="editor-help">Klíč zůstává pouze v paměti této otevřené stránky. Po odpojení nebo obnovení ho zadáš znovu.</p>
        <details className="editor-key-help"><summary>Kde klíč získám?</summary><ol><li>Otevři <a href="https://github.com/settings/personal-access-tokens/new?name=FAI%20mapa&target_name=stepa-dla&contents=write" target="_blank" rel="noreferrer">vytvoření klíče na GitHubu ↗</a>.</li><li>Vyber <b>Only select repositories → fai-map</b>.</li><li>Nastav <b>Contents → Read and write</b> a datum vypršení.</li><li>Vygenerovaný klíč vlož sem. Nesdílej ho s návštěvníky.</li></ol></details>
        <button className="primary-button" disabled={busy || !keyInput.trim()}><KeyRound size={17}/>{busy ? 'Připojuji…' : 'Připojit editor'}</button>
      </form> : <>
        <div className="editor-connected"><span><i/> GitHub připojen</span><button disabled={busy} onClick={disconnect}><LogOut size={15}/> Odpojit</button></div>
        <form className="editor-form" onSubmit={e => {e.preventDefault(); void save();}}>
          <div className="editor-field-heading"><label htmlFor="event-room">Místnost</label><button type="button" className="editor-text-button" disabled={busy} onClick={props.onPickMap}><MapPin size={14}/> Vybrat v mapě</button></div>
          <select id="event-room" value={roomId} disabled={busy} onChange={e => props.onRoomChange(e.target.value)}>{[0, 1, 2].map(floor => <optgroup key={floor} label={`${floor + 1}. NP · ${['Přízemí', '1. patro', '2. patro'][floor]}`}>{sortedRooms.filter(r => r.floor === floor).map(r => <option key={r.id} value={r.id}>{r.label}{source.document.events[r.id] ? ' · má popisek' : ''}</option>)}</optgroup>)}</select>
          <div className="editor-field-heading"><label htmlFor="event-title">Název akce</label><span>{title.length}/{MAX_EVENT_TITLE}</span></div>
          <input id="event-title" value={title} onChange={e => remember(e.target.value, endsAt)} maxLength={MAX_EVENT_TITLE} placeholder="Např. Den otevřených dveří" disabled={busy}/>
          <label htmlFor="event-end">Platnost do <span className="editor-optional">· nepovinné</span></label>
          <input id="event-end" type="datetime-local" value={endsAt} onChange={e => remember(title, e.target.value)} disabled={busy}/>
          <p className="editor-help">Čas podle tohoto zařízení. Bez data zůstane popisek do ručního odstranění.</p>
          <div className="event-preview"><span className="eyebrow">NÁHLED POPISKU</span><strong>{room.label}</strong><span>{title.trim() || 'Název akce'}</span></div>
          {conflict && <div className="editor-conflict"><p>Novou verzi načteš bez ztráty rozepsaného textu. Potom ji porovnej a rozhodni o uložení.</p><button type="button" className="secondary-button" disabled={busy} onClick={reload}>Načíst aktuální verzi</button></div>}
          {current && changed && <p className="editor-current">Nyní v GitHubu: <strong>{current.title}</strong>{current.endsAt ? ` · do ${new Date(current.endsAt).toLocaleString('cs-CZ')}` : ''}</p>}
          <button className="primary-button editor-save" disabled={busy || conflict || !title.trim() || !changed}><Save size={18}/>{busy ? 'Ukládám…' : 'Uložit a zveřejnit'}</button>
          {current && <div className="editor-remove">{removing ? <><span>Odstranit popisek této místnosti?</span><button type="button" disabled={busy} onClick={() => save(true)}>Ano, odstranit</button><button type="button" disabled={busy} onClick={() => setRemoving(false)}>Zrušit</button></> : <button type="button" disabled={busy || conflict} onClick={() => setRemoving(true)}><RotateCcw size={15}/> Vrátit původní popisek</button>}</div>}
        </form>
        <div className="editor-publication" role="status">{savedAt ? <><Check size={18}/><div><strong>{published ? 'Zveřejněno na tomto webu' : 'Uloženo v GitHubu'}</strong><p>{published ? 'Návštěvníci už vidí aktuální popisky.' : 'Čeká na nasazení GitHub Pages. Zveřejnění může trvat několik minut.'}</p></div></> : <><CalendarDays size={18}/><p>Uložení spustí aktualizaci mapy. Otevřené mapy kontrolují nové popisky každých 30 sekund.</p></>}</div>
        <a className="editor-build-link" href={GITHUB_ACTIONS_URL} target="_blank" rel="noreferrer">Stav zveřejnění na GitHubu <ExternalLink size={14}/></a>
      </>}
      {error && <p className="editor-error" role="alert">{error}</p>}
    </DialogContent>
  </Dialog>;
}
