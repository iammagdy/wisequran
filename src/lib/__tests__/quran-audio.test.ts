import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveAudioSource } from '../quran-audio';
import { getAudio } from '../db';
import { getReciterAudioUrl } from '../reciters';

// Mock the dependencies
vi.mock('../db', () => ({
  getAudio: vi.fn(),
  saveAudio: vi.fn(),
  deleteAudio: vi.fn(),
  checkStorageQuota: vi.fn(),
}));

vi.mock('../reciters', () => ({
  getReciterAudioUrl: vi.fn(),
  getReciterAudioUrls: vi.fn(),
}));

describe('resolveAudioSource', () => {
  const mockReciterId = 'mishary';
  const mockSurahNumber = 1;
  let originalOnLine: boolean;
  let createObjectURLMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Save original navigator.onLine
    originalOnLine = navigator.onLine;

    // Mock URL.createObjectURL
    createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/mock-url');
    global.URL.createObjectURL = createObjectURLMock;

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
    });

    // Clean up URL mock
    // global.URL.createObjectURL is restored if we don't need it, but it's okay to leave it mocked for jsdom
  });

  const setNavigatorOnLine = (value: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      value: value,
      writable: true,
    });
  };

  it('should return cached audio URL when audio is found in DB', async () => {
    // Arrange
    const mockAudioData = new ArrayBuffer(8);
    vi.mocked(getAudio).mockResolvedValueOnce({
      reciterId: mockReciterId,
      surahNumber: mockSurahNumber,
      data: mockAudioData,
      timestamp: Date.now(),
    });

    // Act
    const result = await resolveAudioSource(mockReciterId, mockSurahNumber);

    // Assert
    expect(getAudio).toHaveBeenCalledWith(mockReciterId, mockSurahNumber);
    expect(createObjectURLMock).toHaveBeenCalled();
    // The first argument should be a Blob
    const blobArg = createObjectURLMock.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe('audio/mpeg');

    expect(result).toEqual({
      url: 'blob:http://localhost/mock-url',
      cached: true,
    });

    // Network should not be checked or used
    expect(getReciterAudioUrl).not.toHaveBeenCalled();
  });

  it('should return online URL when audio is not cached and user is online', async () => {
    // Arrange
    vi.mocked(getAudio).mockResolvedValueOnce(undefined);
    setNavigatorOnLine(true);

    const mockNetworkUrl = 'https://example.com/audio.mp3';
    vi.mocked(getReciterAudioUrl).mockResolvedValueOnce(mockNetworkUrl);

    // Act
    const result = await resolveAudioSource(mockReciterId, mockSurahNumber);

    // Assert
    expect(getAudio).toHaveBeenCalledWith(mockReciterId, mockSurahNumber);
    expect(getReciterAudioUrl).toHaveBeenCalledWith(mockReciterId, mockSurahNumber);
    expect(createObjectURLMock).not.toHaveBeenCalled();

    expect(result).toEqual({
      url: mockNetworkUrl,
      cached: false,
    });
  });

  it('should return null when audio is not cached and user is offline', async () => {
    // Arrange
    vi.mocked(getAudio).mockResolvedValueOnce(undefined);
    setNavigatorOnLine(false);

    // Act
    const result = await resolveAudioSource(mockReciterId, mockSurahNumber);

    // Assert
    expect(getAudio).toHaveBeenCalledWith(mockReciterId, mockSurahNumber);
    expect(getReciterAudioUrl).not.toHaveBeenCalled();
    expect(createObjectURLMock).not.toHaveBeenCalled();

    expect(result).toBeNull();
  });
});
