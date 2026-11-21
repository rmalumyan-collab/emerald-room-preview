/**
 * Shared, versioned proof-of-work manifest for the crypt projection lab.
 * JSON contains provenance and validation status, NEVER the local image bytes.
 * It is not yet a full Emerald Island route/editor schema.
 */
export function createProjectionManifest({
  sceneId='crypt-room-lab',sourceName,sourceWidth,sourceHeight,
  camera,landmarks={},rmsPx=null,geometryCommit='8a1bd7f01b6acb619df3ec68e390fbfa65ec2899',
  triangleCount,quadCount,atlasSize,materialMode,coverageRatio=null
}){
  const name=String(sourceName||'').split(/[\\/]/).pop();
  return {
    schemaVersion:1,sceneId,createdAt:'local-export',
    coordinateSystem:{unit:'metre',up:'+Y',forward:'-Z'},
    geometry:{id:'v4.1-low-poly-lab',sourceCommit:geometryCommit,triangles:triangleCount,quads:quadCount,
      status:'draft',isApprovedGeometry:false},
    sources:[{id:'local-source-01',fileName:name,width:sourceWidth,height:sourceHeight,
      storage:'local-only',kind:'generated-render',rights:'user-confirmation-required',
      sourceAndGeometryCorrespondence:'unverified'}],
    cameras:[{id:'camera-master-01',sourceId:'local-source-01',
      position:[camera.x,camera.y,camera.z],yawRad:camera.yaw,pitchRad:camera.pitch,
      fovDegrees:camera.fov,landmarks,rmsPixels:rmsPx,alignmentVerified:false}],
    bakes:[{id:'bake-01',sourceId:'local-source-01',cameraId:'camera-master-01',
      atlasSize,uvPacking:'area-weighted-v1',gutterPixels:2,
      materialMode,coverage:{sourceProjectedRatio:coverageRatio,fallbackRatio:coverageRatio===null?null:1-coverageRatio},
      gpuVerified:false,glbReimportVerified:false,neutralAlbedoVerified:false}],
    acceptance:{userApproved:false,androidWebGL2Verified:false,finalTextureQualityVerified:false,
      status:'prototype-unverified',disclaimer:'This manifest does not certify real geometry or camera fit'}
  };
}
export function validateProjectionManifest(m){
 const fail=(msg)=>{throw Error('Invalid projection manifest: '+msg);};
 if(!m||m.schemaVersion!==1||!m.sceneId)fail('schemaVersion/sceneId');
 if(m.coordinateSystem?.unit!=='metre'||m.coordinateSystem?.up!=='+Y'||m.coordinateSystem?.forward!=='-Z')fail('coordinateSystem');
 if(m.geometry?.status!=='draft'||m.geometry?.isApprovedGeometry!==false)fail('geometry must remain draft for this lab');
 if(!Number.isSafeInteger(m.geometry.triangles)||m.geometry.triangles<2)fail('triangles');
 if(!Number.isSafeInteger(m.geometry.quads)||m.geometry.quads*2!==m.geometry.triangles)fail('quad count');
 const src=m.sources?.[0],cam=m.cameras?.[0],bake=m.bakes?.[0];
 if(!src||src.storage!=='local-only'||!src.fileName||src.fileName.includes('/')||src.fileName.includes('\\'))fail('local source provenance');
 if(!Number.isInteger(src.width)||src.width<=0||!Number.isInteger(src.height)||src.height<=0)fail('source dimensions');
 if(!cam||cam.sourceId!==src.id||!Array.isArray(cam.position)||cam.position.length!==3)fail('camera');
 if(!cam.position.every(Number.isFinite)||!Number.isFinite(cam.yawRad)||!Number.isFinite(cam.pitchRad)||!Number.isFinite(cam.fovDegrees)||cam.fovDegrees<=0||cam.fovDegrees>=180)fail('camera numeric values');
 if(cam.rmsPixels!==null&&(!Number.isFinite(cam.rmsPixels)||cam.rmsPixels<0))fail('RMS');
 if(!bake||bake.sourceId!==src.id||bake.cameraId!==cam.id)fail('bake references');
 if(![1024,2048,4096].includes(bake.atlasSize))fail('atlas size');
 if(!['unlit','pbr'].includes(bake.materialMode))fail('material mode');
 const ratio=bake.coverage?.sourceProjectedRatio;
 if(ratio!==null&&(!Number.isFinite(ratio)||ratio<0||ratio>1))fail('coverage ratio');
 if(m.acceptance?.userApproved!==false||m.acceptance?.status!=='prototype-unverified')fail('premature approval');
 return true;
}
