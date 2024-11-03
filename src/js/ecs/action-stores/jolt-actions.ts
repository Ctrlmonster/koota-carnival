import { createActions } from 'koota/react';
import { Not, World } from 'koota';
import { JoltWorld, JoltWorldImpl } from '../jolt-traits/jolt-world';
import { between, randomHSL } from '../../util/random';
import {
  ControlledBody,
  DestroyMe,
  TColor,
  TGeometry,
  Transforms,
} from '../base-traits';
import { BoxGeometry, Color, SphereGeometry, Vector3 } from 'three';
import { JoltBody, NeedsJoltBody } from '../jolt-traits/jolt-body';

const testGeometry = new BoxGeometry();
const testGeometry2 = new SphereGeometry();

export const useJoltActions = createActions(
  (world: World) => ({
    initWorld: (() => {
      // this action returns a promise that could probably be combined with react-suspense for a <Physics> component
      return async () => {
        if (JoltWorldImpl._initCalled && !world.has(JoltWorld))
          return Promise.reject();
        if (JoltWorldImpl._initCalled && world.has(JoltWorld))
          return Promise.resolve();

        JoltWorldImpl._initCalled = true;

        const joltInit = await import('jolt-physics/wasm-multithread'); // <- use this if SAB are available
        //const joltInit = await import('jolt-physics'); // using regular jolt for CSB
        JoltWorldImpl.JOLT_NATIVE = await joltInit.default();

        console.log('created jolt world');

        world.add(JoltWorld);

        return Promise.resolve();
      };
    })(),

    spawnFallingBodies: () => {
      for (let i = 0; i < 15; i++) {
        const isSphere = Math.random() < 0.2;
        const scale = isSphere ? 0.75 : 1; // Math.max(Math.random() + 0.1, 0.5) : Math.random() + 0.7;

        setTimeout(() => {
          world.spawn(
            Transforms({
              position: new Vector3(between(-2, 2), 190, between(-2, 2)),
              //position: new Vector3(0, 160, 0),
              scale: new Vector3(scale, scale, scale),
            }),
            TColor(new Color(randomHSL())),
            NeedsJoltBody({
              layer: 'moving',
              motionType: 'dynamic',
              continuousCollisionMode: true,
              initScale: { x: scale, y: scale, z: scale },
            }),
            TGeometry(!isSphere ? testGeometry : testGeometry2),
          );
        }, i * 100);
      }
    },

    removeBodies: () => {
      world
        .query(JoltBody, Not(ControlledBody))
        ?.forEach((entity) => entity.add(DestroyMe));
    },
  }),

  // ... more actions here
);
