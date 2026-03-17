# Spec-Kit Integration Guide for WiseQuran

## Installation Status
✅ **Spec-kit is installed** and ready to use!

### What Was Installed
- `specify` CLI tool via `uv tool install`
- Spec-kit constitution file with project principles
- This integration guide

---

## How to Use Spec-Kit with Claude Code

Spec-kit helps you write specifications before implementing features. Instead of asking Claude to "build X", you can:

1. **Define the spec** - What exactly should the feature do?
2. **Let Claude plan** - How should it be built?
3. **Let Claude implement** - Build according to the plan
4. **Verify** - Does it match the spec?

### Basic Workflow

#### Step 1: Create a Specification
```bash
specify check  # Validate existing specs
```

Or manually create a spec file in `.speckit/specs/`:

```markdown
# Feature: Dark Mode Toggle

## Requirements
- [ ] Users can toggle dark mode in settings
- [ ] Preference persists across sessions
- [ ] All colors properly inverted in dark mode
- [ ] Contrast ratios meet WCAG AA

## Acceptance Criteria
- Toggle button visible in settings page
- System respects `prefers-color-scheme`
- No flashing between theme changes
```

#### Step 2: Use Claude Code with Specs
Ask Claude to:
- Read your specification
- Create an implementation plan
- Implement according to the plan
- Verify against the spec

### Spec File Structure

Create specs in `.speckit/specs/` directory:

```
.speckit/
├── constitution.md       # Project principles
├── specs/
│   ├── feature-1.md
│   ├── feature-2.md
│   └── bug-fixes/
│       └── issue-123.md
└── decisions/            # Architecture decisions
```

---

## Example Usage with Claude

### Ask Claude to Review the UI Analysis Against Your Spec

```
Based on the UI_ANALYSIS_REPORT.md I generated, create a specification
for fixing the critical UI issues. Then create an implementation plan.
```

### Ask for Spec-Driven Implementation

```
Using the spec I created in .speckit/specs/, implement the touch target
fixes. Ensure all touch targets are 44x44px minimum as specified.
```

---

## Key Spec-Kit Commands

While the Windows encoding issue prevents full CLI usage, you can still:

1. **Create specs manually** in `.speckit/specs/` as markdown files
2. **Reference specs in Claude** - "Based on the spec in .speckit/specs/..."
3. **Use as documentation** - Specs serve as requirements documentation

### Workaround: Manual Spec Usage

Since the `specify` CLI has Windows encoding issues, use this workflow:

1. **Write specs** - Create `.md` files in `.speckit/specs/`
2. **Ask Claude** - "Based on my spec in `.speckit/specs/fix-accessibility.md`, implement the changes"
3. **Verify** - Check implementation against the spec

---

## Creating Your First Spec

### Template: Feature Spec

```markdown
# Feature: [Feature Name]

## Problem Statement
Why is this feature needed? What problem does it solve?

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Acceptance Criteria
- Feature works as designed on all target devices
- All tests pass
- Accessibility audit clean
- Performance benchmarks met

## Technical Notes
- Any special considerations
- Performance constraints
- Browser compatibility needs

## Definition of Done
- [ ] Code reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Deployed to production
```

### Template: Bug Fix Spec

```markdown
# Bug Fix: [Bug Title]

## Problem Description
What's the bug? How does it manifest?

## Reproduction Steps
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen instead?

## Root Cause (if known)
Analysis of why this occurs

## Solution Approach
How will we fix it?

## Test Plan
How will we verify it's fixed?
```

---

## Project Constitution

Your project constitution is stored in `.speckit/constitution.md` and defines:

- **Design Philosophy** - Islamic-first, accessible, performant
- **Technical Standards** - TypeScript, tests, performance
- **UX Principles** - WCAG AA compliance, 44x44px touch targets
- **Architecture** - Component-based with React Router
- **Quality Gates** - Tests, linting, accessibility

All specifications should align with these principles.

---

## Next Steps

### 1. Review the UI Analysis
The `UI_ANALYSIS_REPORT.md` contains 35+ issues found in your app. Create specs for the critical ones:

**Example:** `.speckit/specs/fix-touch-targets.md`
```markdown
# Fix: Touch Target Sizes

## Problem
Many interactive elements are smaller than 44x44px, violating accessibility standards.

## Requirements
- [ ] All buttons/tappable elements are minimum 44x44px
- [ ] Icons within buttons respect sizing
- [ ] No text overlap when resized

## Affected Components
- GlobalAudioBar close button (currently 36x36px)
- Navigation skip buttons
- Form input clear buttons

## Testing
Verify on: iPhone SE (375px), Pixel 4a (412px), iPad
```
```

### 2. Create Specs for Critical Issues
Use the severity levels from the UI analysis:
- P0: Bottom nav overflow, touch targets
- P1: Typography scaling, audio bar positioning
- P2: Animation optimization, loading states

### 3. Have Claude Implement by Spec
For each spec, ask Claude to:
1. Review the spec
2. Create an implementation plan
3. Implement the fix
4. Verify against the spec

---

## Tips for Effective Specs

1. **Be Specific** - "Fix accessibility" is vague. "All touch targets ≥44x44px" is specific.
2. **Include Metrics** - "Improve performance" → "Achieve Lighthouse 85+"
3. **Reference Standards** - "WCAG 2.1 AA compliance"
4. **List Acceptance Criteria** - Make verification testable
5. **Add Examples** - Show what success looks like

---

## Troubleshooting

### CLI Encoding Error
The `specify` CLI has a Windows encoding issue. Use manual workflow instead:
- Create specs as `.md` files
- Share spec content with Claude
- Reference specs in prompts

### Verify Installation
```bash
which specify
# Should output: /c/Users/magdy/.local/bin/specify
```

### Use with WSL2/Git Bash
The tool works in Unix shells. Use Git Bash for best results:
```bash
# In Git Bash
specify --version
```

---

## Resources

- **Spec-Kit Repo**: https://github.com/github/spec-kit
- **Your Constitution**: `.speckit/constitution.md`
- **Your UI Analysis**: `UI_ANALYSIS_REPORT.md`
- **Example Specs**: Start with `.speckit/specs/` directory

---

## Summary

Spec-kit is now installed and ready! The workflow is:

1. **Write a clear specification** for what you want to build
2. **Share it with Claude** - "Here's my spec, can you implement it?"
3. **Claude implements** following the specification
4. **Verify** the implementation matches the spec

This ensures clarity, reduces misunderstandings, and makes verification straightforward.

Good luck with your WiseQuran improvements! 🚀
