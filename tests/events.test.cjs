const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
function modules(fetch = () => {throw Error('Unexpected network request');}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    const exports = {}, context = {exports, fetch, TextEncoder, TextDecoder, atob, btoa, AbortSignal, Date,
      require: name => load(path.resolve(path.dirname(file), name.endsWith('.json') ? name : name + '.ts'))};
    cache.set(file, exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText, context);
    return exports;
  }
  return {data: load(path.join(root, 'lib/event-labels.ts')), api: load(path.join(root, 'lib/github-events.ts'))};
}
const document = (events = {}) => ({version: 1, updatedAt: null, events});
const event = title => ({title, endsAt: null});
const fileResponse = doc => new Response(JSON.stringify({type: 'file', encoding: 'base64', size: JSON.stringify(doc).length, sha: 'old-sha', content: Buffer.from(JSON.stringify(doc)).toString('base64')}), {status: 200});

test('Czech labels survive UTF-8/base64 round trip', () => {
  const {data, api} = modules(); const doc = document({'u53-107': event('Přednáška: počítačové sítě')});
  assert.deepEqual(JSON.parse(Buffer.from(api.encodeDocument(doc), 'base64').toString('utf8')), doc);
  assert.equal(data.parseEventsDocument(doc).events['u53-107'].title, 'Přednáška: počítačové sítě');
});
test('unknown rooms, oversized titles, bad dates and incompatible schemas are rejected', () => {
  const {data} = modules();
  for (const value of [null, [], {...document(),version: 2}, document({'not-a-room': event('Test')}), document({'u53-107': event('x'.repeat(49))}), document({'u53-107': {title: 'Test',endsAt:'yesterday'}}), document({'u53-107': event('   ')})]) assert.throws(() => data.parseEventsDocument(value));
});
test('expiry removes event at the exact boundary; permanent labels remain', () => {
  const {data} = modules(); const doc = document({'u53-107': {title:'Dnes', endsAt:'2026-11-06T12:00:00Z'}, 'u54-212': event('Stále')});
  assert.equal(Object.keys(data.activeEvents(doc,Date.parse('2026-11-06T11:59:59Z'))).length,2);
  assert.deepEqual(Object.keys(data.activeEvents(doc,Date.parse('2026-11-06T12:00:00Z'))),['u54-212']);
});
test('saving merges other rooms and writes only the designated JSON file', async () => {
  const calls=[]; const latest=document({'u54-212':event('Jiná akce')});
  const {api}=modules(async (url,init)=>{calls.push([url,init]);return init.method==='PUT'?new Response(JSON.stringify({content:{sha:'new-sha'}})):fileResponse(latest);});
  const result=await api.saveRoomEvent('TEST_ONLY','u53-107',event('Robotika'),undefined);
  assert.equal(calls.length,2); assert.equal(result.document.events['u54-212'].title,'Jiná akce');
  const [url,init]=calls[1]; assert.equal(url,'https://api.github.com/repos/stepa-dla/fai-map/contents/public/room-events.json');
  const body=JSON.parse(init.body); assert.equal(body.sha,'old-sha'); assert.equal(body.branch,'main');
  assert.equal(init.headers.Authorization,'Bearer TEST_ONLY'); assert(!init.body.includes('TEST_ONLY')); assert(!url.includes('TEST_ONLY'));
});
test('same-room conflict makes no write and keeps the newer event', async () => {
  let requests=0;const {api}=modules(async()=>{requests++;return fileResponse(document({'u53-107':event('Novější text')}));});
  await assert.rejects(api.saveRoomEvent('TEST','u53-107',event('Moje úprava'),event('Starší text')),e=>e instanceof api.EventConflictError);
  assert.equal(requests,1);
});
test('a concurrent write after the read returns a conflict rather than overwriting', async () => {
  const {api}=modules(async(url,init)=>init.method==='PUT'?new Response('{}',{status:409}):fileResponse(document()));
  await assert.rejects(api.saveRoomEvent('TEST','u53-107',event('Test'),undefined),e=>e instanceof api.EventConflictError);
});
test('removing an event preserves every other room', async () => {
  const latest=document({'u53-107':event('Konec'),'u54-212':event('Pokračuje')});
  const {api}=modules(async(url,init)=>init.method==='PUT'?new Response(JSON.stringify({content:{sha:'removed'}})):fileResponse(latest));
  const result=await api.saveRoomEvent('TEST','u53-107',null,event('Konec'));
  assert(!('u53-107' in result.document.events));assert.equal(result.document.events['u54-212'].title,'Pokračuje');
});
test('unchanged event does not create an unnecessary commit', async () => {
  let requests=0;const {api}=modules(async()=>{requests++;return fileResponse(document({'u53-107':event('Stejné')}));});
  await api.saveRoomEvent('TEST','u53-107',event('Stejné'),event('Stejné'));assert.equal(requests,1);
});
test('failed authentication or permissions do not leak tokens into errors', async () => {
  for(const status of [401,403,404,429,500]){const {api}=modules(async()=>new Response('{}',{status}));await assert.rejects(api.readEventSource('PRIVATE_TEST_TOKEN'),e=>e.message.length>10&&!e.message.includes('PRIVATE_TEST_TOKEN'));}
});
test('malformed or oversized remote files are refused', async () => {
  for(const payload of [null,{type:'dir'},{type:'file',encoding:'base64',size:70000,sha:'x',content:'e30='},{type:'file',encoding:'base64',size:2,sha:'x',content:'not base64!'}]){const {api}=modules(async()=>new Response(JSON.stringify(payload)));await assert.rejects(api.readEventSource('TEST'));}
});
test('network uncertainty is reported without claiming a successful save', async () => {
  const {api}=modules(async()=>{throw Error('TEST_TOKEN or internal network info');});
  await assert.rejects(api.readEventSource('TEST_TOKEN'),e=>e.message.includes('ověř')&&!e.message.includes('TEST_TOKEN'));
});
