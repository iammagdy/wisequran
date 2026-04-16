#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "data", "wbw");

const SURAHS = [1, ...Array.from({ length: 37 }, (_, i) => 78 + i)];

async function fetchSurah(n) {
  const url = `https://api.quran.com/api/v4/verses/by_chapter/${n}?words=true&word_fields=text_uthmani&per_page=300`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for surah ${n}`);
  const json = await res.json();
  const out = { surah: n, ayahs: {} };
  for (const verse of json.verses) {
    const ayahNum = verse.verse_number;
    const words = [];
    let pos = 1;
    for (const w of verse.words) {
      if (w.char_type_name !== "word") continue;
      words.push({
        p: pos,
        a: w.text_uthmani || w.text,
        t: (w.translation && w.translation.text) || "",
        tr: (w.transliteration && w.transliteration.text) || "",
      });
      pos += 1;
    }
    out.ayahs[String(ayahNum)] = words;
  }
  return out;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const supported = [];
  for (const n of SURAHS) {
    process.stdout.write(`fetching surah ${n}... `);
    try {
      const data = await fetchSurah(n);
      await writeFile(join(OUT_DIR, `${n}.json`), JSON.stringify(data));
      supported.push(n);
      console.log("ok");
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  await writeFile(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify({ supportedSurahs: supported }, null, 2),
  );
  console.log(`\nDone. ${supported.length} surahs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
