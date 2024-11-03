import Jolt from "jolt-physics";
import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector3,
  Vector3Like
} from "three";
// @ts-ignore
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import {JoltWorldImpl} from "../ecs/jolt-traits/jolt-world";


export function inferShapeArgsFromBaseGeometry(geometry: BufferGeometry, scale: Vector3Like) {
  // TODO: use scale

  if (!JoltWorldImpl.JOLT_NATIVE) throw new Error("Jolt not initialized yet");
  const Jolt = JoltWorldImpl.JOLT_NATIVE;

  if (geometry instanceof BoxGeometry || geometry instanceof PlaneGeometry) {
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const size = geometry.boundingBox!.getSize(new Vector3());
    const args = [new Jolt.Vec3(scale.x * size.x * .5, scale.y * size.y * .5, scale.z * size.z * .5), 0.05, null];
    return {shape: Jolt.BoxShape, args};
  }

  if (geometry instanceof SphereGeometry) {
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  
    // todo: scaling different dimensions doesn't work well with a regular sphere if we can only specify a radius ...
    const radius = geometry.boundingSphere!.radius * scale.x; 
    const args = [radius, null];
    return {shape: Jolt.SphereShape, args};
  }

  if (geometry instanceof CapsuleGeometry) {
    throw new Error("capsule shape not implemented");
    //return Jolt.CapsuleShape;
  }

  if (geometry instanceof CylinderGeometry) {
    throw new Error("cylinder shape not implemented");
    //return Jolt.CylinderShape;
  }


  throw new Error("unsupported shape - try a convex shape instead.")
}


export function createShapeFromGeometry(geometry: BufferGeometry, scale: Vector3Like): Jolt.Shape {
  // TODO: use scale

  // generate a new geometry to hold the simplified geo
  const simplifiedGeo = geometry.clone();

  const scalingMat = new Matrix4().makeScale(scale.x, scale.y, scale.z);
  simplifiedGeo.applyMatrix4(scalingMat);

  // not sure this is needed.
  //TODO: Check and cleanup if we need normals. if not merge from root geo
  simplifiedGeo.computeVertexNormals();

  // merge points
  const mergedPoints = BufferGeometryUtils.mergeVertices(simplifiedGeo);
  const points = mergedPoints.getAttribute("position").array;

  // create the hull
  const hull = new JoltWorldImpl.JOLT_NATIVE.ConvexHullShapeSettings();
  // add the points
  for (let i = 0; i < points.length; i += 3) {
    const v = new JoltWorldImpl.JOLT_NATIVE.Vec3(points[i], points[i + 1], points[i + 2]);
    hull.mPoints.push_back(v);
    // todo: see if this works the same if they're the destroyed
    //JoltWorldImpl.JOLT_NATIVE.destroy(v);
  }

  const shape = hull.Create().Get();
  return shape;
}


export function inferInitTransformsFromMesh(mesh: Mesh) {
  if (!JoltWorldImpl.JOLT_NATIVE) throw new Error("Jolt not initialized yet");
  const Jolt = JoltWorldImpl.JOLT_NATIVE;

  const worldPos = mesh.getWorldPosition(new Vector3());
  const worldRot = mesh.getWorldQuaternion(new Quaternion());

  const pos = new Jolt.RVec3(worldPos.x, worldPos.y, worldPos.z);
  const rot = new Jolt.Quat(worldRot.x, worldRot.y, worldRot.z, worldRot.w);

  return {pos, rot};
}


/*
export const wrapVec3 = (v) => new Vector3(v.GetX(), v.GetY(), v.GetZ());
export const unwrapVec3 = (v, jolt: typeof Jolt) => new jolt.Vec3(v.x, v.y, v.z);
export const wrapRVec3 = wrapVec3;
export const unwrapRVec3 = (v) => new Raw.module.RVec3(v.x, v.y, v.z);
export const wrapQuat = (q) => new Quaternion(q.GetX(), q.GetY(), q.GetZ(), q.GetW());
export const unwrapQuat = (q, jolt: typeof Jolt) => new jolt.Quat(q.x, q.y, q.z, q.w);
*/