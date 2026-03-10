

## Version Display + Changelog + Manual Update Check

### Changes

**1. Create `src/data/changelog.ts`**
- Export `APP_VERSION = "1.5.0"`
- Export `changelog` array with version history entries (version, date, changes[])
- Include entries for v1.5.0 (auto-update, share button, developer card) and v1.0.0 (initial release)

**2. Modify `src/pages/SettingsPage.tsx`**

In the About section, replace the static `v1.0.0` line with:
- Clickable version badge (`APP_VERSION`) that opens a changelog Sheet
- Below it, a "التحقق من التحديثات" (Check for Updates) button that manually triggers the SW update check
- Import `Sheet` components, `ScrollArea`, `APP_VERSION`, `changelog`, and `useServiceWorkerUpdate`

**Version badge**: `bg-primary/10 text-primary rounded-full px-3 py-0.5 cursor-pointer` with `Sparkles` icon. On click → opens Sheet.

**Check for Updates button**: Small outline button with `RefreshCw` icon. On click → calls `registration.update()` via the hook. Shows toast: "التطبيق محدّث بالفعل" if no update, or triggers the existing update notification if one is found.

**Changelog Sheet**: Bottom sheet with title "سجل التحديثات", listing each version with date and bullet points of changes in a `ScrollArea`.

**3. Extend `src/hooks/useServiceWorkerUpdate.ts`**
- Add `checkForUpdate()` as a returned function so it can be called manually from settings
- Return `{ updateAvailable, isUpdating, applyUpdate, checkForUpdate }`

### Files
- Create: `src/data/changelog.ts`
- Modify: `src/pages/SettingsPage.tsx`, `src/hooks/useServiceWorkerUpdate.ts`

