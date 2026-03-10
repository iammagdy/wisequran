

## Add Share App Button to Settings

Add a "شارك التطبيق" (Share App) button in the "حول التطبيق" section, below the description text. Uses the Web Share API with clipboard fallback.

### Implementation — `src/pages/SettingsPage.tsx`

Insert a share button after line 1072 (the description paragraph) inside the About card:

- Add a `Button` with `Share2` icon and text "شارك التطبيق مع أصدقائك"
- On click: use `navigator.share()` with title "Wise QURAN", text "تطبيق القرآن الكريم والأذكار", and URL `https://wisequran.lovable.app`
- Fallback: copy URL to clipboard with `toast.success("تم نسخ الرابط")`
- Import `Share2` from lucide-react (already imported as `Share`) and `Button` component

### Files to modify
- `src/pages/SettingsPage.tsx` — add share button in About section

