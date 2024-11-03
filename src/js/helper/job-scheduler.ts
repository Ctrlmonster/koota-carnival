import {RootState} from "@react-three/fiber";

export type Work = (...args: any[]) => any;
export type Condition = (() => any) | undefined;
export type Job = { condition?: Condition, work: Work };

type Defer = <T extends Work>(fn: T, condition?: Condition) => Promise<ReturnType<T>>;
type Timeout = <T extends Work>(fn: T, timeInMs: number) => Promise<ReturnType<T>>;
type ParametersAndCondition<F extends Work, E> = [...Parameters<F>, E];


export type DeferredFunction<T extends Work> = {
  (...args: ParametersAndCondition<T, Condition>): Promise<ReturnType<T>>;
  (...args: Parameters<T>): Promise<ReturnType<T>>;
};


export type JobHelpers = ReturnType<JobScheduler["exportJobHelper"]>;

class JobScheduler {
  // --------------------------------------------------------------------------------
  #queuedWork: Work[] = [];
  #availableJobs: Set<Job> = new Set<Job>();
  #rejectByPromise = new Map<Promise<void>, (reason?: any) => void>();
  #elapsedTime = 0;
  #frameCount = 0;
  #state: RootState = null!;
  #xrFrame: XRFrame | undefined;
  #delta: number = 0;

  getNumberOfJobs() {
    return this.#availableJobs.size;
  }

  // --------------------------------------------------------------------------------


  /**
   * export a set of concurrency primitives like (sleep, defer, createJob, tween, etc.)
   */
  exportJobHelper() {
    /**
     * Defer a function from being executed (inside the render loop) until some condition is true.
     * Careful: If "this" should be preserved inside the function, pass a bound/arrow function.
     * defer(myFn, () => myCondition);
     */
    const defer: Defer = (fn, condition) => {
      return this.#registerJob({work: fn, condition});
    }

    /**
     * Wraps a function inside defer, so that it is automatically deferred when called.
     * The jobified function accepts the same arguments as the wrapped function, with the
     * option to pass a condition function as the last argument.
     * jobify(myFnWithArgs)(myArgs, () => myCondition);
     */
    const createDeferredFn = <T extends Work>(fn: T): DeferredFunction<T> => {
      return (...args) => {
        // check if more than the function arguments have been passed, if so
        // the last argument is the condition function
        const condition = (args.length > fn.length) ? args.pop() : undefined;
        return defer(() => fn(...args), condition);
      }
    };


    /**
     * setTimeout alternative that works with the elapsed render time - thereby
     * supporting render on demand, tab switching, etc.
     * timeout(myFn, 1000);
     */
    const delay: Timeout = (fn, timeInMs) => {
      return this.#registerTimeout(fn, timeInMs);
    }

    const delayFrames = (fn: Work, numFrames: number) => {
      return this.#registerFrameTimeout(fn, numFrames);
    }

    /**
     * Cancel a job by its promise.
     * cancelJob(defer(myFn, () => myCondition));
     */
    const cancelJob = (jobPromise: Promise<any>): boolean => {
      return this.#cancelJob(jobPromise);
    }


    function sleepUntil(fn: Condition): Promise<void> {
      return defer(() => {
      }, fn);
    }

    function sleep(timeInMs: number): Promise<void> {
      return delay(() => {
      }, timeInMs);
    }

    function sleepFrames(numFrames: number): Promise<void> {
      return delayFrames(() => {
      }, numFrames);
    }


    /**
     * Subscribe to the frameloop and execute a function every frame.
     * A condition function can be passed to stop the subscription.
     * The subscription will automatically stop if the condition function returns true.
     * Otherwise, the subscription will run until the user calls unsubscribe.
     * @param fn - function to execute every frame
     * @param condition - optional condition function to automatically stop the subscription
     * @returns unsubscribe function - call this to stop the subscription
     */
    const subscribe = (fn: (state: RootState, delta: number, xrFrame: XRFrame | undefined) => void,
                       condition?: Condition) => {

      const currentPromise: { promise: Promise<any> } = {promise: null!};
      const job = createDeferredFn(() => {
        if (condition && condition()) {
          cancelJob(currentPromise.promise);
          return;
        }
        fn(this.#state, this.#delta, this.#xrFrame);
        currentPromise.promise = job();
      });
      currentPromise.promise = job();
      return () => cancelJob(currentPromise.promise);
    }


    /**
     * Newest addition: Tween - tween a value from 0 to 1 over
     * a given number of milliseconds. Returns a promise that
     * resolves upon tween completion. Target value is capped at
     * 1, so depending on the passed time parameter, the last
     * delta can be smaller
     * @param fn
     * @param timeInMs
     */
    const tween = (fn: (t: number) => void, timeInMs: number) => {
      let progress = 0;
      // we want to keep the api consistent, exposing time args in ms
      let destinationTime = timeInMs / 1000;

      // we want to return a cancel tween function, as well as a promise
      // that resolves when the tween is done. That's why we need to
      // create an extra promise, that resolves when the tween is done
      // and gets rejected when the tween is cancelled.
      let resolve_: any, reject_: any;
      const promise = new Promise<void>((resolve, reject) => {
        resolve_ = resolve;
        reject_ = reject;
      });
      // no errors for cancelling a tween
      promise.catch(() => {
      });

      const cancelSub = subscribe((state, delta, xrFrame) => {
        // calc progress
        const step = delta / destinationTime;
        // cap progress at 1
        progress = Math.min(progress + step, 1);
        // execute the user function with the current time as argument
        fn(progress);
        // ----------------------------------------
      }, () => {
        if (progress >= 1) {
          resolve_();
          return true;
        } else {
          return false;
        }
      });

      const cancelTween = () => {
        cancelSub();
        reject_('Tween cancelled');
      };

      return [promise, cancelTween] as const;
    };


    return {
      defer,
      delay,
      delayFrames,
      cancelJob,
      sleepUntil,
      sleep,
      sleepFrames,
      createDeferredFn,
      subscribe,
      tween,
    };
  }


  // btw there is no problem in actions registering new actions as their work.
  // E.g. in the case of a job that registers itself, recJob = jobify(() => recJob())
  // the work of the job (which is registering itself again) is only added
  // to the work queue if its condition is met and only executed after all
  // available actions have been processed and the ones with met conditions
  // have been removed from the list. recJob would simply be executed once
  // every frame.
  #registerJob<T extends Work>(job: Job): Promise<ReturnType<T>> {
    return this.#createJobPromise(job);
  }

  // timeout version of registerJob, simply pass some work and a timeout.
  // the condition will be reaching the target time.
  #registerTimeout<T extends Work>(work: Work, timeoutInMs: number): Promise<ReturnType<T>> {
    const targetTime = this.#elapsedTime + timeoutInMs / 1000;
    const job: Job = {
      condition: () => this.#elapsedTime >= targetTime,
      work,
    };
    return this.#createJobPromise(job);
  }

  #registerFrameTimeout<T extends Work>(work: Work, numFrames: number): Promise<ReturnType<T>> {
    const targetFrame = this.#frameCount + numFrames;
    const job: Job = {
      condition: () => this.#frameCount >= targetFrame,
      work,
    };
    return this.#createJobPromise(job);
  }

  #createJobPromise(job: Job) {
    const {work} = job;
    let cancel: (reason?: any) => void;
    // create a promise whose generic value matches the actions work function
    const promise = new Promise<ReturnType<typeof work>>((resolve, reject) => {
      job.work = () => {
        // the new work will be doing the user's work + resolving the promise
        const result = work();
        resolve(result);
        this.#rejectByPromise.delete(promise);
      };
      // the cancel function gets called if a job is canceled, it rejects
      // the promise and removes the job from the list of available jobs
      cancel = () => {
        reject();
        this.#availableJobs.delete(job);
        this.#rejectByPromise.delete(promise);
      };
      this.#availableJobs.add(job);
    });
    this.#rejectByPromise.set(promise, cancel!);
    return promise;
  }


  #addWorkToQueue(work: Work) {
    this.#queuedWork.push(work);
  }


  /**
   * Update the frameloop. Pass the arguments of useFrame
   * @param state
   * @param delta
   * @param xrFrame
   */
  __update(state: RootState, delta: number, xrFrame: XRFrame | undefined) {
    this.#updateState(state, delta, xrFrame);
    // --------------------------------------------------------
    // go through all actions and check if their condition is given
    for (const job of this.#availableJobs) {
      if (job.condition == undefined || job.condition()) {
        this.#addWorkToQueue(job.work); // add actions work to the work queue
        this.#availableJobs.delete(job); // delete the job from the list
      }
    }
    // then execute all the queued work
    for (let i = 0; i < this.#queuedWork.length; i++) {
      this.#queuedWork[i]();
    }
    this.#queuedWork.length = 0;
  }


  // ======================================================================================================

  #cancelJob(jobPromise: Promise<void>) {
    const reject = this.#rejectByPromise.get(jobPromise);
    // adding a default catch to avoid unhandled promise rejection warnings
    jobPromise.catch(() => {
      //console.log("cancelled by user");
    })
    if (reject) {
      reject();
      return true;
    } else {
      // TODO: Remove this warning once all basic functionality is implemented
      console.warn("Tried to cancel a job that was not registered.");
      return false;
    }
  }

  // ======================================================================================================


  #updateState(state: RootState, delta: number, xrFrame: XRFrame | undefined) {
    this.#state = state; // can probably be assigned a single time on init
    this.#delta = delta;
    this.#elapsedTime += delta;
    this.#frameCount++;
    this.#xrFrame = xrFrame;
  }
}


export const jobScheduler = new JobScheduler();
export const {
  tween,
  createDeferredFn,
  defer,
  delay,
  delayFrames,
  cancelJob,
  sleepUntil,
  sleep,
  sleepFrames,
  subscribe
} = jobScheduler.exportJobHelper()


// ======================================================================================================
