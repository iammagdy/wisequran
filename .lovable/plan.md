

## Redesign Developer Card with Ramadan Vibes

### Current State
The card has a gradient border, static moon/star ornaments at low opacity, and plain text layout. It looks flat and generic.

### New Design

Replace lines 1165-1217 with a richly animated, Ramadan-themed developer card:

**Visual Enhancements:**
- Animated floating lantern, crescent, and star emojis (🏮🌙⭐✨🕌) using `motion.span` with float/pulse animations at varying delays
- Shimmer overlay gradient across the card background
- Larger decorative elements with better opacity and positioning
- "صنع بـ ❤️ في رمضان" (Made with ❤️ in Ramadan) tagline
- Developer name with a subtle glow effect
- "المطوّر" label styled as a small gold badge/pill
- Social links with scale hover animation and gold gradient backgrounds
- Animated border with faster, more vibrant gradient cycling

**Animations (using framer-motion):**
- Floating emojis: `y: [0, -8, 0]` with staggered delays and infinite repeat
- Card entrance: spring animation with slight bounce
- Social icons: `whileHover={{ scale: 1.15 }}` and `whileTap={{ scale: 0.95 }}`
- Subtle background pattern shimmer

### File Modified
- `src/pages/SettingsPage.tsx` — lines 1165-1217 replaced with enhanced card

