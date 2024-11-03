import {World} from "koota";
import {JoltWorld} from "../jolt-traits/jolt-world";

export const UpdateJolt = ({world, delta}: { world: World, delta: number }) => {
  if (!world.has(JoltWorld)) return;

  const joltWorld = world.get(JoltWorld);
  joltWorld.stepPhysics(delta);
}