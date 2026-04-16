import { changelog as staticChangelog, type ChangelogEntry } from "@/data/changelog";

export const DEVKIT_CHANGELOG_KEY = "wise-devkit-changelog";

export function getDevkitChangelog(): ChangelogEntry[] {
  try {
    const raw = localStorage.getItem(DEVKIT_CHANGELOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChangelogEntry[]) : [];
  } catch {
    return [];
  }
}

export function setDevkitChangelog(entries: ChangelogEntry[]): void {
  localStorage.setItem(DEVKIT_CHANGELOG_KEY, JSON.stringify(entries));
  window.dispatchEvent(
    new CustomEvent("local-storage-sync", {
      detail: { key: DEVKIT_CHANGELOG_KEY },
    }),
  );
}

/**
 * DevKit-authored entries come first (highest version), then static entries
 * that don't share a version with any DevKit entry.
 */
export function getMergedChangelog(): ChangelogEntry[] {
  const devkit = getDevkitChangelog();
  const devkitVersions = new Set(devkit.map((e) => e.version));
  const filtered = staticChangelog.filter((e) => !devkitVersions.has(e.version));
  return [...devkit, ...filtered];
}
