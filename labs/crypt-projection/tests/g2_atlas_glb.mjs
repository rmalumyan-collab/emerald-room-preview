import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {quadAtlasUV,makeGLB} from '../src/atlas-export.mjs';

const example=quadAtlasUV(18);
assert.equal(example.grid,2);
assert.equal(example.faceCount,3);
assert.equal(example.uv.length,36);
assert.ok([...example.uv].every(v=>Number.isFinite(v)&&v>=0&&v<=1));

const positions=new Float32Array([
  0,0,0, 1,0,0, 1,1,0,
  0,0,0, 1,1,0, 0,1,0
]);
const normals=new Float32Array(positions.length);
for(let i=2;i<normals.length;i+=3)normals[i]=1;
const uv=quadAtlasUV(positions.length/3).uv;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR4nGOsnTj7PwMDAwMTAxQAACiaAqxZqqe4AAAAAElFTkSuQmCC','base64');
const glb=makeGLB({positions,normals,uv,pngBytes:png,name:'test quad'});
const dv=new DataView(glb.buffer,glb.byteOffset,glb.byteLength);
assert.equal(dv.getUint32(0,true),0x46546c67);
assert.equal(dv.getUint32(4,true),2);
assert.equal(dv.getUint32(8,true),glb.byteLength);
const jsonLen=dv.getUint32(12,true);
const info=JSON.parse(new TextDecoder().decode(glb.subarray(20,20+jsonLen)).trim());
assert.equal(info.asset.version,'2.0');
assert.equal(info.meshes[0].primitives[0].mode,4);
assert.equal(info.accessors[0].count,6);
assert.equal(info.accessors[2].count,6);
assert.equal(info.images[0].mimeType,'image/png');
assert.ok(info.extensionsUsed.includes('KHR_materials_unlit'));
const bi=info.bufferViews[info.images[0].bufferView];
const binaryStart=20+jsonLen+8;
assert.deepEqual(glb.subarray(binaryStart+bi.byteOffset,binaryStart+bi.byteOffset+bi.byteLength),new Uint8Array(png));
const texcoordView=info.bufferViews[info.accessors[2].bufferView];
const extracted=new DataView(glb.buffer,glb.byteOffset+binaryStart+texcoordView.byteOffset,texcoordView.byteLength);
assert.ok(Math.abs(extracted.getFloat32(0,true)-uv[0])<1e-6);
assert.throws(()=>quadAtlasUV(7));
assert.throws(()=>makeGLB({positions,normals,uv:new Float32Array(4),pngBytes:png}));
const html=readFileSync(new URL('../v41-uv-glb-preview.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new Function(script);
for(const token of ['__cryptG2','g2Pass','g2Bake','downloadAtlas','downloadMask','makeGLB','pixelsToCanvas','rebuildProjectorDepth']){
 assert.ok(html.includes(token),token);
}
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(script),'Preview must not upload reference images');
console.log(JSON.stringify({status:'PASS',kind:'NODE_UNIT_AND_STATIC',faces:example.faceCount,glbBytes:glb.byteLength,inlineJS:'PASS',gpuRuntime:'NOT_TESTED'}));
