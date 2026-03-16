import { type IDBPDatabase } from "idb";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyAllAudio } from "./db";

const mockGetAll = vi.fn();
const mockDelete = vi.fn();

vi.mock("idb", () => {
  return {
    openDB: vi.fn().mockResolvedValue({
      getAll: (...args: unknown[]) => mockGetAll(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      objectStoreNames: { contains: vi.fn() },
      createObjectStore: vi.fn(),
      deleteObjectStore: vi.fn(),
      put: vi.fn(),
      get: vi.fn(),
      getAllKeys: vi.fn(),
      clear: vi.fn(),
    } as unknown as IDBPDatabase),
  };
});

describe("verifyAllAudio", () => {
  beforeEach(() => {
    mockGetAll.mockReset();
    mockDelete.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return all valid surahs and no broken surahs when all files are valid", async () => {
    const reciterId = "mishary";
    mockGetAll.mockResolvedValue([
      { id: "mishary-1", reciterId: "mishary", surahNumber: 1, data: new ArrayBuffer(10) },
      { id: "mishary-2", reciterId: "mishary", surahNumber: 2, data: new ArrayBuffer(20) },
    ]);

    const result = await verifyAllAudio(reciterId);

    expect(result.valid).toEqual([1, 2]);
    expect(result.broken).toEqual([]);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should return broken surahs and delete them when array buffer is empty", async () => {
    const reciterId = "mishary";
    mockGetAll.mockResolvedValue([
      { id: "mishary-1", reciterId: "mishary", surahNumber: 1, data: new ArrayBuffer(10) },
      { id: "mishary-2", reciterId: "mishary", surahNumber: 2, data: new ArrayBuffer(0) }, // Broken
      { id: "mishary-3", reciterId: "mishary", surahNumber: 3, data: new ArrayBuffer(5) },
    ]);

    const result = await verifyAllAudio(reciterId);

    expect(result.valid).toEqual([1, 3]);
    expect(result.broken).toEqual([2]);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith("audio", "mishary-2");
  });

  it("should return broken surahs and delete them when data is null/undefined", async () => {
    const reciterId = "mishary";
    mockGetAll.mockResolvedValue([
      { id: "mishary-1", reciterId: "mishary", surahNumber: 1, data: null }, // Broken
      { id: "mishary-2", reciterId: "mishary", surahNumber: 2, data: undefined }, // Broken
      { id: "mishary-3", reciterId: "mishary", surahNumber: 3, data: new ArrayBuffer(15) },
    ]);

    const result = await verifyAllAudio(reciterId);

    expect(result.valid).toEqual([3]);
    expect(result.broken).toEqual([1, 2]);
    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(mockDelete).toHaveBeenCalledWith("audio", "mishary-1");
    expect(mockDelete).toHaveBeenCalledWith("audio", "mishary-2");
  });

  it("should only process audio for the specified reciter", async () => {
    const reciterId = "mishary";
    mockGetAll.mockResolvedValue([
      { id: "mishary-1", reciterId: "mishary", surahNumber: 1, data: new ArrayBuffer(10) },
      { id: "sudais-1", reciterId: "sudais", surahNumber: 1, data: new ArrayBuffer(0) }, // Broken but different reciter
      { id: "mishary-2", reciterId: "mishary", surahNumber: 2, data: new ArrayBuffer(0) }, // Broken and correct reciter
    ]);

    const result = await verifyAllAudio(reciterId);

    expect(result.valid).toEqual([1]);
    expect(result.broken).toEqual([2]);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith("audio", "mishary-2");
  });

  it("should return empty arrays when no audio exists", async () => {
    const reciterId = "mishary";
    mockGetAll.mockResolvedValue([]);

    const result = await verifyAllAudio(reciterId);

    expect(result.valid).toEqual([]);
    expect(result.broken).toEqual([]);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
