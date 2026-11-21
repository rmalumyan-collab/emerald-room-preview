// Port of Test 02 pure QA math; synthetic checks are not real image alignment.
export const LANDMARKS = Object.freeze([
  {id:'altar',label:'Altar · top centre',point:[0,0.95,-5.12]},
  {id:'left_pilaster',label:'Left pilaster · upper inner',point:[-3.535,3.145,-4.5]},
  {id:'right_pilaster',label:'Right pilaster · upper inner',point:[3.535,3.145,-4.5]},
  {id:'left_floor',label:'Far-left floor · corner',point:[-3.9,0,-5.85]},
  {id:'right_floor',label:'Far-right floor · corner',point:[3.9,0,-5.85]},
  {id:'vault_peak',label:'Vault · far crown',point:[0,5.35,-5.8]}
]);
export function projectPoint(matrix,point) {
  const [x,y,z]=point;
  const w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
  if(w<=1e-7)return null;
  const clipX=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12];
  const clipY=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13];
  const clipZ=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14];
  const depth=clipZ/w;
  if(depth < -1 || depth > 1)return null;
  return {u:clipX/w*.5+.5,v:1-(clipY/w*.5+.5),depth};
}
export function landmarkErrors(matrix,marked,width,height){
  const entries=LANDMARKS.flatMap(item=>{
    const expected=marked[item.id];if(!expected)return [];
    const actual=projectPoint(matrix,item.point);
    if(!actual)return [{id:item.id,label:item.label,actual:null,expected,pixelError:null}];
    const px=Math.hypot((actual.u-expected.u)*width,(actual.v-expected.v)*height);
    return [{id:item.id,label:item.label,actual,expected,pixelError:px}];
  });
  const good=entries.filter(x=>Number.isFinite(x.pixelError));
  const rms=good.length?Math.sqrt(good.reduce((a,b)=>a+b.pixelError**2,0)/good.length):null;
  return {count:good.length,total:entries.length,rms,entries};
}
// These exact sentinel colors classify the Test 02 QA framebuffer, not arbitrary images.
export function measureCoverage(rgba){
  let projected=0,missing=0;
  for(let i=0;i<rgba.length;i+=4){
    const r=rgba[i],g=rgba[i+1],b=rgba[i+2];
    if(g>=150&&r<160&&b>=110)projected++;
    else if(r>=165&&g<145&&b>=80)missing++;
  }
  const total=projected+missing;
  return {projected,missing,total,ratio:total?projected/total:null};
}
export function qaCamera(projector,delta){
  const radians=delta*Math.PI/180,lateral=Math.sin(radians)*2.25;
  const yawRad=projector.yaw*Math.PI/180;
  return {x:projector.x+Math.cos(yawRad)*lateral,y:projector.y,z:projector.z+Math.sin(yawRad)*lateral,yaw:projector.yaw+delta,pitch:projector.pitch,fov:projector.fov,lateralMetres:lateral,deltaDegrees:delta};
}
