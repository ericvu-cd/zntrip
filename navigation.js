'use strict';
// These nodes follow the centre lines of the illustrated roads, not real-world walking directions.
const TownNavigation=(()=>{
  const nodes=[[850,440],[490,735],[290,250],[870,560],[470,330],[730,600]];
  const edges=[[3,0],[0,4],[4,2],[3,5],[5,1],[4,1]];
  const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  function projection(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return [a[0]+t*dx,a[1]+t*dy]}
  function plan(start,destination){if(!Number.isInteger(destination)||destination<0||destination>3)throw new Error('Unknown destination');if(length(start,nodes[destination])<.001)return [];const nearest=edges.map(([a,b])=>({a,b,p:projection(start,nodes[a],nodes[b])})).map(e=>({...e,d:length(start,e.p)})).sort((a,b)=>a.d-b.d)[0];const points=nodes.map(p=>p.slice());const source=points.push(nearest.p)-1;const links=edges.concat([[source,nearest.a],[source,nearest.b]]);const dist=points.map(()=>Infinity),prev=points.map(()=>-1),visited=new Set();dist[source]=0;while(visited.size<points.length){let u=-1;for(let i=0;i<points.length;i++)if(!visited.has(i)&&(u<0||dist[i]<dist[u]))u=i;if(u<0||!Number.isFinite(dist[u]))break;if(u===destination)break;visited.add(u);for(const [a,b]of links){const v=a===u?b:b===u?a:-1;if(v<0)continue;const next=dist[u]+length(points[u],points[v]);if(next<dist[v]){dist[v]=next;prev[v]=u}}}if(!Number.isFinite(dist[destination]))throw new Error('No road route');const result=[];for(let u=destination;u!==source;u=prev[u]){if(u<0)throw new Error('Broken route');result.push(points[u].slice())}result.reverse();if(nearest.d>.01)result.unshift(nearest.p.slice());return result.filter((p,i)=>length(p,i?result[i-1]:start)>.001)}
  return {nodes,edges,plan,length,projection};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=TownNavigation;
