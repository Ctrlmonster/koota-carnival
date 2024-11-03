import { Schedule } from 'directed';
import { createWorld, World } from 'koota';
import { createActions } from 'koota/react';
import {
  DestroyBatchedMesh,
  RemoveBatchInstances,
  RemoveFallenBodies,
  SpawnBatchInstances,
  SyncBatchTransforms,
  UpdateMovingPlatforms,
  UpdateRotatingPlatforms,
} from './systems';
import {
  BatchCoordinates,
  BatchCount,
  BatchSettings,
  DestroyMe,
  GeometryCache,
  SpawnTime,
  TBatchedMesh,
  TColor,
  Transforms,
  TScene,
} from './traits';
import {
  BatchedMesh,
  Color,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { BuildJoltBodies } from './systems/build-jolt-bodies';
import { UpdateJolt } from './systems/update-jolt-physics';
import {
  CopyJoltToTransforms,
  CopyTransformsToJolt,
} from './systems/copy-jolt-to-transforms';
import { JoltDestroyBodies } from './systems/jolt-destroy-bodies';

// =================================================================================================================

// create our world
export const world = createWorld();

// create a default schedule (we can control what data it passes into systems)
export const schedule = new Schedule<{ world: World; delta: number }>();

// import all ecs systems and build the schedule
schedule.add(SpawnBatchInstances);
schedule.add(RemoveBatchInstances, { after: SpawnBatchInstances });
schedule.add(DestroyBatchedMesh, { after: SpawnBatchInstances });



schedule.add(UpdateMovingPlatforms, { before: SyncBatchTransforms });
schedule.add(UpdateRotatingPlatforms, { before: SyncBatchTransforms });
schedule.add(SyncBatchTransforms, {
  after: [DestroyBatchedMesh, RemoveBatchInstances, SpawnBatchInstances],
});

schedule.add(BuildJoltBodies);
schedule.add(UpdateJolt, { after: [BuildJoltBodies] });
schedule.add(CopyJoltToTransforms, {
  after: [UpdateJolt],
  before: [SyncBatchTransforms],
});
schedule.add(CopyTransformsToJolt, {
  after: [UpdateMovingPlatforms], // there might be multiple "controlled body" systems here, we should probably group those together or give them a tag
  before: [UpdateJolt],
});

schedule.add(JoltDestroyBodies, {
  after: [UpdateJolt, BuildJoltBodies],
  before: [DestroyBatchedMesh, RemoveBatchInstances]
});

schedule.add(RemoveFallenBodies, {
  after: [SyncBatchTransforms]
})

schedule.build();

// =================================================================================================================

// an example actions store to be used from within React.
// Creating action stores is optional – we can execute the code directly –
// but it can help us with organization.

export const useExampleActions = createActions((world: World) => ({
  spawnInstance: () => {
    world.spawn(
      TColor(new Color(`hsl(${Math.random() * 360}, 100%, 50%)`)),
      Transforms({
        position: new Vector3(
          Math.random() * 70 - 35,
          Math.random() * 15,
          Math.random() * 70 - 35,
        ),
        rotation: new Quaternion(
          0, // 0 * Math.sin(angle / 2)
          Math.sin(Math.PI / 4), // 1 * Math.sin(angle / 2)
          Math.sin(0), // 0 * Math.sin(angle / 2),
          Math.cos(Math.PI / 4), // angle
        ),
      }),
      SpawnTime({
        origin: performance.now(),
        timeAlive: 0,
      }),
    );
  },

  removeInstance: () => {
    const ents = world.query(BatchCoordinates);
    for (const ent of ents) {
      if (!ent.has(DestroyMe)) {
        ent.add(DestroyMe);
        break;
      }
    }
  },

  removeBatch: () => {
    world.queryFirst(TBatchedMesh)?.add(DestroyMe);
  },

  addBatch: () => {
    if (!world.has(TScene)) return;

    const scene = world.get(TScene);
    const count = 100;
    const bMesh = new BatchedMesh(
      count,
      count * 1024,
      count * 2048,
      new MeshStandardMaterial(),
    );
    const entity = world.spawn(
      TBatchedMesh(bMesh),
      BatchCount({ current: 0, max: count }),
      GeometryCache,
    );
    scene.add(bMesh);

    return entity;
  },

  setDeleteSetting: (doDelete: boolean) => {
    if (!world.has(BatchSettings)) return;

    world.set(BatchSettings, {
      deleteInstancesOnBatchRemoval: doDelete,
    });
  },

  setInstanceNumber: (count: number) => {
    const numBatchInstances = world.query(Transforms, TColor).length;

    // add some
    if (numBatchInstances < count) {
      const diff = count - numBatchInstances;

      for (let i = 0; i < diff; i++) {
        useExampleActions.get(world).spawnInstance();
      }
    }

    // delete some
    else {
      const numActualized = world.query(BatchCoordinates).length;
      const diff = numActualized - count;

      for (let i = 0; i < diff; i++) {
        useExampleActions.get(world).removeInstance();
      }
    }
  },
}));

// =================================================================================================================
