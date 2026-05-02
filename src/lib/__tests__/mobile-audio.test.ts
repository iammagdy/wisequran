import { describe, it, expect, vi, beforeEach } from "vitest";

type AudioInstance = {
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  removeAttribute: ReturnType<typeof vi.fn>;
  setAttribute: ReturnType<typeof vi.fn>;
  src: string;
  currentSrc: string;
  currentTime: number;
  muted: boolean;
  volume: number;
  paused: boolean;
  preload: string;
  crossOrigin: string | null;
  playsInline: boolean;
};

function createAudioInstance(): AudioInstance {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    removeAttribute: vi.fn(),
    setAttribute: vi.fn(),
    src: "",
    currentSrc: "",
    currentTime: 0,
    muted: false,
    volume: 1,
    paused: true,
    preload: "",
    crossOrigin: null,
    playsInline: false,
  };
}

describe("mobileAudioManager.prime() / stop() interplay", () => {
  let instance: AudioInstance;

  beforeEach(() => {
    vi.resetModules();
    instance = createAudioInstance();
    vi.stubGlobal("Audio", vi.fn(() => instance));
  });

  it("re-runs the silent-MP3 prime after stop(channel, true) clears the primed state", async () => {
    const { mobileAudioManager } = await import("../mobile-audio");

    await mobileAudioManager.prime("preview");
    expect(instance.play).toHaveBeenCalledTimes(1);

    // Second prime call on the same channel must short-circuit
    // (channel is still primed, no fresh user gesture lost).
    await mobileAudioManager.prime("preview");
    expect(instance.play).toHaveBeenCalledTimes(1);

    // stop with resetSource=true must clear the primed state so the
    // next prime call actually re-runs the silent-MP3 unlock — this
    // is what restores iOS user-activation on the audio element after
    // its src was cleared.
    mobileAudioManager.stop("preview", true);

    await mobileAudioManager.prime("preview");
    expect(instance.play).toHaveBeenCalledTimes(2);
  });

  it("does NOT clear primed state on stop(channel) without resetSource", async () => {
    const { mobileAudioManager } = await import("../mobile-audio");

    await mobileAudioManager.prime("preview");
    expect(instance.play).toHaveBeenCalledTimes(1);

    mobileAudioManager.stop("preview");

    await mobileAudioManager.prime("preview");
    // No re-prime: the audio element still has its src and remains
    // user-activated, so prime() correctly short-circuits.
    expect(instance.play).toHaveBeenCalledTimes(1);
  });
});

describe("audioDebugLog (gated by URL / localStorage / dev)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("is a no-op when the gate is off and a working sink when enabled", async () => {
    const { audioDebugLog, getAudioDebugEntries, clearAudioDebugEntries, setAudioDebugEnabled } =
      await import("../audio-debug-log");

    // Vitest runs with `import.meta.env.DEV === true`, so the module
    // initializes with the gate ON. Explicitly disable it for the
    // first half of this assertion.
    setAudioDebugEnabled(false);
    clearAudioDebugEntries();
    audioDebugLog("test.disabled.event", { foo: 1 });
    expect(getAudioDebugEntries()).toHaveLength(0);

    setAudioDebugEnabled(true);
    audioDebugLog("test.enabled.event", { foo: 2 });
    audioDebugLog("test.enabled.error", undefined, new Error("boom"));

    const entries = getAudioDebugEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].step).toBe("test.enabled.event");
    expect(entries[0].payload).toEqual({ foo: 2 });
    expect(entries[1].step).toBe("test.enabled.error");
    expect(entries[1].error?.message).toBe("boom");

    clearAudioDebugEntries();
    expect(getAudioDebugEntries()).toHaveLength(0);

    setAudioDebugEnabled(false);
  });

  it("supports lazy thunk payloads (zero allocation on the OFF path)", async () => {
    const { audioDebugLog, getAudioDebugEntries, clearAudioDebugEntries, setAudioDebugEnabled } =
      await import("../audio-debug-log");
    setAudioDebugEnabled(false);
    clearAudioDebugEntries();

    let thunkInvocations = 0;
    const buildPayload = () => {
      thunkInvocations += 1;
      return { computed: "expensive" };
    };

    audioDebugLog("test.thunk.off", buildPayload);
    expect(thunkInvocations).toBe(0); // OFF path must not invoke the thunk
    expect(getAudioDebugEntries()).toHaveLength(0);

    setAudioDebugEnabled(true);
    audioDebugLog("test.thunk.on", buildPayload);
    expect(thunkInvocations).toBe(1);
    expect(getAudioDebugEntries()[0].payload).toEqual({ computed: "expensive" });

    setAudioDebugEnabled(false);
  });

  it("instruments mobileAudioManager.play() with enter / resolved events when enabled", async () => {
    const { setAudioDebugEnabled, getAudioDebugEntries, clearAudioDebugEntries } =
      await import("../audio-debug-log");
    setAudioDebugEnabled(true);
    clearAudioDebugEntries();

    const audioStub = createAudioInstance();
    vi.stubGlobal("Audio", vi.fn(() => audioStub));
    const { mobileAudioManager } = await import("../mobile-audio");

    await mobileAudioManager.play("preview", "https://example.test/song.mp3");

    const steps = getAudioDebugEntries().map((e) => e.step);
    expect(steps).toContain("mobileAudioManager.play:enter");
    expect(steps).toContain("mobileAudioManager.play:srcAssigned");
    expect(steps).toContain("mobileAudioManager.play:firstPlayResolved");

    setAudioDebugEnabled(false);
  });

  // The "no silent black hole" invariant: every `play:enter` must be
  // followed by a terminal event (`firstPlayResolved`, `retryResolved`,
  // `firstPlayRejected`+`retryRejected`, or a thrown rejection). If a
  // future refactor drops the catch-and-log on either retry path, this
  // test catches the regression — that's exactly the failure shape the
  // user is seeing on iPhone today.
  it("preserves the failure-mode invariant: rejection is observable, not swallowed", async () => {
    const { setAudioDebugEnabled, getAudioDebugEntries, clearAudioDebugEntries } =
      await import("../audio-debug-log");
    setAudioDebugEnabled(true);
    clearAudioDebugEntries();

    const failingAudio = createAudioInstance();
    failingAudio.play = vi.fn(() => Promise.reject(new Error("NotAllowedError")));
    vi.stubGlobal("Audio", vi.fn(() => failingAudio));
    const { mobileAudioManager } = await import("../mobile-audio");

    let caught: unknown = null;
    try {
      await mobileAudioManager.play("preview", "https://example.test/song.mp3", {
        retryDelayMs: 0,
      });
    } catch (err) {
      caught = err;
    }

    // Invariant 1: failure is propagated to the caller (no silent swallow).
    expect(caught).toBeInstanceOf(Error);

    // Invariant 2: the audio-debug log has BOTH the entry event and a
    // terminal rejection event. If either side is missing, the trace
    // becomes ambiguous and the diagnostic loses its value.
    const steps = getAudioDebugEntries().map((e) => e.step);
    expect(steps).toContain("mobileAudioManager.play:enter");
    expect(steps).toContain("mobileAudioManager.play:firstPlayRejected");
    expect(steps).toContain("mobileAudioManager.play:retryRejected");

    setAudioDebugEnabled(false);
  });
});

describe("configurePlaybackAudioSession", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("re-applies navigator.audioSession.type on every call (no module-level latch)", async () => {
    const setterSpy = vi.fn();
    const sessionStub = {} as { type?: string };
    Object.defineProperty(sessionStub, "type", {
      configurable: true,
      get: () => "playback",
      set: setterSpy,
    });
    Object.defineProperty(globalThis.navigator, "audioSession", {
      configurable: true,
      value: sessionStub,
      writable: true,
    });

    const { configurePlaybackAudioSession } = await import("../mobile-audio");

    configurePlaybackAudioSession();
    configurePlaybackAudioSession();
    configurePlaybackAudioSession();

    expect(setterSpy).toHaveBeenCalledTimes(3);
    expect(setterSpy).toHaveBeenNthCalledWith(1, "playback");
    expect(setterSpy).toHaveBeenNthCalledWith(2, "playback");
    expect(setterSpy).toHaveBeenNthCalledWith(3, "playback");

    // Cleanup so other tests don't see the stub.
    delete (globalThis.navigator as Navigator & { audioSession?: unknown }).audioSession;
  });
});
