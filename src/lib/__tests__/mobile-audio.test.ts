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
