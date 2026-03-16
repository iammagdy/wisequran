import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadSurahAudio } from "./quran-audio";
import * as db from "./db";
import * as reciters from "./reciters";

// Mock dependencies
vi.mock("./db", () => ({
  checkStorageQuota: vi.fn(),
  saveAudio: vi.fn(),
  getAudio: vi.fn(),
  deleteAudio: vi.fn(),
}));

vi.mock("./reciters", () => ({
  getReciterAudioUrls: vi.fn(),
  getReciterAudioUrl: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe("downloadSurahAudio", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should handle QuotaExceededError during saveAudio", async () => {
    // 1. Setup mock returns
    const mockStorageCheck = {
      percentUsed: 50,
      hasEnoughSpace: vi.fn().mockReturnValue(true),
    };
    vi.mocked(db.checkStorageQuota).mockResolvedValue(mockStorageCheck as any);

    vi.mocked(reciters.getReciterAudioUrls).mockResolvedValue([
      "http://example.com/audio1.mp3",
    ]);

    // Create a mock buffer that looks like valid audio (ID3 header)
    const validAudioHeader = new Uint8Array([0x49, 0x44, 0x33, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    // Make it large enough to pass MIN_AUDIO_SIZE (10240)
    const mockBuffer = new Uint8Array(10240);
    mockBuffer.set(validAudioHeader);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "Content-Length": "10240" }),
      arrayBuffer: () => Promise.resolve(mockBuffer.buffer),
    } as any);

    // Mock saveAudio to throw QuotaExceededError
    const quotaError = new Error("QuotaExceededError");
    quotaError.name = "QuotaExceededError";
    vi.mocked(db.saveAudio).mockRejectedValue(quotaError);

    // Mock deleteAudio to return a resolved promise since the code chains .catch() on it
    vi.mocked(db.deleteAudio).mockResolvedValue(undefined as any);

    // 2. Execute & Verify
    await expect(downloadSurahAudio("ar.alafasy", 1)).rejects.toThrow(
      "فشل تحميل الصوت من جميع المصادر: تم تجاوز حد التخزين المسموح. يرجى حذف بعض الملفات"
    );

    expect(db.saveAudio).toHaveBeenCalledTimes(1);
    expect(db.deleteAudio).toHaveBeenCalledTimes(1); // Should try to cleanup
  });
});
