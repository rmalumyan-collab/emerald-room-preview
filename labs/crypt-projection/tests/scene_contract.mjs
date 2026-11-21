import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createProjectionManifest,validateProjectionManifest} from '../src/scene-contract.mjs';

const manifest=createProjectionManifest({
 sceneId:'crypt-room-lab',
 sourceName:'crypt-v2-panel-04.png',sourceWidth:1672,sourceHeight:941,
 camera:{x:-.5,y:1.7,z:7.8,yaw:.2,pitch:0.1,fov:68},
 landmarks:{pillar:{u:.3,v:.5}},rmsPx:4.5,
 triangleCount:936,quadCount:468,atlasSize:1024,
 materialMode:'unlit',coverageRatio:.7
});
assert.equal(validateProjectionManifest(manifest),true);
assert.equal(manifest.sources[0].storage,'local-only');
assert.equal(manifest.geometry.isApprovedGeometry,false);
assert.equal(manifest.acceptance.status,'prototype-unverified');
assert.equal(manifest.bakes[0].coverage.sourceProjectedRatio,.7);
assert.equal(manifest.bakes[0].coverage.fallbackRatio,.3);
const clone=()=>structuredClone(manifest);
{
 const broken=clone();broken.sources[0].storage='github-public';
 assert.throws(()=>validateProjectionManifest(broken));
}
{
 const broken=clone();broken.cameras[0].sourceId='unknown';
 assert.throws(()=>validateProjectionManifest(broken));
}
{
 const broken=clone();broken.bakes[0].materialMode='physically-verified';
 assert.throws(()=>validateProjectionManifest(broken));
}
{
 const broken=clone();broken.acceptance.userApproved=true;
 assert.throws(()=>validateProjectionManifest(broken));
}
{
 const broken=clone();broken.bakes[0].coverage.sourceProjectedRatio=1.5;
 assert.throws(()=>validateProjectionManifest(broken));
}
const viewer=readFileSync(new URL('../v41-uv-glb-preview.html',import.meta.url),'utf8');
assert.ok(viewer.includes("import('./src/scene-contract.mjs')"));
assert.ok(viewer.includes('createProjectionManifest'));
assert.ok(viewer.includes('validateProjectionManifest'));
assert.ok(viewer.includes('crypt_g2_scene_manifest.json'));
new Function(viewer.match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log(JSON.stringify({status:'PASS',schema:1,sources:1,geometry:'draft',acceptance:'unverified',privacy:'local-only',viewerManifestWired:true}));
