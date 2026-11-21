// Dependency-free STATIC checks for the integrated G1 experiment (not a GPU test).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../v41-camera-preview.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'inline viewer script exists');
new Function(script);
for(const marker of [
 'window.__cryptG1', 'rebuildProjectorDepth', 'gl.DEPTH_COMPONENT24',
 'gl.readPixels','captureQA','masterUpload','projOverlay',
 'vWorld.x<-3.8', 'depth<=texture(shadowDepth,uv).r+.005',
 'if(projectionMode==2)outColor=vec4(!target?normalColor:'
]) assert.ok(html.includes(marker),marker);
assert.ok(html.includes('preserveDrawingBuffer:true'));
assert.ok(!/fetch\s*\(|XMLHttpRequest|WebSocket/.test(script),'no external network requests in viewer JS');
console.log(JSON.stringify({status:'PASS',kind:'STATIC_ONLY',checks:10,liveGPU:false,mainUntouched:true}));
