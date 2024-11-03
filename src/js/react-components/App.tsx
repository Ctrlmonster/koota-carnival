import { Canvas } from '@react-three/fiber';
import { useObserve, useQuery, useWorld } from 'koota/react';
import { useLayoutEffect, useState } from 'react';
import { useJoltActions } from '../ecs/action-stores/jolt-actions';
import { SceneInfo, Transforms } from '../ecs/base-traits';
import { SceneContainer } from './SceneContainer';

export default function App() {
  const world = useWorld();
  const entities = useQuery(Transforms);
  const info = useObserve(world, SceneInfo);

  const { initWorld, spawnFallingBodies, removeBodies } = useJoltActions();
  const [joltReady, setJoltReady] = useState(false);

  useLayoutEffect(() => {
    (async () => {
      initWorld()
        .then(() => setJoltReady(true))
        .catch(() => setJoltReady(false));
    })();
  }, []);

  return (
    <div className={'Container text-white'} id={'app'}>
      <Canvas shadows>
        <SceneContainer />
      </Canvas>

      <div className={`absolute bottom-5 right-10`}>
        <div>Scene Entities: {entities.length}</div>
        <div>Draw Calls: {info?.drawCalls ?? 0}</div>
        <div>Render Time: {(info?.renderTime ?? 0).toFixed(2)}ms</div>
      </div>

      <div className={`absolute bottom-5 left-10 flex gap-2`}>
        <div onClick={spawnFallingBodies} className={`btn btn-blue`}>
          Spawn Bodies
        </div>
        <div className={`btn btn-red`} onClick={removeBodies}>Remove Bodies</div>
      </div>

      {!joltReady ? (
        <div
          className={
            'absolute interaction-none top-0 left-0 w-full h-full text-xl flex justify-center items-center'
          }
        >
          <div className={"flex-col items-center justify-center"}>
            <div className="m-auto loader mb-4"></div>
            <div>
              Waiting for multi-threaded Jolt...
              (On Stackblitz this can take up to 1 min. Not sure why – let me know if you do! locally this takes ~ 1 second.)
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
