import {trait} from "koota";
import Jolt from "jolt-physics";
import { Vector3Like, Vector3Tuple } from "three";

export const JoltBody = trait(() => ({}) as Jolt.Body);


export const NeedsJoltBody = trait<{
  layer: "moving" | "non_moving",
  motionType: "dynamic" | "static" | "kinematic",
  buildConvexShape: boolean,
  continuousCollisionMode: boolean,
  initScale: Vector3Like
}>({

  // the best defaults here are arguable

  layer: "moving",
  motionType: "dynamic",
  buildConvexShape: false,
  continuousCollisionMode: false,
  initScale: {x: 1, y: 1, z: 1}
});