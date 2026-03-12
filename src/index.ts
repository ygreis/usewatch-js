/**
 * Options used when creating or updating a reactive state.
 *
 * @public
 * @remarks
 * These options control deep reactivity and optional synchronization between tabs.
 * Named states can opt into `BroadcastChannel` updates by enabling `syncTabs`.
 *
 * @example
 * ```ts
 * const count = setState(0, { deep: false });
 * ```
 *
 * @example
 * ```ts
 * const theme = setState("theme", "dark", {
 *   syncTabs: true,
 *   channelName: "usewatch-theme",
 * });
 * ```
 */
export type SetStateOptions = {
  syncTabs?: boolean;
  deep?: boolean;
  channelName?: string;
};

/**
 * Options used when subscribing with {@link useWatch}.
 *
 * @public
 * @remarks
 * By default, watchers run immediately once after subscription.
 *
 * @example
 * ```ts
 * useWatch((state) => {
 *   console.log(state.value);
 * }, [count], { immediate: false });
 * ```
 */
export type UseWatchOptions = {
  immediate?: boolean;
};

/**
 * A reactive state object returned by `setState` or `useState`.
 *
 * @typeParam T - The current value type stored by the state.
 * @public
 * @remarks
 * `value` is the public reactive value. Internal metadata fields are used by the
 * library to track named states, deep reactivity and tab synchronization.
 *
 * @example
 * ```ts
 * const counter = setState(0);
 * counter.value += 1;
 * ```
 */
export type StateProps<T = any> = {
  value: T;
  hasChanged: boolean;
  watch?: Array<() => void>;
  __key?: string;
  __syncTabs?: boolean;
  __deep?: boolean;
  __channelName?: string;
  __fromBroadcast?: boolean;
};

export type UseWatchCallback = (...states: StateProps[]) => void;

/**
 * Public API returned by {@link createContext}.
 *
 * @public
 * @remarks
 * Each context has its own registry of named states, watchers and tab-sync channels.
 * This makes it possible to isolate groups of states from the default top-level API.
 */
export type UseWatchContext = {
  setState<T = any>(value: T, options?: SetStateOptions): StateProps<T>;
  setState<T = any>(key: string, value: T, options?: SetStateOptions): StateProps<T>;
  useState<T = any>(key: string, initialValue?: T, options?: SetStateOptions): StateProps<T>;
  useWatch(
    callback: UseWatchCallback,
    states: StateProps[],
    options?: UseWatchOptions,
  ): () => void;
};

type BroadcastPayload = {
  type: "usewatch:update";
  key: string;
  value: any;
  origin: string;
  channelName: string;
};

const DEFAULT_CHANNEL_NAME = "usewatch-js";
const hasBroadcastChannel = typeof BroadcastChannel !== "undefined";
const setStateOptionKeys = new Set(["syncTabs", "deep", "channelName"]);

const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object";
};

const isSetStateOptions = (value: unknown): value is SetStateOptions => {
  if (!isObject(value)) {
    return false;
  }

  return Object.keys(value).every((key) => setStateOptionKeys.has(key));
};

const createContextTabId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tab_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const toPlainValue = (value: any): any => {
  if (!isObject(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toPlainValue);
  }

  const plainObject: Record<string, any> = {};

  Object.keys(value).forEach((key) => {
    plainObject[key] = toPlainValue(value[key]);
  });

  return plainObject;
};

/**
 * Creates an isolated reactive context.
 *
 * @returns A context with its own `setState`, `useState` and `useWatch` functions.
 *
 * @public
 * @remarks
 * Named states created inside a context are stored only in that context. This is useful
 * when you want multiple isolated registries or separate `BroadcastChannel` lifecycles.
 *
 * @example
 * ```ts
 * const context = createContext();
 * const session = context.setState("session", { loggedIn: false });
 *
 * context.useWatch((state) => {
 *   console.log(state.value.loggedIn);
 * }, [session]);
 * ```
 */
export const createContext = (): UseWatchContext => {
  const statesRegistry: Record<string, StateProps> = {};
  const channelsRegistry: Record<string, BroadcastChannel> = {};
  const channelListenersRegistry: Record<string, boolean> = {};
  const tabId = createContextTabId();

  const getChannel = (channelName = DEFAULT_CHANNEL_NAME): BroadcastChannel | null => {
    if (!hasBroadcastChannel) {
      return null;
    }

    if (!channelsRegistry[channelName]) {
      channelsRegistry[channelName] = new BroadcastChannel(channelName);
    }

    return channelsRegistry[channelName];
  };

  const notifyWatchers = (state: StateProps) => {
    state.hasChanged = true;

    state.watch?.forEach((watcher) => {
      watcher();
    });

    state.hasChanged = false;
  };

  const broadcastState = (state: StateProps) => {
    if (!state.__syncTabs || !state.__key || state.__fromBroadcast) {
      return;
    }

    const channelName = state.__channelName || DEFAULT_CHANNEL_NAME;
    const channel = getChannel(channelName);

    if (!channel) {
      return;
    }

    const payload: BroadcastPayload = {
      type: "usewatch:update",
      key: state.__key,
      value: toPlainValue(state.value),
      origin: tabId,
      channelName,
    };

    channel.postMessage(payload);
  };

  const createReactiveValue = (value: any, state: StateProps): any => {
    if (!state.__deep || !isObject(value)) {
      return value;
    }

    return new Proxy(value, {
      get(target, prop) {
        const currentValue = (target as any)[prop];

        if (isObject(currentValue)) {
          return createReactiveValue(currentValue, state);
        }

        return currentValue;
      },

      set(target, prop, newValue) {
        const currentValue = (target as any)[prop];

        if (currentValue !== newValue) {
          (target as any)[prop] = newValue;

          notifyWatchers(state);
          broadcastState(state);
        }

        return true;
      },

      deleteProperty(target, prop) {
        if (prop in target) {
          delete (target as any)[prop];

          notifyWatchers(state);
          broadcastState(state);
        }

        return true;
      },
    });
  };

  const createState = <T = any>(
    initialValue: T,
    key?: string,
    options?: SetStateOptions,
  ): StateProps<T> => {
    const state: StateProps<T> = {
      value: initialValue,
      hasChanged: false,
      watch: [],
      __key: key,
      __syncTabs: options?.syncTabs ?? false,
      __deep: options?.deep ?? true,
      __channelName: options?.channelName ?? DEFAULT_CHANNEL_NAME,
      __fromBroadcast: false,
    };

    const proxy = new Proxy(state, {
      get(currentState, prop) {
        return (currentState as any)[prop];
      },

      set(currentState, prop, newValue) {
        const currentValue = (currentState as any)[prop];

        if (currentValue === newValue) {
          return true;
        }

        if (prop === "value") {
          currentState.value = createReactiveValue(newValue, currentState);

          notifyWatchers(currentState);
          broadcastState(currentState);

          return true;
        }

        (currentState as any)[prop] = newValue;
        return true;
      },
    });

    proxy.value = createReactiveValue(initialValue, proxy);

    return proxy;
  };

  const ensureChannelListener = (channelName = DEFAULT_CHANNEL_NAME) => {
    if (!hasBroadcastChannel || channelListenersRegistry[channelName]) {
      return;
    }

    const channel = getChannel(channelName);

    if (!channel) {
      return;
    }

    channel.onmessage = (event: MessageEvent<BroadcastPayload>) => {
      const payload = event.data;

      if (!payload || payload.type !== "usewatch:update") {
        return;
      }

      if (payload.origin === tabId) {
        return;
      }

      const existingState = statesRegistry[payload.key];

      if (!existingState) {
        statesRegistry[payload.key] = createState(payload.value, payload.key, {
          syncTabs: true,
          deep: true,
          channelName: payload.channelName,
        });
        return;
      }

      existingState.__fromBroadcast = true;
      existingState.value = payload.value;
      existingState.__fromBroadcast = false;
    };

    channelListenersRegistry[channelName] = true;
  };

  const applyStateOptions = (state: StateProps, options?: SetStateOptions) => {
    if (!options) {
      return;
    }

    state.__syncTabs = options.syncTabs ?? state.__syncTabs;
    state.__deep = options.deep ?? state.__deep;
    state.__channelName = options.channelName ?? state.__channelName;
  };

  /**
   * Creates a reactive state within the current context.
   *
   * @param value - The initial value for a local anonymous state.
   * @param options - Optional behavior flags for deep reactivity and tab sync.
   * @returns A reactive state object.
   *
   * @public
   * @remarks
   * Calling `setState(value)` creates a local state with no registry key.
   *
   * @example
   * ```ts
   * const counter = setState(0);
   * ```
   */
  function setState<T = any>(value: T, options?: SetStateOptions): StateProps<T>;

  /**
   * Creates or updates a named reactive state within the current context.
   *
   * @param key - The registry key used to store and retrieve the state.
   * @param value - The initial or next value for the named state.
   * @param options - Optional behavior flags for deep reactivity and tab sync.
   * @returns A reactive state object tied to the provided key.
   *
   * @public
   * @remarks
   * Calling `setState(key, value)` creates a named state. Reusing the same key returns the
   * same state instance and updates its value. Named states can optionally synchronize
   * between browser tabs through `BroadcastChannel`.
   *
   * @example
   * ```ts
   * const theme = setState("theme", "dark");
   * ```
   *
   * @example
   * ```ts
   * const profile = setState("profile", { name: "Ada" }, { syncTabs: true });
   * ```
   */
  function setState<T = any>(key: string, value: T, options?: SetStateOptions): StateProps<T>;
  function setState<T = any>(
    valueOrKey: T | string,
    valueOrOptions?: T | SetStateOptions,
    maybeOptions?: SetStateOptions,
  ): StateProps<T> {
    const isNamedState =
      typeof valueOrKey === "string" &&
      ((arguments.length === 2 && !isSetStateOptions(valueOrOptions)) || arguments.length >= 3);

    if (!isNamedState) {
      return createState(valueOrKey as T, undefined, valueOrOptions as SetStateOptions);
    }

    const key = valueOrKey as string;
    const value = valueOrOptions as T;
    const options = maybeOptions;
    const existingState = statesRegistry[key] as StateProps<T> | undefined;

    if (!existingState) {
      const state = createState(value, key, options);
      statesRegistry[key] = state;

      if (state.__syncTabs) {
        ensureChannelListener(state.__channelName);
      }

      return state;
    }

    applyStateOptions(existingState, options);

    if (existingState.__syncTabs) {
      ensureChannelListener(existingState.__channelName);
    }

    existingState.value = value;
    return existingState;
  }

  /**
   * Retrieves a named state from the current context or creates it if missing.
   *
   * @typeParam T - The value type stored by the state.
   * @param key - The registry key used by the named state.
   * @param initialValue - Optional initial value used only when the state does not exist yet.
   * @param options - Optional behavior flags for deep reactivity and tab sync.
   * @returns The existing or newly created named state.
   *
   * @public
   * @remarks
   * `useState` never creates anonymous states. It always operates on the named state registry
   * of the current context.
   *
   * @example
   * ```ts
   * const settings = useState("settings", { theme: "light" });
   * ```
   */
  const useState = <T = any>(
    key: string,
    initialValue?: T,
    options?: SetStateOptions,
  ): StateProps<T> => {
    const existingState = statesRegistry[key] as StateProps<T> | undefined;

    if (existingState) {
      applyStateOptions(existingState, options);

      if (existingState.__syncTabs) {
        ensureChannelListener(existingState.__channelName);
      }

      return existingState;
    }

    const state = createState(initialValue as T, key, options);
    statesRegistry[key] = state;

    if (state.__syncTabs) {
      ensureChannelListener(state.__channelName);
    }

    return state;
  };

  /**
   * Subscribes to one or more reactive states.
   *
   * @param callback - The function executed when any subscribed state changes.
   * @param states - The list of states observed by the watcher.
   * @param options - Controls immediate execution when the watcher is registered.
   * @returns A function that unsubscribes the watcher from all provided states.
   *
   * @public
   * @remarks
   * The callback receives the same state objects passed in `states`, preserving order.
   * With `immediate: true`, the callback runs once as soon as the watcher is registered.
   *
   * @example
   * ```ts
   * const stop = useWatch((userState, countState) => {
   *   console.log(userState.value, countState.value);
   * }, [user, count]);
   *
   * stop();
   * ```
   *
   * @example
   * ```ts
   * useWatch((state) => {
   *   console.log(state.value);
   * }, [counter], { immediate: false });
   * ```
   */
  const useWatch = (
    callback: UseWatchCallback,
    states: StateProps[],
    options?: UseWatchOptions,
  ): (() => void) => {
    const immediate = options?.immediate ?? true;
    const subscriptions: Array<{ state: StateProps; watcher: () => void }> = [];

    states.forEach((state) => {
      const watcher = () => {
        callback(...states);
      };

      state.watch = [...(state.watch || []), watcher];
      subscriptions.push({ state, watcher });
    });

    if (immediate) {
      callback(...states);
    }

    return () => {
      subscriptions.forEach(({ state, watcher }) => {
        state.watch = (state.watch || []).filter((item) => item !== watcher);
      });
    };
  };

  return {
    setState,
    useState,
    useWatch,
  };
};

const defaultContext = createContext();

export const setState = defaultContext.setState;
export const useState = defaultContext.useState;
export const useWatch = defaultContext.useWatch;
