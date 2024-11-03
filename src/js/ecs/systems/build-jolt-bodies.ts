import { World } from 'koota';
import {
  createShapeFromGeometry,
  inferInitTransformsFromMesh,
  inferShapeArgsFromBaseGeometry,
} from '../../jolt/jolt-helper';
import {
  JoltWorld,
  JoltWorldImpl,
  LAYER_MOVING,
  LAYER_NON_MOVING,
} from '../jolt-traits/jolt-world';
import { JoltBody, NeedsJoltBody } from '../jolt-traits/jolt-body';
import Jolt from 'jolt-physics';
import { ControlledBody, TGeometry, TMesh, Transforms } from '../traits';

const helperPos: { current: null | Jolt.RVec3 } = { current: null };
const helperRot: { current: null | Jolt.Quat } = { current: null };


export const BuildJoltBodies = ({ world }: { world: World }) => {
  // we just store the jolt world directly on the ecs world
  if (!world.has(JoltWorld)) return;

  const joltWorld = world.get(JoltWorld);
  const Jolt = JoltWorldImpl.JOLT_NATIVE;

  if (!helperPos.current) {
    helperPos.current = new Jolt.RVec3();
    helperRot.current = new Jolt.Quat();
  }

  const bodiesToAdd = world.query(NeedsJoltBody, TGeometry, Transforms);

  // query all meshes that want a jolt body
  bodiesToAdd.updateEach(
    ([buildSettings, geometry, transforms], entity) => {
      const { buildConvexShape, layer, motionType, continuousCollisionMode, initScale } =
        buildSettings;

      let shape: Jolt.Shape;
      if (buildConvexShape) {
        shape = createShapeFromGeometry(geometry, initScale);
      } else {
        const { shape: ShapeClass, args } =
          inferShapeArgsFromBaseGeometry(geometry, initScale);
        // @ts-ignore
        shape = new ShapeClass(...args);
      }

      const { position, rotation } = transforms;
      helperPos.current!.Set(position.x, position.y, position.z);
      helperRot.current!.Set(rotation.x, rotation.y, rotation.z, rotation.w);

      const layerConstant =
        layer === 'moving' ? LAYER_MOVING : LAYER_NON_MOVING;
      const motionTypeConstant = (() => {
        switch (motionType) {
          case 'dynamic':
            return Jolt.EMotionType_Dynamic;
          case 'static':
            return Jolt.EMotionType_Static;
          case 'kinematic':
            return Jolt.EMotionType_Kinematic;
          default:
            throw new Error(`unrecognized motion type: ${motionType}`);
        }
      })();

      const creationSettings = new Jolt.BodyCreationSettings(
        shape,
        helperPos.current!,
        helperRot.current!,
        motionTypeConstant,
        layerConstant,
      );
      // consume settings to create a body
      const body = joltWorld.bodyInterface.CreateBody(creationSettings);
      Jolt.destroy(creationSettings);

      // check if we wanted continuous collisions on this body
      if (continuousCollisionMode) {
        joltWorld.bodyInterface.SetMotionQuality(
          body.GetID(),
          Jolt.EMotionQuality_LinearCast,
        );
      }
      // update the entity (remove the flag, add the body trait)
      entity.remove(NeedsJoltBody);
      entity.add(JoltBody(body));

      if (
        motionTypeConstant === Jolt.EMotionType_Static ||
        motionTypeConstant === Jolt.EMotionType_Kinematic
      ) {
        entity.add(ControlledBody);
      }

      // add  to the jolt world
      joltWorld.bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);

    },
    {
      changeDetection: false,
    },
  );

  if (bodiesToAdd.length) {
    joltWorld.physicsSystem.OptimizeBroadPhase();
  }


};
