import { describe, it, expect } from "vitest";
import { isValidAudioFile } from "../lib/quran-audio";

function createBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function createTextBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

describe("isValidAudioFile", () => {
  it("should return false for buffers smaller than 4 bytes", () => {
    expect(isValidAudioFile(createBuffer([]))).toBe(false);
    expect(isValidAudioFile(createBuffer([0x49]))).toBe(false);
    expect(isValidAudioFile(createBuffer([0x49, 0x44]))).toBe(false);
    expect(isValidAudioFile(createBuffer([0x49, 0x44, 0x33]))).toBe(false);
  });

  it("should return true for ID3 magic bytes (MP3 with ID3 tag)", () => {
    // 0x49 = 'I', 0x44 = 'D', 0x33 = '3'
    expect(isValidAudioFile(createBuffer([0x49, 0x44, 0x33, 0x03]))).toBe(true);
    expect(isValidAudioFile(createBuffer([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]))).toBe(true);
  });

  it("should return true for MPEG ADTS syncword (MP3 without ID3 tag)", () => {
    // 0xFF and (second byte & 0xE0) === 0xE0
    expect(isValidAudioFile(createBuffer([0xFF, 0xE0, 0x00, 0x00]))).toBe(true);
    expect(isValidAudioFile(createBuffer([0xFF, 0xF3, 0x44, 0x00]))).toBe(true);
    expect(isValidAudioFile(createBuffer([0xFF, 0xFB, 0x18, 0x00]))).toBe(true);
  });

  it("should return true for Ogg magic bytes", () => {
    // 0x4F, 0x67, 0x67, 0x53 = 'O', 'g', 'g', 'S'
    expect(isValidAudioFile(createBuffer([0x4F, 0x67, 0x67, 0x53]))).toBe(true);
    expect(isValidAudioFile(createBuffer([0x4F, 0x67, 0x67, 0x53, 0x00, 0x02]))).toBe(true);
  });

  it("should return false for buffers starting with HTML tags", () => {
    // HTML/Doctype tags
    expect(isValidAudioFile(createTextBuffer("<!doctype html><html>..."))).toBe(false);
    expect(isValidAudioFile(createTextBuffer("<!DOCTYPE HTML PUBLIC..."))).toBe(false);
    expect(isValidAudioFile(createTextBuffer("<html><body>..."))).toBe(false);
    expect(isValidAudioFile(createTextBuffer("<HTML><HEAD>..."))).toBe(false);
    expect(isValidAudioFile(createTextBuffer("<head><title>...</head>"))).toBe(false);
  });

  it("should return true for random binary data that is not HTML", () => {
    // If it's not small, not an explicit audio magic byte, and not HTML, it returns true
    // This handles other valid formats like WAV, FLAC, or unknown binary streams.
    expect(isValidAudioFile(createBuffer([0x00, 0x01, 0x02, 0x03, 0x04]))).toBe(true);
    expect(isValidAudioFile(createTextBuffer("just some random text data"))).toBe(true);
    expect(isValidAudioFile(createTextBuffer("RIFF...WAVEfmt..."))).toBe(true);
  });
});
