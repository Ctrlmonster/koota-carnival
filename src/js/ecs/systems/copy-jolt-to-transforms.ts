import { Not, World } from 'koota';
import { JoltBody } from '../jolt-traits/jolt-body';
import { ControlledBody, Transforms } from '../traits';
import { JoltWorld, JoltWorldImpl } from '../jolt-traits/jolt-world';
import Jolt from 'jolt-physics';

export const CopyJoltToTransforms = ({ world }: { world: World }) => {
  if (!world.has(JoltWorld)) return;

  world
    .query(JoltBody, Transforms, Not(ControlledBody))
    .useStores(([joltBody, transforms], entities) => {
      const { position, rotation } = transforms;

      for (const entity of entities) {
        const eIdx = entity.id();

        const body = joltBody[eIdx];
        const pos = position[eIdx];
        const rot = rotation[eIdx];

        const joltPos = body.GetPosition();
        pos.set(joltPos.GetX(), joltPos.GetY(), joltPos.GetZ());

        const joltRot = body.GetRotation();
        rot.set(joltRot.GetX(), joltRot.GetY(), joltRot.GetZ(), joltRot.GetW());
      }
    });
};

const helperPos: { current: null | Jolt.RVec3 } = { current: null };
const helperRot: { current: null | Jolt.Quat } = { current: null };

export const CopyTransformsToJolt = ({
  world,
  delta,
}: {
  world: World;
  delta: number;
}) => {
  if (!world.has(JoltWorld)) return;
  const Jolt = JoltWorldImpl.JOLT_NATIVE;

  if (!helperPos.current) {
    helperPos.current = new Jolt.RVec3();
    helperRot.current = new Jolt.Quat();
  }

  world
    .query(JoltBody, Transforms, ControlledBody)
    .useStores(([joltBody, transforms], entities) => {
      const { position, rotation } = transforms;

      for (const entity of entities) {
        const eIdx = entity.id();

        const pos = position[eIdx];
        const rot = rotation[eIdx];

        helperPos.current!.Set(pos.x, pos.y, pos.z);
        helperRot.current!.Set(rot.x, rot.y, rot.z, rot.w);

        const body = joltBody[eIdx];
        body.MoveKinematic(helperPos.current!, helperRot.current!, delta);
      }
    });
};
