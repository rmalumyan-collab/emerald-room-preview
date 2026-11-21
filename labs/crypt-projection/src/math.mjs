// Port of the tested Crypt Room Projection Test 02 camera math.
// Coordinate convention: metres, Y up, forward along -Z. Column-major matrices.
export const rad=d=>d*Math.PI/180;
export function perspective(fov,aspect,near=.05,far=100){
 const f=1/Math.tan(fov/2),p=new Float32Array(16);
 p[0]=f/aspect;p[5]=f;p[10]=(far+near)/(near-far);p[11]=-1;p[14]=2*far*near/(near-far);return p;
}
export function lookAt(eye,target,up=[0,1,0]){
 const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x);
 return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((s,a,i)=>s+a*eye[i],0),-y.reduce((s,a,i)=>s+a*eye[i],0),-z.reduce((s,a,i)=>s+a*eye[i],0),1]);
}
export function mul(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){for(let k=0;k<4;k++)o[r+4*c]+=a[r+4*k]*b[k+4*c];}return o;}
export function forward(yaw,pitch){return [Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];}
export function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
