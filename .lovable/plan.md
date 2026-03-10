

## Developer Card in Settings

Add a developer credit card after the "حول التطبيق" section with Ramadan-themed border styling.

### Design
- Card with animated golden/crescent border (Ramadan vibes — gradient border using gold + primary colors, with a subtle crescent moon ornament)
- Name: **Magdy Saber**
- Title below name: **المطور** (The Developer)
- Three clickable icon buttons in a row:
  - **Email**: `mailto:contact@magdysaber.com` (Mail icon)
  - **GitHub**: `https://github.com/iammagdy` (Github icon)
  - **Website**: `https://magdysaber.com` (Globe icon)

### Implementation — `src/pages/SettingsPage.tsx`

Insert a new `<section>` after the "حول التطبيق" section (before closing `</div>`s at line 1075):

- Import `Mail, Github, Globe` from lucide-react
- Card with `border-2` using a gradient border effect (CSS `border-image` with gold-to-primary gradient) + `rounded-2xl`
- Subtle crescent moon emoji or icon as decoration
- Motion animation consistent with other sections
- Icon buttons as `<a>` tags with `target="_blank"` for GitHub/website, `mailto:` for email
- Each icon button: rounded-full bg with hover effect

### Border Ramadan Style
Use a wrapper div with `background: linear-gradient(gold, primary)` and inner div with `bg-card` to create a gradient border effect, plus small star/crescent decorations.

