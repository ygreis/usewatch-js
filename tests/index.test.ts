import { beforeEach, describe, expect, it, vi } from "vitest";

class FakeBroadcastChannel {
  static channels = new Map<string, Set<FakeBroadcastChannel>>();

  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;

    const subscribers = FakeBroadcastChannel.channels.get(name) ?? new Set<FakeBroadcastChannel>();
    subscribers.add(this);
    FakeBroadcastChannel.channels.set(name, subscribers);
  }

  postMessage(data: unknown) {
    const subscribers = FakeBroadcastChannel.channels.get(this.name) ?? new Set<FakeBroadcastChannel>();

    subscribers.forEach((subscriber) => {
      if (subscriber === this || !subscriber.onmessage) {
        return;
      }

      subscriber.onmessage({ data } as MessageEvent);
    });
  }

  close() {
    const subscribers = FakeBroadcastChannel.channels.get(this.name);

    if (!subscribers) {
      return;
    }

    subscribers.delete(this);

    if (subscribers.size === 0) {
      FakeBroadcastChannel.channels.delete(this.name);
    }
  }

  static reset() {
    FakeBroadcastChannel.channels.clear();
  }
}

const loadModule = async () => {
  vi.resetModules();
  return import("../src/index");
};

beforeEach(() => {
  FakeBroadcastChannel.reset();
  vi.unstubAllGlobals();
});

describe("usewatch-js", () => {
  it("runs watchers immediately and stops after unsubscribe", async () => {
    const { createContext } = await loadModule();
    const { setState, useWatch } = createContext();
    const count = setState(0);
    const callback = vi.fn();

    const stop = useWatch(callback, [count]);

    count.value = 1;
    stop();
    count.value = 2;

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(1, count);
    expect(callback).toHaveBeenNthCalledWith(2, count);
  });

  it("skips the initial callback when immediate is false", async () => {
    const { createContext } = await loadModule();
    const { setState, useWatch } = createContext();
    const count = setState(0);
    const callback = vi.fn();

    useWatch(callback, [count], { immediate: false });
    count.value = 1;

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(count);
  });

  it("reuses named states inside the same context", async () => {
    const { createContext } = await loadModule();
    const { setState, useState } = createContext();
    const session = setState("session", { loggedIn: false });
    const sameSession = useState<{ loggedIn: boolean }>("session");

    session.value = { loggedIn: true };

    expect(sameSession).toBe(session);
    expect(sameSession.value.loggedIn).toBe(true);
  });

  it("supports deep mutations for nested objects and arrays by default", async () => {
    const { createContext } = await loadModule();
    const { setState, useWatch } = createContext();
    const state = setState({
      items: ["a"],
      profile: {
        stats: {
          score: 0,
        },
      },
    });
    const callback = vi.fn();

    useWatch(callback, [state], { immediate: false });

    state.value.items.push("b");
    state.value.profile.stats.score = 1;

    expect(callback.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(state.value.items).toEqual(["a", "b"]);
    expect(state.value.profile.stats.score).toBe(1);
  });

  it("can disable deep reactivity", async () => {
    const { createContext } = await loadModule();
    const { setState, useWatch } = createContext();
    const state = setState(
      {
        profile: {
          name: "Ada",
        },
      },
      { deep: false },
    );
    const callback = vi.fn();

    useWatch(callback, [state], { immediate: false });

    state.value.profile.name = "Grace";
    expect(callback).not.toHaveBeenCalled();

    state.value = {
      profile: {
        name: "Grace",
      },
    };

    expect(callback).toHaveBeenCalled();
  });

  it("keeps named states isolated across contexts", async () => {
    const { createContext } = await loadModule();
    const left = createContext();
    const right = createContext();
    const leftState = left.useState("shared-key", { count: 0 });
    const rightState = right.useState("shared-key", { count: 0 });
    const leftWatcher = vi.fn();
    const rightWatcher = vi.fn();

    left.useWatch(leftWatcher, [leftState], { immediate: false });
    right.useWatch(rightWatcher, [rightState], { immediate: false });

    leftState.value.count += 1;

    expect(leftWatcher).toHaveBeenCalled();
    expect(rightWatcher).not.toHaveBeenCalled();
    expect(leftState).not.toBe(rightState);
    expect(rightState.value.count).toBe(0);
  });

  it("passes states to multi-watch callbacks in the same order", async () => {
    const { createContext } = await loadModule();
    const { setState, useWatch } = createContext();
    const user = setState({ name: "Ada" });
    const counter = setState(0);
    const callback = vi.fn();

    useWatch(callback, [user, counter], { immediate: false });
    counter.value += 1;

    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(user, counter);
  });

  it("exposes the default API from the default context", async () => {
    const { setState, useState, useWatch } = await loadModule();
    const key = `default-state-${Date.now()}`;
    const primary = setState(key, { count: 0 });
    const mirrored = useState<{ count: number }>(key);
    const callback = vi.fn();

    useWatch(callback, [primary], { immediate: false });
    mirrored.value.count += 1;

    expect(mirrored).toBe(primary);
    expect(primary.value.count).toBe(1);
    expect(callback).toHaveBeenCalled();
  });

  it("syncs named states across contexts with BroadcastChannel", async () => {
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);

    const { createContext } = await loadModule();
    const left = createContext();
    const right = createContext();
    const channelName = "usewatch-js-test";
    const leftState = left.useState("shared-sync", { count: 0, nested: { label: "draft" } }, {
      syncTabs: true,
      channelName,
    });
    const rightState = right.useState("shared-sync", { count: 0, nested: { label: "draft" } }, {
      syncTabs: true,
      channelName,
    });
    const rightWatcher = vi.fn();

    right.useWatch(rightWatcher, [rightState], { immediate: false });

    leftState.value.count = 3;
    leftState.value.nested.label = "published";

    expect(rightState.value).toEqual({
      count: 3,
      nested: {
        label: "published",
      },
    });
    expect(rightWatcher).toHaveBeenCalledTimes(2);
  });
});
