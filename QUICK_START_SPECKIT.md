# Spec-Kit Quick Start Guide

## ⚡ Start Here (2 minutes)

### 1. Spec-Kit is Installed ✅
You can now use specification-driven development!

### 2. You Have Ready-Made Specs 📋

**File:** `.speckit/specs/fix-critical-ui-issues.md`

This spec details the 5 critical UI/accessibility issues:
1. Touch target sizing (44x44px minimum)
2. Navigation responsive design (small screens)
3. Text sizing (12px minimum)
4. Audio bar safe area conflicts
5. Motion reduction support

### 3. Start Fixing Issues 🚀

**Copy this and ask Claude Code:**

```
I have a specification in .speckit/specs/fix-critical-ui-issues.md
that details the critical UI accessibility issues.

Can you:
1. Review the specification
2. Create an implementation plan
3. Implement the fixes according to the spec
4. Verify all acceptance criteria are met

Start with the touch target sizing issue first (44x44px minimum).
```

---

## How It Works

```
Spec (what to build) → Plan (how to build) → Implementation (building it)
```

The spec tells Claude **what** should be fixed and **how to verify** it's correct.

---

## Key Files

| File | Purpose |
|------|---------|
| **UI_ANALYSIS_REPORT.md** | 35+ UI issues found in your app |
| **.speckit/specs/fix-critical-ui-issues.md** | P0 issues ready to fix |
| **.speckit/constitution.md** | Your project standards |
| **SPECKIT_SETUP.md** | Full integration guide |

---

## 5 Critical Issues to Fix

From the spec (in priority order):

### 1. Touch Targets (Severity: HIGH)
- Issue: Buttons are 36x36px, need 44x44px minimum
- Components: GlobalAudioBar, navigation buttons
- Impact: Users with motor impairments can't tap buttons

### 2. Bottom Navigation Overflow (Severity: HIGH)
- Issue: Navigation bar doesn't fit on 375px screens
- Components: BottomNav
- Impact: Labels unreadable on small phones

### 3. Text Too Small (Severity: HIGH)
- Issue: Text scales to 10px minimum (need 12px)
- Components: Navigation labels, helper text
- Impact: Low-vision users can't read text

### 4. Audio Bar Positioning (Severity: HIGH)
- Issue: May overlap navigation on notched devices
- Components: GlobalAudioBar, AppShell
- Impact: Layout broken on iPhone 13+

### 5. No Motion Reduction (Severity: MEDIUM)
- Issue: No `prefers-reduced-motion` support
- Components: Animations throughout
- Impact: Motion-sensitive users experience discomfort

---

## Implementation Steps

### Step 1: Copy & Paste Your Prompt ✅
Use the prompt above to ask Claude to start fixing issues.

### Step 2: Review the Plan 📋
Claude will create an implementation plan. Review it and give feedback if needed.

### Step 3: Let Claude Implement 💻
Claude will update the code according to the plan.

### Step 4: Test & Verify 🧪
Test the fixes on a real phone (or use DevTools):
- ✅ Try iPhone SE at 375px width
- ✅ Click all buttons (they should be easy to tap)
- ✅ Zoom to 200% (text should be readable)
- ✅ Check with a screen reader

---

## Example: Fix Touch Targets First

### Your Prompt:
```
Looking at .speckit/specs/fix-critical-ui-issues.md,
let's fix the touch target issue first.

From the spec, the problem is:
- GlobalAudioBar close button is 36x36px
- Navigation buttons are too small
- Several interactive elements don't meet 44x44px minimum

Create an implementation plan to:
1. Audit all interactive elements
2. Identify which ones are too small
3. Fix them to 44x44px minimum
4. Ensure no visual regression

Then implement the fixes.
```

### Claude Will:
1. Review the spec's requirements
2. Find all buttons/interactive elements
3. Identify which are too small
4. Create a plan with file changes
5. Implement the changes
6. Verify against spec acceptance criteria

### You Verify:
```bash
# Test on real device or Chrome DevTools
# Set viewport to iPhone SE (375px)
# Try clicking all buttons
# They should be easy to tap (44x44px minimum)
```

---

## What Gets Fixed

When you ask Claude to implement using the spec:

✅ **Accessibility Fixed**
- Touch targets 44x44px minimum
- Text size 12px minimum
- High contrast colors
- Motion reduction support

✅ **Responsive Fixed**
- Navigation fits on 375px screens
- Audio bar positioned correctly
- Layout works on notched devices
- Text readable at 200% zoom

✅ **Quality Maintained**
- No visual regressions
- All tests still pass
- Performance unchanged
- Code style consistent

---

## Resources

**Your Specification:**
- File: `.speckit/specs/fix-critical-ui-issues.md`
- Contains: All requirements and acceptance criteria

**Your Analysis:**
- File: `UI_ANALYSIS_REPORT.md`
- Contains: Detailed findings for all 35+ issues

**Your Constitution:**
- File: `.speckit/constitution.md`
- Contains: Project principles and standards

---

## FAQ

**Q: Do I need to run spec-kit commands?**
A: No! The Windows encoding issue prevents CLI commands. Just create specs as markdown files and ask Claude to implement them.

**Q: Can I create my own specs?**
A: Yes! Create `.md` files in `.speckit/specs/` for any feature or fix.

**Q: What if I need to add more issues?**
A: Create a new spec file in `.speckit/specs/` describing the problem and requirements.

**Q: How do I track progress?**
A: Each spec becomes a checklist. Check off items as Claude implements them.

---

## Next Action

**Right now, you can:**

1. Open `.speckit/specs/fix-critical-ui-issues.md` and review it
2. Copy the prompt above
3. Ask Claude Code to implement the fixes
4. Watch the UI issues get fixed one by one

**That's it!** Spec-kit is now part of your development workflow.

---

**Ready to fix your UI issues?** 🚀

Ask Claude Code using the prompt above and watch the magic happen!
