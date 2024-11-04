import {relation, trait} from "koota";
import {BatchedMesh, BufferGeometry, Color, Mesh, Quaternion, Scene, Vector3, Vector3Like, Vector3Tuple} from "three";

// for demo purposes we store all traits (ecs components) in a single file
export const TBatchedMesh = trait(() => ({}) as BatchedMesh);
export const BatchSettings = trait({
  deleteInstancesOnBatchRemoval: false,
});
export const BatchIsFull = trait();
export const BatchCount = trait({current: 0, max: 100});
export const DestroyMe = trait();

export const Transforms = trait({
  position: () => new Vector3,
  rotation: () => new Quaternion,
  scale: () => new Vector3(1, 1, 1),
});

export const TColor = trait(() => new Color());
// we only use this mesh as an init value for types, we'll pass the actual mesh when adding this trait
export const TMesh = trait(() => new Mesh);
export const TGeometry = trait(() => new BufferGeometry);
export const TScene = trait(() => ({}) as Scene);
export const GeometryCache = trait(() => new Map<BufferGeometry, number>);

export const BatchCoordinates = trait({
  geometryId: -1,
  instanceId: -1,
  batchedMesh: new BatchedMesh(0, 0, 0),
  batchEntity: -1
});


export const SpawnTime = trait({origin: () => performance.now(), timeAlive: 0, ticksAlive: 0});
export const IsCharacter = trait(); 
export const SceneInfo = trait(() => ({
  drawCalls: 0,
  renderTime: 0,
}));

export const PlatformMovement = trait({
  direction: () => new Vector3(0, 1, 0),
  maxDistance: 10,
});
export const PlatformSpeed = trait({
  max: 1,
});


export const Paused = trait();
export const TimeOffset = trait({
  value: 0
});

export const OriginPosition = trait(() => new Vector3);

export const ControlledBody = trait();


export const IsBatchedOriginOf = relation();


export const RotatorPlatform = trait({
  axis: () => new Vector3(0, 1, 0),
  speed: 1
});

export const Ticks = trait({
  current: 0
})