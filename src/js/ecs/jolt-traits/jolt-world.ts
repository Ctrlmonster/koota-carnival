import {trait} from "koota";


import Jolt from 'jolt-physics';
import JoltSettings = Jolt.JoltSettings;


export const JoltWorld = trait(() => new JoltWorldImpl());


export const LAYER_NON_MOVING = 0;
export const LAYER_MOVING = 1;
const NUM_OBJECT_LAYERS = 2;


export class JoltWorldImpl {
  joltInterface: Jolt.JoltInterface = null!;
  bodyInterface: Jolt.BodyInterface = null!;
  physicsSystem: Jolt.PhysicsSystem = null!;
  static JOLT_NATIVE: typeof Jolt;
  static _initCalled = false;


  initialized = false;


  constructor() {
    if (!JoltWorldImpl.JOLT_NATIVE) {
      throw new Error("JoltWorld can't be instanced before the jolt library has been loaded." +
        " This happened trying to create a JoltWorldImpl instance before writing the static JoltWorldImpl.JOLT_NATIVE field.");
    }

    // Initialize Jolt
    const {JOLT_NATIVE} = JoltWorldImpl;
    const settings = new JOLT_NATIVE.JoltSettings();
    this.#setupCollisionFiltering(settings);
    const jolt = new JOLT_NATIVE.JoltInterface(settings);
    JOLT_NATIVE.destroy(settings);

    this.physicsSystem = jolt.GetPhysicsSystem();
    this.bodyInterface = this.physicsSystem.GetBodyInterface();
    this.joltInterface = jolt;

    this.initialized = true;
  }

  stepPhysics(deltaTime: number) {
    // When running below 55 Hz, do 2 steps instead of 1
    const numSteps = deltaTime > (1.0 / 55.0) ? 2 : 1;
    this.joltInterface.Step(deltaTime, numSteps);
  }


  #setupCollisionFiltering(settings: JoltSettings) {
    const {JOLT_NATIVE} = JoltWorldImpl;
    // Layer that objects can be in, determines which other objects it can collide with
    // Typically you at least want to have 1 layer for moving bodies and 1 layer for static bodies, but you can have more
    // layers if you want. E.g. you could have a layer for high detail collision (which is not used by the physics simulation
    // but only if you do collision testing).
    const objectFilter = new JOLT_NATIVE.ObjectLayerPairFilterTable(NUM_OBJECT_LAYERS);
    objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING);
    objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING);

    // Each broadphase layer results in a separate bounding volume tree in the broad phase. You at least want to have
    // a layer for non-moving and moving objects to avoid having to update a tree full of static objects every frame.
    // You can have a 1-on-1 mapping between object layers and broadphase layers (like in this case) but if you have
    // many object layers you'll be creating many broad phase trees, which is not efficient.
    const BP_LAYER_NON_MOVING = new JOLT_NATIVE.BroadPhaseLayer(0);
    const BP_LAYER_MOVING = new JOLT_NATIVE.BroadPhaseLayer(1);
    const NUM_BROAD_PHASE_LAYERS = 2;
    const bpInterface = new JOLT_NATIVE.BroadPhaseLayerInterfaceTable(NUM_OBJECT_LAYERS, NUM_BROAD_PHASE_LAYERS);
    bpInterface.MapObjectToBroadPhaseLayer(LAYER_NON_MOVING, BP_LAYER_NON_MOVING);
    bpInterface.MapObjectToBroadPhaseLayer(LAYER_MOVING, BP_LAYER_MOVING);

    settings.mObjectLayerPairFilter = objectFilter;
    settings.mBroadPhaseLayerInterface = bpInterface;
    settings.mObjectVsBroadPhaseLayerFilter = new JOLT_NATIVE.ObjectVsBroadPhaseLayerFilterTable(settings.mBroadPhaseLayerInterface, NUM_BROAD_PHASE_LAYERS, settings.mObjectLayerPairFilter, NUM_OBJECT_LAYERS);
  }

}
