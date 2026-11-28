import assert from 'node:assert/strict';
import {rad,forward,add,lookAt,perspective,mul} from '../src/math.mjs';
import {LANDMARKS,landmarkErrors,measureCoverage,projectPoint,qaCamera} from '../src/qa.mjs';
const c={x:0,y:1.7,z:4.7,yaw:0,pitch:6,fov:65};
const eye=[c.x,c.y,c.z],vp=mul(perspective(rad(c.fov),16/9),lookAt(eye,add(eye,forward(rad(c.yaw),rad(c.pitch)))));
const mark={};
for(const lm of LANDMARKS){const p=projectPoint(vp,lm.point);assert.ok(p,`Not in frustum: ${lm.id}`);mark[lm.id]={u:p.u,v:p.v};}
const yes=landmarkErrors(vp,mark,1152,648);assert.equal(yes.count,6);assert.ok(yes.rms<1e-6);
const off=landmarkErrors(vp,{...mark,altar:{u:mark.altar.u+.01,v:mark.altar.v}},1152,648);assert.ok(off.rms>1&&off.rms<10);
const empty=landmarkErrors(vp,{},1152,648);assert.equal(empty.rms,null);
assert.deepEqual(measureCoverage(new Uint8Array([82,230,171,255,250,56,153,255,16,26,28,255])),{projected:1,missing:1,total:2,ratio:.5});
for(const delta of [0,15,30]){const v=qaCamera(c,delta);assert.equal(v.yaw,c.yaw+delta);assert.equal(v.y,c.y);}
console.log(JSON.stringify({status:'PASS',landmarks:yes.count,syntheticRmsPx:yes.rms,perturbedRmsPx:off.rms,coverageClassifier:'PASS',views:[0,15,30]}));
