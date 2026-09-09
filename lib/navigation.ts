import plan from './fai-source-plan.json';
import sourceGraph from '../public/navigation.json';
export type Room=(typeof plan.rooms)[number];
export type TravelMode='stairs'|'elevator';
export type RoutePart={floor:number;points:number[][];transition:null|{kind:string;name:string;floor:number}};
export type MapRoute={from:Room;to:Room;parts:RoutePart[];transfers:number;mode:TravelMode};
export const rooms=plan.rooms;
export const roomById=new Map(rooms.map(r=>[r.id,r]));
type Node=[number,number,number,number,[number,number][],({id:string;type:string;name:string}|null)];
const nodes=sourceGraph.nodes as Node[];
type Edge={to:number;cost:number;kind:string;name:string};
const adjacency:Edge[][]=nodes.map((n)=>n[4].filter(([to])=>Math.abs(nodes[to][0]-n[0])<=1).map(([to,cost])=>({to,cost,kind:n[0]===nodes[to][0]?'walk':n[5]?.type||'stairs',name:n[5]?.name||'Schodiště'})));
// Short doorway links repair disconnected lift lobbies in the original export.
for(const e of plan.inferredLinks){const cost=Math.hypot(nodes[e.a][1]-nodes[e.b][1],nodes[e.a][2]-nodes[e.b][2])/sourceGraph.unitsPerMeter;adjacency[e.a].push({to:e.b,cost,kind:'walk',name:''});adjacency[e.b].push({to:e.a,cost,kind:'walk',name:''});}
// The source gives separate lift nodes on each floor. Pair the two aligned shafts;
// inferred connections are disclosed in the interface and project documentation.
const lifts=plan.connectors.filter(c=>c.kind==='elevator'&&c.point[0]>750).sort((a,b)=>a.floor-b.floor||a.point[0]-b.point[0]);
for(let floor=0;floor<2;floor++){
 const a=lifts.filter(c=>c.floor===floor),b=lifts.filter(c=>c.floor===floor+1);
 for(let i=0;i<Math.min(a.length,b.length);i++){
  if(Math.hypot(a[i].point[0]-b[i].point[0],a[i].point[1]-b[i].point[1])>30)continue;
  adjacency[a[i].node].push({to:b[i].node,cost:50,kind:'elevator',name:'Výtah'});
  adjacency[b[i].node].push({to:a[i].node,cost:50,kind:'elevator',name:'Výtah'});
 }
}
class MinHeap{
 values:[number,number][]=[];
 push(value:[number,number]){const a=this.values;a.push(value);let i=a.length-1;while(i>0){const p=(i-1)>>1;if(a[p][0]<=value[0])break;a[i]=a[p];i=p;}a[i]=value;}
 pop(){const a=this.values,first=a[0],last=a.pop()!;if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[c][0]>=last[0])break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}
export function findRoute(fromId:string,toId:string,mode:TravelMode):MapRoute {
 const from=roomById.get(fromId),to=roomById.get(toId);
 if(!from||!to)throw new Error('Vyber platný začátek i cíl trasy.');
 if(mode!=='stairs'&&mode!=='elevator')throw new Error('Neplatný způsob přesunu.');
 if(from.id===to.id)return {from,to,parts:[{floor:from.floor,points:[from.door],transition:null}],transfers:0,mode};
 const dist=new Float64Array(nodes.length).fill(Infinity),prev=new Int32Array(nodes.length).fill(-1),targets=new Set(to.nodes),queue=new MinHeap();
 for(const id of from.nodes){dist[id]=0;queue.push([0,id]);}let finish=-1;
 while(queue.values.length){const [cost,u]=queue.pop();if(cost!==dist[u])continue;if(targets.has(u)){finish=u;break;}
  for(const e of adjacency[u]){if(e.kind!=='walk'&&e.kind!==mode)continue;const nextFloor=nodes[e.to][0],currentFloor=nodes[u][0];if(nextFloor<Math.min(from.floor,to.floor)||nextFloor>Math.max(from.floor,to.floor))continue;if(nextFloor!==currentFloor&&Math.sign(nextFloor-currentFloor)!==Math.sign(to.floor-from.floor))continue;const value=cost+e.cost;if(value<dist[e.to]){dist[e.to]=value;prev[e.to]=u;queue.push([value,e.to]);}}
 }
 if(finish<0)throw new Error('Pro tuto dvojici místností se nepodařilo najít trasu. Zkus druhý způsob přesunu.');
 const ids:number[]=[];for(let i=finish;i!==-1;i=prev[i])ids.push(i);ids.reverse();
 const parts:RoutePart[]=[];let current:RoutePart={floor:from.floor,points:[],transition:null};
 ids.forEach((id,i)=>{const n=nodes[id];if(n[0]!==current.floor){const e=adjacency[ids[i-1]].find(e=>e.to===id)!;current.transition={kind:e.kind,name:e.name,floor:n[0]};parts.push(current);current={floor:n[0],points:[],transition:null};}current.points.push([n[1],n[2]]);});parts.push(current);
 return {from,to,parts,transfers:parts.length-1,mode};
}
export function normalise(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
export function matches(room:Room,query:string){return normalise(room.code+' '+room.label+' '+room.name).includes(normalise(query));}
export default plan;
