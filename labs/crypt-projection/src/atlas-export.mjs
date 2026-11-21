/** G2 / dependency-free quad UVs and glTF 2.0 GLB exporter.
 * 6 vertices per quad [a,b,c,a,c,d]. UVs are top-left origin in atlas PNG.
 */
export function quadAtlasUV(vertexCount,padding=.06){
 if(!Number.isSafeInteger(vertexCount)||vertexCount<6||vertexCount%6)throw Error('Expected quad triangles (6 vertices per face)');
 if(padding<0||padding>=.45)throw Error('Invalid padding');
 const faceCount=vertexCount/6,grid=Math.ceil(Math.sqrt(faceCount)),uv=new Float32Array(vertexCount*2);
 const corners=[[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]];
 for(let f=0;f<faceCount;f++){
  const x=f%grid,y=Math.floor(f/grid);
  for(let i=0;i<6;i++){
   const dst=(f*6+i)*2;
   uv[dst]=(x+padding+(1-2*padding)*corners[i][0])/grid;
   uv[dst+1]=(y+padding+(1-2*padding)*corners[i][1])/grid;
  }
 }
 return {uv,grid,faceCount,vertexCount};
}
export function makeGLB({positions,normals,uv,pngBytes,name='Crypt Room G2 baked lab',materialMode='unlit'}){
 if(positions.length%3||positions.length<9||normals.length!==positions.length||uv.length!==positions.length/3*2)throw Error('Attribute count mismatch');
 if(materialMode!=='unlit'&&materialMode!=='pbr')throw Error('Unknown materialMode');
 const png=pngBytes instanceof Uint8Array?pngBytes:new Uint8Array(pngBytes);
 if(png.length<8||png[0]!==137||png[1]!==80||png[2]!==78||png[3]!==71)throw Error('PNG required');
 const p=positions instanceof Float32Array?positions:new Float32Array(positions);
 const n=normals instanceof Float32Array?normals:new Float32Array(normals);
 const t=uv instanceof Float32Array?uv:new Float32Array(uv);
 let offset=0;const parts=[],views=[],accessors=[];
 function append(arr,target){
  const b=new Uint8Array(arr.buffer,arr.byteOffset,arr.byteLength);
  const aligned=(offset+3)&~3;if(aligned>offset){parts.push(new Uint8Array(aligned-offset));offset=aligned;}
  const v={buffer:0,byteOffset:offset,byteLength:b.length};if(target)v.target=target;
  const i=views.push(v)-1;parts.push(b);offset+=b.length;return i;
 }
 function attribute(arr,d,type){
  const a={bufferView:append(arr,34962),componentType:5126,count:arr.length/d,type};
  if(type==='VEC3'){
   const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<arr.length;i+=3)for(let j=0;j<3;j++){const z=arr[i+j];if(!Number.isFinite(z))throw Error('Nonfinite geometry');lo[j]=Math.min(lo[j],z);hi[j]=Math.max(hi[j],z);}
   a.min=lo;a.max=hi;
  }
  return accessors.push(a)-1;
 }
 const P=attribute(p,3,'VEC3'),N=attribute(n,3,'VEC3'),T=attribute(t,2,'VEC2');
 const imgView=append(png),binSize=(offset+3)&~3;
 const gltf={asset:{version:'2.0',generator:'Emerald World Builder G2'},scene:0,scenes:[{nodes:[0]}],
  nodes:[{mesh:0,name}],meshes:[{primitives:[{attributes:{POSITION:P,NORMAL:N,TEXCOORD_0:T},mode:4,material:0}]}],
  materials:[{name:materialMode==='pbr'?'Experimental lit material (albedo may contain shadows)':'Reference-match QA (unlit)',doubleSided:true,pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:1},...(materialMode==='unlit'?{extensions:{KHR_materials_unlit:{}}}:{})}],
  ...(materialMode==='unlit'?{extensionsUsed:['KHR_materials_unlit']}:{}),textures:[{source:0,sampler:0}],
  samplers:[{magFilter:9729,minFilter:9729,wrapS:33071,wrapT:33071}],
  images:[{bufferView:imgView,mimeType:'image/png'}],buffers:[{byteLength:binSize}],bufferViews:views,accessors};
 const data=new TextEncoder().encode(JSON.stringify(gltf)),jsonSize=(data.length+3)&~3;
 const result=new Uint8Array(12+8+jsonSize+8+binSize),dv=new DataView(result.buffer);
 dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,result.length,true);
 dv.setUint32(12,jsonSize,true);dv.setUint32(16,0x4e4f534a,true);
 result.fill(32,20,20+jsonSize);result.set(data,20);
 const binAt=20+jsonSize;dv.setUint32(binAt,binSize,true);dv.setUint32(binAt+4,0x004e4942,true);
 let out=binAt+8;for(const part of parts){result.set(part,out);out+=part.length;}
 return result;
}
