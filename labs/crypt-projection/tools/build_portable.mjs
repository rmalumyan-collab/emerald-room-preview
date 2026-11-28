import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const dir=dirname(fileURLToPath(import.meta.url));
const root=join(dir,'..');
const read=p=>readFileSync(join(root,p),'utf8');
const source=read('v41-uv-glb-preview.html');
const modules=['src/atlas-export.mjs','src/weighted-atlas.mjs','src/scene-contract.mjs'];
const inlined=modules.map(p=>read(p).replace(/^export function /gm,'function ')).join('\n\n');
const original=`async function getG2Lib(){
 if(!g2lib)g2lib=Promise.all([import('./src/atlas-export.mjs'),import('./src/weighted-atlas.mjs'),import('./src/scene-contract.mjs')]).then(([a,w,c])=>({...a,...w,...c}));
 return g2lib;
}`;
const replacement=`async function getG2Lib(){
 return {quadAtlasUV,makeGLB,weightedAtlasUV,dilateAtlasPixels,createProjectionManifest,validateProjectionManifest};
}`;
if(!source.includes(original))throw Error('G2b module loader changed; update the portable build');
if(!source.includes('/* G2a: UV atlas and glTF exporter.'))throw Error('G2b source anchor changed');
let portable=source
  .replace(original,replacement)
  .replace('/* G2a: UV atlas and glTF exporter.','/* G2b PORTABLE LIBRARY — inlined from the committed .mjs sources, generated reproducibly. */\n'+inlined+'\n\n/* G2a: UV atlas and glTF exporter.')
  .replace('<title>Crypt Projection G2b · Weighted UV + Materials QA</title>','<title>Crypt Projection G2b · Portable Android Lab</title>')
  .replace('<summary>G2b · Weighted UV + GLB (experimental)</summary>','<summary>G2b · Portable UV + GLB (experimental)</summary>');
const script=portable.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if(!script)throw Error('Inline script missing');
new Function(script);
if(/\bimport\s*\(/.test(script)||/\bfetch\s*\(/.test(script)||/<script[^>]+src=/.test(portable))throw Error('Network/import dependency remains');
const target=join(root,'G2B_PHONE_OFFLINE.html');
if(process.argv.includes('--check')){
 const actual=readFileSync(target,'utf8');
 if(actual!==portable)throw Error('Portable HTML out of sync; regenerate with node labs/crypt-projection/tools/build_portable.mjs');
 console.log(JSON.stringify({status:'PASS',portableBytes:portable.length,externalRequests:0,inlineSyntax:'PASS'}));
}else{
 writeFileSync(target,portable,'utf8');
 console.log(JSON.stringify({status:'WRITTEN',target,portableBytes:portable.length}));
}
