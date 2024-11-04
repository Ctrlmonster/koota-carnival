import { Entity, Not, World } from 'koota';
import { BoxGeometry, Matrix4, Quaternion, SphereGeometry, TorusGeometry, TorusKnotGeometry, Vector3 } from 'three';
import { useExampleActions } from './index';
import {
  BatchCoordinates,
  BatchCount,
  BatchIsFull,
  BatchSettings,
  DestroyMe,
  GeometryCache,
  IsBatchedOriginOf,
  OriginPosition,
  Paused,
  PlatformMovement,
  PlatformSpeed,
  RotatorPlatform,
  SpawnTime,
  TBatchedMesh,
  TColor,
  TGeometry, Ticks,
  TimeOffset,
  Transforms,
} from './base-traits';


// for demo purposes we store all general systems in a single file


// =====================================================================================================================
// =====================================================================================================================


const tempMatrix = new Matrix4();
export const SpawnBatchInstances = ({ world }: { world: World }) => {
  let batchEntity = world.queryFirst(TBatchedMesh, GeometryCache, BatchCount, Not(BatchIsFull));
  if (batchEntity === undefined) {
    batchEntity = useExampleActions.get(world).addBatch()!;
  }

  world.query(Transforms, TColor, TGeometry, Not(BatchCoordinates))
    .updateEach(([{ position, rotation, scale }, color, geometry], entity) => {

      let { current: currentBatchCount, max: maxBatchCount } = batchEntity.get(BatchCount);

      if (batchEntity.has(BatchIsFull)) return;

      currentBatchCount++;
      batchEntity.set(BatchCount, {
        current: currentBatchCount,
      });

      if (currentBatchCount === maxBatchCount) {
        batchEntity.add(BatchIsFull);
      }

      // ---------------------------------------------------------------------------


      const batchedMesh = batchEntity.get(TBatchedMesh);
      const geomCache = batchEntity.get(GeometryCache);
      let geometryId;

      // new geometry encountered
      if (!geomCache.has(geometry)) {
        geometryId = batchedMesh.addGeometry(geometry);
        geomCache.set(geometry, geometryId);
      }
      // old geometry
      else {
        geometryId = geomCache.get(geometry)!;
      }

      // add new instance
      const instanceId = batchedMesh.addInstance(geometryId);


      // save batchedMesh "coordinates"
      entity.add(BatchCoordinates({ geometryId, instanceId, batchedMesh, batchEntity }));

      batchEntity.add(IsBatchedOriginOf(entity));
      batchEntity.add(SpawnTime);

      // write the initial position
      tempMatrix.compose(position, rotation, scale);
      batchedMesh.setMatrixAt(instanceId, tempMatrix);

      // write the color
      batchedMesh.setColorAt(instanceId, color);


      // update bounding box/sphere for culling
      batchedMesh.computeBoundingBox();
      batchedMesh.computeBoundingSphere();
      batchedMesh.castShadow = true;
      batchedMesh.receiveShadow = true;


    }, {
      changeDetection: false,
    });


};


// =====================================================================================================================
// =====================================================================================================================

export const RemoveBatchInstances = ({ world }: { world: World }) => {

  world.query(BatchCoordinates, DestroyMe).updateEach(
    ([bCoords], entity) => {

      const { instanceId, batchedMesh, batchEntity } = bCoords;
      batchedMesh.deleteInstance(instanceId);
      batchedMesh.computeBoundingBox();
      batchedMesh.computeBoundingSphere();

      const currentCount = (batchEntity as Entity).get(BatchCount).current;
      (batchEntity as Entity).set(BatchCount, { current: currentCount - 1 });
      (batchEntity as Entity).remove(BatchIsFull);

      entity.destroy();

    }, { changeDetection: false },
  );

};
// =====================================================================================================================
// =====================================================================================================================


export const DestroyBatchedMesh = ({ world }: { world: World }) => {
  const { deleteInstancesOnBatchRemoval } = world.get(BatchSettings);


  world.query(TBatchedMesh, DestroyMe).updateEach(
    ([batchedMesh], batchEntity) => {

      // remove all entities that have been spawned for this batch
      if (batchEntity.has(IsBatchedOriginOf('*'))) {
        const batchInstances = batchEntity.targetsFor(IsBatchedOriginOf);
        batchInstances.forEach(instanceEntity => {
          // if we wanted to, we could just remove the BatchCoordinates trait and keep the
          // entity around to be picked up by the next batch entity
          const { instanceId } = instanceEntity.get(BatchCoordinates);
          instanceEntity.remove(BatchCoordinates);

          if (deleteInstancesOnBatchRemoval) {
            instanceEntity.destroy();
          }
          batchedMesh.deleteInstance(instanceId);
        });
      }

      batchedMesh.parent!.remove(batchedMesh);
      batchEntity.destroy();

    }, { changeDetection: false },
  );

};


// =====================================================================================================================
// =====================================================================================================================


const _m2 = new Matrix4();

export const SyncBatchTransforms = ({ world }: { world: World }) => {

  world.query(Transforms, BatchCoordinates).updateEach(
    ([{ position, rotation, scale }, bCoords], entity) => {
      const { batchedMesh, instanceId } = bCoords;
      _m2.compose(position, rotation, scale);

      batchedMesh.setMatrixAt(instanceId, _m2);

    }, { changeDetection: false },
  );


  // every nth frame we want to re-compute the bounding box / sphere
  world.query(TBatchedMesh, SpawnTime).updateEach(
    ([batchedMesh, timer]) => {
      if ((timer.ticksAlive % 10) === 0) {
        batchedMesh.computeBoundingSphere();
        batchedMesh.computeBoundingBox();
      }
    }, {changeDetection: false}
  );

};


// =====================================================================================================================
// =====================================================================================================================


const _v1 = new Vector3();
const _v2 = new Vector3();
export const UpdateMovingPlatforms = ({ world, delta }: { world: World, delta: number }) => {

  world.query(Transforms, OriginPosition, PlatformMovement, PlatformSpeed, SpawnTime, TimeOffset, Not(Paused)).updateEach(
    ([{ position }, origin, { direction, maxDistance }, { max: speed }, timer, { value: offset }]) => {

      _v2.copy(direction);
      _v2.setLength(maxDistance);

      _v1.copy(direction);
      _v1.setLength(maxDistance * Math.cos(speed * (timer.timeAlive + offset)));

      position.copy(origin).add(_v1.sub(_v2));


    }, { changeDetection: false });

};


// =====================================================================================================================
// =====================================================================================================================


const _q1 = new Quaternion();

export const UpdateRotatingPlatforms = ({ world, delta }: { world: World, delta: number }) => {


  world.query(Transforms, RotatorPlatform, Not(Paused)).updateEach(
    ([{ rotation }, { speed, axis }], entity) => {


      const angle = 2 * Math.acos(rotation.w) + (delta * speed);
      _q1.setFromAxisAngle(axis, angle % (2 * Math.PI));
      _q1.normalize();

      rotation.copy(_q1);

    }, {
      changeDetection: false,
    },
  );

};


// =====================================================================================================================
// =====================================================================================================================


export const RemoveFallenBodies = ({ world, delta }: { world: World, delta: number }) => {
  world.query(Transforms).updateEach(([{ position }], e) => {

    if (position.y < -100) {
      e.add(DestroyMe);
    }

  }, { changeDetection: false });
};

// =====================================================================================================================
// =====================================================================================================================


export const UpdateTimers = ({ world, delta }: { world: World, delta: number }) => {
  world.query(SpawnTime).updateEach(([timer]) => {
    timer.timeAlive += delta;
    timer.ticksAlive++;
  }, {changeDetection: false});
}