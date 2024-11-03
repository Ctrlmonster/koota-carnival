import {
  Environment,
  Grid,
  OrbitControls,
  PerspectiveCamera,
  Sky,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { schedule } from '../ecs';
import { memo, useEffect, useRef } from 'react';
import { BatchSettings, SceneInfo, TScene } from '../ecs/traits';
import {
  BasePlatform,
  MovingPlatform,
  RotatingPlatform,
} from './koota-react/my-entity';
import {
  BoxGeometry,
  CameraHelper,
  DirectionalLight,
  SphereGeometry,
} from 'three';
import { JoltWorld } from '../ecs/jolt-traits/jolt-world';

const testBoxGeometry = new BoxGeometry(4, 0.5, 4);
const testBox2Geometry = new BoxGeometry(15, 1, 5);
const groundGeometry = new BoxGeometry(100, 1, 100);
const testSphereGeometry = new SphereGeometry(3);

export const SceneContainer = memo(function SceneContainer() {
  const world = useWorld();
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    world.add(TScene(scene));
    world.add(BatchSettings);
    world.add(SceneInfo);
    return () => {
      world.remove(TScene);
      world.remove(BatchSettings);
      world.remove(SceneInfo);
    };
  }, [scene]);

  useFrame(({ gl, clock, scene, camera }, delta) => {
    // this is how we connect our ecs systems to r3f
    schedule.run({ world, delta });
    const drawCalls = gl.info.render.calls;

    const now = performance.now();
    gl.render(scene, camera);
    const renderTime = performance.now() - now;

    if (!(gl.info.render.frame % 10) && world.has(SceneInfo)) {
      world.set(SceneInfo, {
        drawCalls,
        renderTime,
      });
    }
  }, 1);

  return (
    <>
      <BasePlatform
        position={[39.54, 76.52, -52.62]}
        geometry={testBoxGeometry}
        color={'#7425d4'}
        scale={[3.76, 1, 17.84]}
        rotation={[
          0.4754493190471544, -0.018173474401047187, -1.5311479771448664,
        ]}
      />

      <BasePlatform
        position={[-43.76, 76.52, -54.18]}
        geometry={testBoxGeometry}
        color={'#7425d4'}
        scale={[3.76, 1, 17.84]}
        rotation={[0.4768667741090657, 0.005313541335708636, -1.5236836119175818]}


      />
      <BasePlatform
        position={[-2.24, 73.46, -49.52]}
        geometry={testBoxGeometry}
        color={'#eb8005'}
        scale={[20.36, 1, 17.84]}
        rotation={[0.5585053606381855, 0, 0]}
      />

      <BasePlatform
        position={[0.88, 154.24, -0.98]}
        geometry={testSphereGeometry}
        color={"#ff8800"}
        scale={[1, 1, 1]}
      />

      <RotatingPlatform
        geometry={testBoxGeometry}
        position={[0, 86.8, 12.52]}
        paused={false}
        scale={[0.36, 17.16, 11.94]}
        speed={2}
        axis={[0, 1, 0]}
        color={'#f2f1f9'}
      />

      <RotatingPlatform
        geometry={testBoxGeometry}
        position={[-0.36, 46.76, 20.24]}
        paused={false}
        scale={[0.32, 10.86, 5.38]}
        speed={7}
        color={"#21daf2"}
      />

      <MovingPlatform
        position={[-1.12, 14.42, -2.42]}
        direction={[0, 1, 0]}
        speed={10}
        maxDistance={3}
        paused={false}
        geometry={testBox2Geometry}
        color={'#3716bb'}
        rotation={[-0.1, 0, 0]}
        timeOffset={0}
        scale={[5.62, 4.08, 14.9]}
      />
      <MovingPlatform
        position={[-0.64, 62.22, 85.94]}
        direction={[0, -1, 1]}
        speed={10}
        maxDistance={1.5}
        paused={false}
        geometry={testBox2Geometry}
        color={'#d44949'}
        rotation={[-1.7627825445142735, 0, 0]}
        timeOffset={2}
        scale={[3.82, 1, 4.7]}
      />
      <MovingPlatform
        position={[-1.12, 135.34, 4.68]}
        direction={[0, 0, 1]}
        speed={1.5}
        maxDistance={5}
        paused={false}
        geometry={testBox2Geometry}
        color={'#16fe25'}
        rotation={[0, 0, 0]}
        timeOffset={0.5}
        scale={[2.82, 1, 1.3]}
      />
      <MovingPlatform
        position={[-0.28, 123.22, -6.64]}
        direction={[0, 0, -1]}
        speed={1.5}
        maxDistance={5}
        paused={false}
        geometry={testBox2Geometry}
        color={'#52abff'}
        rotation={[0, 0, 0]}
        timeOffset={0}
        scale={[2.96, 1, 1.3]}
      />


      <MovingPlatform
        position={[0.52, 40.78, 56.2]}
        direction={[0, 1, -1]}
        speed={5}
        maxDistance={4}
        paused={false}
        geometry={testBox2Geometry}
        color={'#c8d41c'}
        scale={[5.26, 1.56, 12.38]}
        rotation={[-0.698131700797732, 0, 0]}
      />
      <MovingPlatform
        position={[74.88, 34.22, 12.98]}
        direction={[-1, 1, 0]}
        speed={10}
        maxDistance={4}
        paused={false}
        geometry={testBox2Geometry}
        color={'#ca72c7'}
        scale={[3.8, 3.34, 30.16]}
        rotation={[0, 0, -2.503162960653562]}
      />
      <MovingPlatform
        position={[-57.04, 34.22, 12.98]}
        direction={[1, 1, 0]}
        speed={10}
        maxDistance={4}
        paused={false}
        geometry={testBox2Geometry}
        color={'#41c41c'}
        scale={[2.06, 1.86, 15.12]}
        rotation={[
          -0.1322983528312622, 0.11417133220646962, -0.7080134284570903,
        ]}
      />
      <MovingPlatform
        position={[1.22, 55.88, -13.16]}
        direction={[0, 1, 0]}
        speed={15}
        maxDistance={2}
        paused={false}
        geometry={testBox2Geometry}
        color={'#851e42'}
        scale={[2.48, 1.2, 2.52]}
        rotation={[0.17453292519943295, 0, 0]}
      />
      <MovingPlatform
        position={[0.52, 34.22, 12.98]}
        direction={[0, 1, 0]}
        speed={5}
        maxDistance={4}
        paused={false}
        geometry={testBox2Geometry}
        color={'#f2216a'}
        scale={[1.38, 3.36, 4.62]}
        rotation={[-0.17453292519943303, 0, 0]}
      />
      <MovingPlatform
        position={[-4.6, 35.84, -29.58]}
        direction={[0, -1, 1]}
        speed={10}
        maxDistance={4}
        paused={false}
        geometry={testBox2Geometry}
        color={'#ff5252'}
        rotation={[-0.5934119456780721, 0, 0]}
        scale={[6.12, 2.72, 7.06]}
      />

      {/*<MovingPlatform
        position={[9.18, 41.36, 177.08]}
        direction={[0, 0, 1]}
        speed={1.5}
        maxDistance={5}
        paused={false}
        scale={[7.88, 1, 8.44]}
        timeOffset={0}
      />
      <MovingPlatform
        position={[8.92, 30.48, 133.34]}
        direction={[0, -1, 0]}
        speed={1.5}
        maxDistance={5}
        paused={false}
        scale={[5, 1, 4.24]}
        timeOffset={0}
      />
      <MovingPlatform
        position={[8.92, 30.48, 113.24]}
        direction={[0, 0, -1]}
        speed={1.5}
        maxDistance={5}
        paused={false}
        scale={[5, 1, 8]}
        timeOffset={2}
      />
      <MovingPlatform
        position={[8.92, 28.96, 56.96]}
        direction={[0, 0, -1]}
        speed={1.5}
        maxDistance={5}
        paused={false}
        scale={[5, 1, 5.5]}
        timeOffset={2}
      />
      <MovingPlatform
        position={[8.92, 19.7, 44.14]}
        direction={[0, -1, 0]}
        speed={1.5}
        maxDistance={5}
        paused={false}
        scale={[5, 1, 8]}
        timeOffset={0}
      />
      <MovingPlatform
        position={[9.04, 19.5, 9.6]}
        direction={[0, 0, -1]}
        speed={1.2}
        maxDistance={10}
        paused={false}
        scale={[5.12, 1, 13.42]}
      />

      <BasePlatform
        position={[9.08, 39.3, 155.2]}
        scale={[4.16, 1.16, 4.04]}
        rotation={[0, 1.578, 0]}
      />
      <BasePlatform
        position={[9.08, 39.3, 145.4]}
        scale={[4.16, 1.16, 4.04]}
        rotation={[0, 1.578, 0]}
      />
      <BasePlatform
        position={[9.08, 30.32, 101.78]}
        scale={[4.16, 1.16, 4.04]}
        rotation={[0, 1.578, 0]}
      />
      <BasePlatform
        position={[9.08, 30.32, 90.56]}
        scale={[5.56, 1, 5.78]}
        rotation={[0, 1.578, 0]}
      />
      <BasePlatform
        position={[9.08, 30.32, 78.08]}
        scale={[6.34, 1, 9.38]}
        rotation={[0, 1.578, 0]}
      />
      <BasePlatform
        position={[9.08, 19.42, -5.1]}
        scale={[6.34, 1, 4.66]}
        rotation={[0, 1.578, 0]}
      />*/}

      <Background />
      <OrbitControls dampingFactor={1} />
      <PerspectiveCamera makeDefault position={[-33.44, 76.22, -46.06]} />
    </>
  );
});

function Background() {
  const lightRef = useRef<DirectionalLight>(null!);

  useEffect(() => {
    lightRef.current.shadow.camera.left = -80;
    lightRef.current.shadow.camera.right = 80;
    lightRef.current.shadow.camera.top = 80;
    lightRef.current.shadow.camera.bottom = -80;
    lightRef.current.shadow.camera.near = 0.5;
    lightRef.current.shadow.camera.far = 150;
    lightRef.current.shadow.mapSize.width = 1024;
    lightRef.current.shadow.mapSize.height = 1024;
  }, []);

  return (
    <>
      <color attach="background" args={['#060612']} />
      <directionalLight
        color={'#ffb65e'}
        intensity={3}
        position={[0, 150, 0]}
        ref={lightRef}
        castShadow
      />

      <Grid
        position-x={0.1}
        infiniteGrid
        fadeDistance={500}
        fadeStrength={5}
        cellSize={0.6}
        sectionSize={3}
        sectionColor={'#3d4367'}
        cellColor={'rgb(15,28,145)'}
      />

      <Environment frames={1} environmentIntensity={0.4}>
        <Sky sunPosition={[0, 1, 11]} />
      </Environment>
    </>
  );
}
