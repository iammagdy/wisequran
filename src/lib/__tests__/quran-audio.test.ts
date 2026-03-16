import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAudioFromUrl } from '../quran-audio';

describe('fetchAudioFromUrl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('aborts the request if it takes longer than 90 seconds', async () => {
    // Mock fetch to simulate a slow response that never resolves naturally
    const fetchMock = vi.fn().mockImplementation((url, options) => {
      return new Promise((resolve, reject) => {
        // Listen for the abort signal and reject when it fires
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            // reject immediately so test doesn't time out
            reject(error);
          });
        }
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    // Start the fetch operation
    const fetchPromise = fetchAudioFromUrl('https://example.com/audio.mp3');

    // Make sure we catch the rejection explicitly by awaiting it in expect
    const expectPromise = expect(fetchPromise).rejects.toThrowError('The operation was aborted');

    // Now advance timers to trigger the abort
    await vi.advanceTimersByTimeAsync(90_000);

    // Assert that the promise rejects
    await expectPromise;
    await expect(fetchPromise).rejects.toMatchObject({ name: 'AbortError' });

    // Ensure fetch was called
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/audio.mp3',
      expect.objectContaining({ mode: 'cors' })
    );
  });
});
