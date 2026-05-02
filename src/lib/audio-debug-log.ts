/**
 * Audio diagnostic ring buffer.
 *
 * Captures structured events from the iOS-fragile audio playback chain
 * (Sleep Mode + the shared mobile audio manager) so we can debug
 * "tapped Play, nothing visibly happened" reports from real devices
 * without needing a Mac + cable + Safari Web Inspector.
 *
 * Gating:
 *   - On in dev (`import.meta.env.DEV`).
 *   - On in any build when the URL contains `?debug=audio`.
 *   - On in any build when `localStorage.audioDebug === "1"` (so the user
 *     can persist the flag across PWA launches without losing the URL
 *     when relaunching from the home-screen icon).
 *
 * When OFF: every push() is a tight no-op (one boolean check, no
 * allocations, no DOM, no console).
 *
 * When ON: events are appended to a 200-entry ring buffer AND mirrored
 * to `console.info` with an `[audio-debug]` prefix so Safari Web
 * Inspector also picks them up. Listeners (e.g. the in-app debug panel)
 * are notified on every push.
 */

const MAX_ENTRIES = 200;

export interface AudioDebugEntry {
  id: number;
  ts: number; // performance.now() if available, else Date.now()
  iso: string; // wall-clock ISO timestamp for human reading
  step: string;
  payload?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
}

const entries: AudioDebugEntry[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function readUrlFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("debug") === "audio";
  } catch {
    return false;
  }
}

function readLocalStorageFlag(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem("audioDebug") === "1";
  } catch {
    return false;
  }
}

function readDevFlag(): boolean {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
}

// Captured once at module init so the per-push hot path stays a single
// boolean read. The user can flip the flag at runtime via the panel's
// "Enable persistent debug" button — that calls setEnabled() below to
// update this in place.
let enabled = readDevFlag() || readUrlFlag() || readLocalStorageFlag();

export function isAudioDebugEnabled(): boolean {
  return enabled;
}

/**
 * Test-only: re-evaluate the gate from URL/localStorage/DEV without
 * persisting anything. Lets a vitest case verify the production
 * default (gate is OFF when DEV is off and there's no URL param /
 * localStorage flag).
 */
export function __resetAudioDebugForTests(): void {
  enabled = readDevFlag() || readUrlFlag() || readLocalStorageFlag();
  entries.length = 0;
  nextId = 1;
  for (const listener of listeners) listener();
}

/**
 * Manually flip the gate at runtime. Used by the in-app debug panel to
 * persist the flag to localStorage so it survives PWA cold-starts.
 */
export function setAudioDebugEnabled(value: boolean): void {
  enabled = value;
  if (typeof localStorage !== "undefined") {
    try {
      if (value) {
        localStorage.setItem("audioDebug", "1");
      } else {
        localStorage.removeItem("audioDebug");
      }
    } catch {
      /* ignore — best effort persistence */
    }
  }
  for (const listener of listeners) listener();
}

function nowMs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function safeResolvePayload(
  thunk: () => Record<string, unknown>,
): Record<string, unknown> | undefined {
  try {
    return thunk();
  } catch (err) {
    return { __payloadThunkError: String(err) };
  }
}

function serializeError(err: unknown): AudioDebugEntry["error"] | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  try {
    return { name: "NonError", message: String(err) };
  } catch {
    return { name: "NonError", message: "<unserializable>" };
  }
}

type PayloadInput =
  | Record<string, unknown>
  | (() => Record<string, unknown>)
  | undefined;

/**
 * Append a structured event. NO-OP when debug is off — safe to scatter
 * everywhere in the audio path without measurable production cost.
 *
 * Pass a thunk for `payload` when the payload requires non-trivial
 * computation (string slicing, property reads on hot objects, etc.) —
 * that way the hot path stays a single boolean check when the gate is
 * off. Eager objects are fine for cheap literals like `{ channel }`.
 */
export function audioDebugLog(
  step: string,
  payload?: PayloadInput,
  error?: unknown,
): void {
  if (!enabled) return;
  const resolvedPayload =
    typeof payload === "function" ? safeResolvePayload(payload) : payload;
  const entry: AudioDebugEntry = {
    id: nextId++,
    ts: nowMs(),
    iso: new Date().toISOString(),
    step,
    payload: resolvedPayload,
    error: serializeError(error),
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
  // Mirror to console.info so Safari Web Inspector / Chrome DevTools
  // also see it without needing the in-app panel.
  try {
    if (entry.error) {
      console.info(`[audio-debug] ${step}`, resolvedPayload ?? {}, entry.error);
    } else if (resolvedPayload) {
      console.info(`[audio-debug] ${step}`, resolvedPayload);
    } else {
      console.info(`[audio-debug] ${step}`);
    }
  } catch {
    /* console may be unavailable in some sandboxes */
  }
  for (const listener of listeners) listener();
}

/**
 * Snapshot of the current ring buffer. Returns a defensive copy so
 * React consumers using useSyncExternalStore can rely on referential
 * identity (we hand them a new array only when entries actually change).
 */
export function getAudioDebugEntries(): readonly AudioDebugEntry[] {
  return entries.slice();
}

export function clearAudioDebugEntries(): void {
  entries.length = 0;
  for (const listener of listeners) listener();
}

export function subscribeAudioDebug(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
