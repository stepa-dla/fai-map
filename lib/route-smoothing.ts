import plan from './fai-source-plan.json';
import barriers from './route-barriers.json';
type Point=number[];
type Shape=Point[][];
const epsilon=1e-7;
const cross=(a:Point,b:Point)=>a[0]*b[1]-a[1]*b[0];
function distance(p:Point,a:Point,b:Point){const dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;const t=len?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
function parse(path:string):Shape{return (path.match(/M[^M]+/g)||[]).map(ring=>{const n=ring.match(/-?\d+(?:\.\d+)?/g)!.map(Number),p:Point[]=[];for(let i=0;i<n.length;i+=2)p.push([n[i],n[i+1]]);return p;});}
const halls=plan.floors.map(f=>f.spaces.filter(s=>s.kind==='hall').map(s=>parse(s.path)));
function inside(p:Point,shape:Shape){let result=false;for(const ring of shape){for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if(distance(p,a,b)<epsilon)return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result;}}return result;}
function intersection(a:Point,b:Point,c:Point,d:Point){const r=[b[0]-a[0],b[1]-a[1]],s=[d[0]-c[0],d[1]-c[1]],den=cross(r,s);if(Math.abs(den)<epsilon)return null;const q=[c[0]-a[0],c[1]-a[1]],t=cross(q,s)/den,u=cross(q,r)/den;return t>=-epsilon&&t<=1+epsilon&&u>=-epsilon&&u<=1+epsilon?{t,u}:null;}
/** A new segment must stay in known hallway polygons, including their holes,
 * and may not cross any wall from the original layout. */
export function isClearRouteSegment(a:Point,b:Point,floor:number){
 const shapes=halls[floor];if(!shapes?.length)return false;
 for(const [c,d] of barriers[floor]){const hit=intersection(a,b,c,d);if(hit&&hit.t>epsilon&&hit.t<1-epsilon)return false;
  const r=[b[0]-a[0],b[1]-a[1]],q=[c[0]-a[0],c[1]-a[1]],wall=[d[0]-c[0],d[1]-c[1]],length=r[0]*r[0]+r[1]*r[1];
  if(length&&Math.abs(cross(r,wall))<epsilon&&Math.abs(cross(q,r))<epsilon){const t1=(q[0]*r[0]+q[1]*r[1])/length,t2=((d[0]-a[0])*r[0]+(d[1]-a[1])*r[1])/length;if(Math.min(1,Math.max(t1,t2))-Math.max(0,Math.min(t1,t2))>epsilon)return false;}
 }
 const cuts=[0,1];for(const shape of shapes)for(const ring of shape)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const hit=intersection(a,b,ring[j],ring[i]);if(hit)cuts.push(Math.max(0,Math.min(1,hit.t)));}
 cuts.sort((a,b)=>a-b);for(let i=1;i<cuts.length;i++){if(cuts[i]-cuts[i-1]<epsilon)continue;const t=(cuts[i]+cuts[i-1])/2,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];if(!shapes.some(s=>inside(p,s)))return false;}
 return true;
}
/** Conservative Douglas–Peucker rendering pass (at most 2 m deviation).
 * It preserves original endpoints and leaves any uncertain shortcut unchanged.
 * Graph search, transfers and route choice remain Dijkstra's original result. */
export function simplifyRoute(points:Point[],floor:number):Point[]{
 if(points.length<3)return points;
 function section(start:number,end:number):Point[]{if(end-start<2)return points.slice(start,end+1);let max=-1,index=start+1;for(let i=start+1;i<end;i++){const d=distance(points[i],points[start],points[end]);if(d>max){max=d;index=i;}}
  if(max<=18&&isClearRouteSegment(points[start],points[end],floor))return [points[start],points[end]];
  if(max<epsilon)index=Math.floor((start+end)/2);
  return [...section(start,index).slice(0,-1),...section(index,end)];
 }
 return section(0,points.length-1);
}
