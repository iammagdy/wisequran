import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadSurahAudio } from "./quran-audio";
import * as db from "./db";
import * as reciters from "./reciters";

vi.mock("./db", () => ({
  checkStorageQuota: vi.fn(),
  saveAudio: vi.fn(),
  getAudio: vi.fn(),
  deleteAudio: vi.fn(() => Promise.resolve()),
}));

vi.mock("./reciters", () => ({
  getReciterAudioUrls: vi.fn(),
  getReciterAudioUrl: vi.fn(),
}));

describe("downloadSurahAudio", () => {
  const mockReciterId = "mishary";
  const mockSurahNumber = 1;

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it("throws an error if storage quota > 95%", async () => {
    vi.mocked(db.checkStorageQuota).mockResolvedValue({
      usage: 9600,
      quota: 10000,
      available: 400,
      percentUsed: 96,
      hasEnoughSpace: vi.fn().mockReturnValue(true),
    });

    await expect(downloadSurahAudio(mockReciterId, mockSurahNumber)).rejects.toThrow(
      "مساحة التخزين ممتلئة تقريباً. يرجى حذف بعض البيانات أولاً"
    );

    expect(db.checkStorageQuota).toHaveBeenCalled();
    expect(reciters.getReciterAudioUrls).not.toHaveBeenCalled();
  });

  it("throws an error if all URLs fail to download", async () => {
    vi.mocked(db.checkStorageQuota).mockResolvedValue({
      usage: 1000,
      quota: 10000,
      available: 9000,
      percentUsed: 10,
      hasEnoughSpace: vi.fn().mockReturnValue(true),
    });

    vi.mocked(reciters.getReciterAudioUrls).mockResolvedValue([
      "http://example.com/audio1.mp3",
      "http://example.com/audio2.mp3",
    ]);

    // Mock fetch to reject for all requests
    const fetchError = new Error("Network error");
    vi.mocked(global.fetch).mockRejectedValue(fetchError);

    await expect(downloadSurahAudio(mockReciterId, mockSurahNumber)).rejects.toThrow(
      "فشل تحميل الصوت من جميع المصادر: Network error"
    );

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(db.deleteAudio).toHaveBeenCalledTimes(2); // Cleanup should be called on failure
  });

  it("handles QuotaExceededError during saveAudio", async () => {
    vi.mocked(db.checkStorageQuota).mockResolvedValue({
      usage: 1000,
      quota: 10000,
      available: 9000,
      percentUsed: 10,
      hasEnoughSpace: vi.fn().mockReturnValue(true),
    });

    vi.mocked(reciters.getReciterAudioUrls).mockResolvedValue([
      "http://example.com/audio1.mp3",
    ]);

    // Create a mock valid audio buffer (starts with ID3)
    const mockAudioData = new Uint8Array(10_240);
    mockAudioData[0] = 0x49; // 'I'
    mockAudioData[1] = 0x44; // 'D'
    mockAudioData[2] = 0x33; // '3'
    const mockBuffer = mockAudioData.buffer;

    // Mock fetch to return the valid audio buffer
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      headers: {
        get: (key: string) => {
          if (key === "Content-Type") return "audio/mpeg";
          if (key === "Content-Length") return mockBuffer.byteLength.toString();
          return null;
        },
      },
      arrayBuffer: () => Promise.resolve(mockBuffer),
    } as unknown as Response);

    const quotaError = new Error("Quota exceeded");
    quotaError.name = "QuotaExceededError";
    vi.mocked(db.saveAudio).mockRejectedValue(quotaError);

    await expect(downloadSurahAudio(mockReciterId, mockSurahNumber)).rejects.toThrow(
      "فشل تحميل الصوت من جميع المصادر: تم تجاوز حد التخزين المسموح. يرجى حذف بعض الملفات"
    );

    expect(db.saveAudio).toHaveBeenCalled();
    expect(db.deleteAudio).toHaveBeenCalled(); // Cleanup
  });

  it("throws an error if downloaded file is too small", async () => {
    vi.mocked(db.checkStorageQuota).mockResolvedValue({
      usage: 1000,
      quota: 10000,
      available: 9000,
      percentUsed: 10,
      hasEnoughSpace: vi.fn().mockReturnValue(true),
    });

    vi.mocked(reciters.getReciterAudioUrls).mockResolvedValue([
      "http://example.com/audio1.mp3",
    ]);

    // Create a mock buffer that is too small (< MIN_AUDIO_SIZE which is 10_240)
    const smallBuffer = new Uint8Array(1000).buffer;

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      headers: {
        get: (key: string) => {
          if (key === "Content-Type") return "audio/mpeg";
          return null;
        },
      },
      arrayBuffer: () => Promise.resolve(smallBuffer),
    } as unknown as Response);

    await expect(downloadSurahAudio(mockReciterId, mockSurahNumber)).rejects.toThrow(
      "فشل تحميل الصوت من جميع المصادر" // Falls through to the end since the loop continues
    );

    // saveAudio shouldn't be called because size check fails early
    expect(db.saveAudio).not.toHaveBeenCalled();
  });

  it("throws an error if not enough space according to hasEnoughSpace", async () => {
      vi.mocked(db.checkStorageQuota).mockResolvedValue({
        usage: 1000,
        quota: 10000,
        available: 9000,
        percentUsed: 10,
        hasEnoughSpace: vi.fn().mockReturnValue(false), // Returns false
      });

      vi.mocked(reciters.getReciterAudioUrls).mockResolvedValue([
        "http://example.com/audio1.mp3",
      ]);

      // Create a mock valid audio buffer
      const mockAudioData = new Uint8Array(10_240);
      mockAudioData[0] = 0x49; // 'I'
      mockAudioData[1] = 0x44; // 'D'
      mockAudioData[2] = 0x33; // '3'
      const mockBuffer = mockAudioData.buffer;

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        headers: {
          get: (key: string) => {
            if (key === "Content-Type") return "audio/mpeg";
            return null;
          },
        },
        arrayBuffer: () => Promise.resolve(mockBuffer),
      } as unknown as Response);

      await expect(downloadSurahAudio(mockReciterId, mockSurahNumber)).rejects.toThrow(
        "فشل تحميل الصوت من جميع المصادر: مساحة التخزين غير كافية لحفظ هذا الملف"
      );
  });
});
