import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Euler,
  Quaternion,
  Vector3,
  Vector3Tuple,
  Color,
  BufferGeometry,
  ColorRepresentation,
} from 'three';
import { useEntityRef, useWorld } from 'koota/react';
import {
  ControlledBody,
  DestroyMe,
  IsCharacter,
  OriginPosition,
  Paused,
  PlatformMovement,
  PlatformSpeed,
  RotatorPlatform,
  SpawnTime,
  TColor,
  TGeometry,
  TimeOffset,
  Transforms,
} from '../../ecs/base-traits';
import { Entity } from 'koota';
import { NeedsJoltBody } from '../../ecs/jolt-traits/jolt-body';

type EntityProps = {
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  paused?: boolean;
  _entity?: Entity;
  geometry?: BufferGeometry;
  color?: string;
};

export const BasePlatform = forwardRef(
  (
    {
      position,
      rotation,
      scale,
      paused,
      color,
      geometry,
      _entity,
    }: EntityProps,
    ref: ForwardedRef<Entity>,
  ) => {
    const world = useWorld();

    useEffect(() => {
      const initPos = new Vector3(...(position ?? []));
      const initRotation = new Quaternion().setFromEuler(
        new Euler(...(rotation ?? [])),
      );
      const initScale = new Vector3(...(scale ?? [1, 1, 1]));

      const entity = _entity ?? world.spawn();

      entity.add(
        Transforms({
          position: initPos,
          rotation: initRotation,
          scale: initScale,
        }),
        TColor(new Color(color ?? 'white')),
        IsCharacter,
        SpawnTime,
        NeedsJoltBody({
          layer: "non_moving",
          motionType: "kinematic",
          continuousCollisionMode: true,
          initScale
        })
      );

      if (geometry) {
        entity.add(TGeometry(geometry));
      }

      if (paused) {
        entity.add(Paused);
      }

      return () => {
        entity?.add(DestroyMe);
      };
    }, [_entity, position, rotation, scale, color, ref]);

    // we only return the object3D for triplex, ideally we could return null
    return <object3D position={position} rotation={rotation} scale={scale} />;
  },
);

type PlatformProps = {
  direction?: Vector3Tuple;
  maxDistance?: number;
  speed?: number;
  timeOffset?: number;
};



export const MovingPlatform = memo(function Parent(
  props: EntityProps & PlatformProps,
) {
  const world = useWorld();

  useEffect(() => {
    const { position, rotation, scale } = props;
    const initPos = new Vector3(...(position ?? []));
    const initRotation = new Quaternion().setFromEuler(
      new Euler(...(rotation ?? [])),
    );
    const initScale = new Vector3(...(scale ?? [1, 1, 1]));

    const entity = world.spawn(
      Transforms({
        position: initPos,
        rotation: initRotation,
        scale: initScale,
      }),
      TColor(new Color(props.color ?? 'white')),
      IsCharacter,
      SpawnTime,
      PlatformMovement({
        direction: new Vector3(...(props.direction ?? [0, 1, 0])),
        maxDistance: props.maxDistance ?? 10,
      }),
      PlatformSpeed({
        max: props.speed ?? 1,
      }),
      TimeOffset({
        value: props.timeOffset ?? 0,
      }),
      OriginPosition(new Vector3(...(props.position ?? []))),
      NeedsJoltBody({
        continuousCollisionMode: true,
        layer: "moving",
        motionType: "kinematic",
        initScale
      }),
      ControlledBody
    );

    if (props.geometry) {
      entity.add(TGeometry(props.geometry));
    }

    if (props.paused) {
      entity.add(Paused);
    }

    return () => {
      entity.add(DestroyMe);
    };
  }, [props]);

  // we only return the object3D for triplex, ideally we could return null
  return (
    <object3D
      position={props.position}
      rotation={props.rotation}
      scale={props.scale}
    />
  );
});





type RotatingPlatformProps = {
  axis?: Vector3Tuple,
  speed?: number
}

export const RotatingPlatform = memo(function Parent(
  props: EntityProps & RotatingPlatformProps,
) {
  const world = useWorld();

  useEffect(() => {
    const { position, rotation, scale } = props;
    const initPos = new Vector3(...(position ?? []));
    const initRotation = new Quaternion().setFromEuler(
      new Euler(...(rotation ?? [])),
    );
    const initScale = new Vector3(...(scale ?? [1, 1, 1]));

    const entity = world.spawn(
      Transforms({
        position: initPos,
        rotation: initRotation,
        scale: initScale,
      }),
      RotatorPlatform({
        axis: props.axis ? new Vector3(...props.axis) : new Vector3(0, 1, 0),
        speed: props.speed  ?? 1
      }),
      TColor(new Color(props.color ?? 'white')),
      SpawnTime,
      OriginPosition(new Vector3(...(props.position ?? []))),
      NeedsJoltBody({
        continuousCollisionMode: true,
        layer: "moving",
        motionType: "kinematic",
        initScale
      }),
      ControlledBody
    );

    if (props.geometry) {
      entity.add(TGeometry(props.geometry));
    }

    if (props.paused) {
      entity.add(Paused);
    }

    return () => {
      entity.add(DestroyMe);
    };
  }, [props]);

  // we only return the object3D for triplex, ideally we could return null
  return (
    <object3D
      position={props.position}
      rotation={props.rotation}
      scale={props.scale}
    />
  );
});

















/*
export const MovingPlatform = memo(function Parent(props: EntityProps & PlatformProps) {
  const entityRef = useRef<Entity>(null!);
  const world = useWorld();
  const [entity, setEntity] = useState<Entity>(world.spawn());


  useEffect(() => {
    const _entity = world.spawn();
    _entity.add(
      PlatformMovement({
        direction: new Vector3(...(props.direction ?? [0, 1, 0])),
        maxDistance: props.maxDistance ?? 10
      }),
      PlatformSpeed({
        max: props.speed ?? 1
      }),
      TimeOffset({
        value: props.timeOffset ?? 0
      }),
      OriginPosition(new Vector3(...(props.position ?? [])))
    );

    
    setEntity(_entity);

    return () => {
      _entity?.add(DestroyMe);
    }

  }, [props]);

  return <BasePlatform {...props} ref={entityRef} _entity={entity}/>
});*/
