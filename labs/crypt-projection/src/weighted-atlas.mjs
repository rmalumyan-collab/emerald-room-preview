/**
 * World-area weighted quad UV atlas (deterministic, dependency-free).
 * Each original quad is 6 independent vertices [A,B,C,A,C,D], Y-up metres.
 * UVs use PNG top-left origin; 90-degree rotation preserves per-quad orientation.
 * Importantly this is a texture-density improvement, NOT material restoration.
 */
export function weightedAtlasUV(positions,{size=1024,gutter=2,minInterior=3,importance}={}){
  if(!positions||positions.length<18||positions.length%18!==0)throw Error('Expected 6 vertices per quad');
  if(!Number.isInteger(size)||size<64||size>8192)throw Error('Invalid atlas size');
  if(!Number.isInteger(gutter)||gutter<1||gutter>16)throw Error('Invalid gutter');
  if(!Number.isInteger(minInterior)||minInterior<2||minInterior>32)throw Error('Invalid minimum interior');
  const faceCount=positions.length/18,tiles=[];
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  for(let f=0;f<faceCount;f++){
    const v=i=>Array.from(positions.slice(f*18+i*3,f*18+i*3+3));
    const a=v(0),b=v(1),c=v(2),d=v(5);
    if([a,b,c,d].some(p=>p.some(q=>!Number.isFinite(q))))throw Error('Nonfinite geometry');
    const center=[0,1,2].map(k=>(a[k]+b[k]+c[k]+d[k])/4);
    const metersU=Math.max(.005,dist(a,b));
    const metersV=Math.max(.005,dist(a,d));
    const factor=importance?importance(f,center,metersU,metersV):1;
    if(!Number.isFinite(factor)||factor<=0)throw Error('Importance must be finite and positive');
    const boost=Math.sqrt(Math.min(6,Math.max(.25,factor)));
    const rotated=metersV>metersU;
    tiles.push({face:f,metersU,metersV,center,importance:factor,rotated,
      major:Math.max(metersU,metersV)*boost,minor:Math.min(metersU,metersV)*boost});
  }
  function tryFit(density){
    const min=gutter*2+minInterior,raw=tiles.map(t=>({...t,
      w:Math.max(min,Math.ceil(t.major*density)+gutter*2),
      h:Math.max(min,Math.ceil(t.minor*density)+gutter*2)}));
    raw.sort((a,b)=>b.h-a.h||b.w-a.w||a.face-b.face);
    let x=0,y=0,rowH=0;
    for(const q of raw){
      if(q.w>size||q.h>size)return null;
      if(x+q.w>size){y+=rowH;x=0;rowH=0;}
      if(y+q.h>size)return null;
      q.x=x;q.y=y;x+=q.w;rowH=Math.max(rowH,q.h);
    }
    return raw.sort((a,b)=>a.face-b.face);
  }
  if(!tryFit(0))throw Error('Atlas cannot fit even at minimum tile size');
  let low=0,high=size;
  for(let i=0;i<30;i++){
    const mid=(low+high)/2;
    if(tryFit(mid))low=mid;else high=mid;
  }
  const cells=tryFit(low),uv=new Float32Array(faceCount*12);
  const u0=[0,1,1,0,1,0],v0=[0,0,1,0,1,1];
  for(const c of cells){
    for(let i=0;i<6;i++){
      const uu=c.rotated?v0[i]:u0[i],vv=c.rotated?1-u0[i]:v0[i];
      const k=(c.face*6+i)*2;
      uv[k]=(c.x+gutter+uu*(c.w-2*gutter))/size;
      uv[k+1]=(c.y+gutter+vv*(c.h-2*gutter))/size;
    }
  }
  return {uv,cells,faceCount,vertexCount:faceCount*6,size,gutter,density:low,
    meanCellWidth:cells.reduce((s,c)=>s+c.w,0)/faceCount,
    innerArea:cells.reduce((s,c)=>s+(c.w-2*gutter)*(c.h-2*gutter),0)};
}
/**
 * Dilate each cell's interior texels outward to its gutter; prevents black
 * interpolation/seams when GLB sampling touches tile boundaries.
 * Works on Uint8ClampedArray or Uint8Array, with origin top-left.
 * Pads all four RGBA channels; respects each cell's true rectangle.
 */
export function dilateAtlasPixels(pixels,size,cells,gutter){
 if(pixels.length!==size*size*4)throw Error('Invalid RGBA atlas length');
 if(!Number.isInteger(gutter)||gutter<1)throw Error('Invalid gutter');
 for(const c of cells){
   const L=c.x+gutter,R=c.x+c.w-gutter-1,T=c.y+gutter,B=c.y+c.h-gutter-1;
   if(L>R||T>B||c.x<0||c.y<0||c.x+c.w>size||c.y+c.h>size)throw Error('Invalid tile bounds');
   // In-place copy is safe as source is always an unchanged interior pixel.
   for(let y=c.y;y<c.y+c.h;y++){
     const sy=Math.max(T,Math.min(B,y));
     for(let x=c.x;x<c.x+c.w;x++){
       if(x>=L&&x<=R&&y>=T&&y<=B)continue;
       const sx=Math.max(L,Math.min(R,x)),dst=(y*size+x)*4,src=(sy*size+sx)*4;
       pixels[dst]=pixels[src];pixels[dst+1]=pixels[src+1];
       pixels[dst+2]=pixels[src+2];pixels[dst+3]=pixels[src+3];
     }
   }
 }
 return pixels;
}
