import { World } from 'koota';
import { DestroyMe } from '../base-traits';
import { JoltBody } from '../jolt-traits/jolt-body';
import { JoltWorld } from '../jolt-traits/jolt-world';

export const JoltDestroyBodies = ({ world }: { world: World }) => {
  if (!world.has(JoltWorld)) return;
  const joltWorld = world.get(JoltWorld);

  world.query(JoltBody, DestroyMe).updateEach(
    ([joltBody]) => {
      const id = joltBody.GetID();
      joltWorld.bodyInterface.RemoveBody(id);
      joltWorld.bodyInterface.DestroyBody(id);
    },
    { changeDetection: false },
  );
};
