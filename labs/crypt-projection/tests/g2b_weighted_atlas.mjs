import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {weightedAtlasUV,dilateAtlasPixels} from '../src/weighted-atlas.mjs';
import {quadAtlasUV,makeGLB} from '../src/atlas-export.mjs';

// Count the ACTUAL main v4.1 faces; do not accidentally test the older Test02 mesh.
const main=readFileSync(new URL('../../../index.html',import.meta.url),'utf8');
const start=main.indexOf('var vertices=[],normals=[],colors=[], triangles=0;');
const end=main.indexOf('var posBuffer=gl.createBuffer()',start);
assert.ok(start>=0&&end>start,'v4.1 geometry generator found');
const geo=vm.runInNewContext(main.slice(start,end)+';({vertices,triangles})');
assert.equal(geo.triangles,936);
const positions=new Float32Array(geo.vertices);
const boost=(face,center)=>center[0]<-3.8&&center[2]>-5.2&&center[2]<-2.0?3:1;
const weighted=weightedAtlasUV(positions,{size:1024,gutter:2,importance:boost});
const repeat=weightedAtlasUV(positions,{size:1024,gutter:2,importance:boost});
assert.equal(weighted.faceCount,468);
assert.equal(weighted.vertexCount,2808);
assert.deepEqual([...weighted.uv],[...repeat.uv],'stable output');
assert.equal(weighted.uv.length,positions.length/3*2);
for(const c of weighted.cells){
 assert.ok(c.w>=7&&c.h>=7);
 assert.ok(c.x>=0&&c.y>=0&&c.x+c.w<=1024&&c.y+c.h<=1024);
 assert.ok([...weighted.uv.slice(c.face*12,c.face*12+12)].every(v=>v>=0&&v<=1));
}
for(let i=0;i<weighted.cells.length;i++)for(let j=i+1;j<weighted.cells.length;j++){
 const a=weighted.cells[i],b=weighted.cells[j];
 assert.ok(!(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h),`UV overlap ${a.face}/${b.face}`);
}
const oldUseful=1024/Math.ceil(Math.sqrt(weighted.faceCount))*.88;
const biggest=weighted.cells.reduce((acc,c)=>c.metersU*c.metersV>acc.metersU*acc.metersV?c:acc,weighted.cells[0]);
assert.ok(Math.min(biggest.w,biggest.h)-4>oldUseful*3,'large faces get more texels');
assert.throws(()=>weightedAtlasUV(positions,{size:16}));
assert.throws(()=>weightedAtlasUV(positions,{size:1024,gutter:0}));
const pix=new Uint8ClampedArray(64*64*4),cell={x:1,y:1,w:12,h:11};
const innerX=cell.x+2,innerY=cell.y+2,ix=(innerY*64+innerX)*4;
pix.set([12,120,240,255],ix);
for(let y=innerY;y<cell.y+cell.h-2;y++)for(let x=innerX;x<cell.x+cell.w-2;x++)pix.set([12,120,240,255],(y*64+x)*4);
dilateAtlasPixels(pix,64,[cell],2);
const gutterEdge=(cell.y*64+cell.x)*4;
assert.deepEqual([...pix.slice(gutterEdge,gutterEdge+4)],[12,120,240,255]);
const normals=new Float32Array(positions.length);for(let i=1;i<normals.length;i+=3)normals[i]=1;
const uv=quadAtlasUV(positions.length/3).uv;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR4nGOsnTj7PwMDAwMTAxQAACiaAqxZqqe4AAAAAElFTkSuQmCC','base64');
function json(glb){
 const view=new DataView(glb.buffer,glb.byteOffset,glb.byteLength);
 assert.equal(view.getUint32(0,true),0x46546c67);
 assert.equal(view.getUint32(8,true),glb.byteLength);
 const n=view.getUint32(12,true);
 return JSON.parse(new TextDecoder().decode(glb.subarray(20,20+n)).trim());
}
const unlit=json(makeGLB({positions,normals,uv,pngBytes:png}));
const lit=json(makeGLB({positions,normals,uv,pngBytes:png,materialMode:'pbr'}));
assert.ok(unlit.extensionsUsed?.includes('KHR_materials_unlit'));
assert.ok(unlit.materials[0].extensions?.KHR_materials_unlit);
assert.equal(lit.extensionsUsed,undefined);
assert.equal(lit.materials[0].extensions,undefined);
assert.ok(lit.materials[0].pbrMetallicRoughness.baseColorTexture);
assert.throws(()=>makeGLB({positions,normals,uv,pngBytes:png,materialMode:'bad'}));
const preview=readFileSync(new URL('../v41-uv-glb-preview.html',import.meta.url),'utf8');
const script=preview.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new Function(script);
for(const key of ['weightedAtlasUV','dilateAtlasPixels','materialMode','g2GpuSetup(lib,size)','__cryptG2']){
 assert.ok(preview.includes(key),key);
}
console.log(JSON.stringify({status:'PASS',kind:'NODE_SOURCE_UNIT_STATIC',v41Faces:weighted.faceCount,atlasSize:1024,largeCell:[biggest.w,biggest.h],legacyUsefulCell:+oldUseful.toFixed(1),uvOverlaps:0,glbModes:['unlit','pbr'],browserGpu:'NOT_RUN'}));
