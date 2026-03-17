# WiseQuran Project Constitution

## Project Principles

### Design Philosophy
- **Islamic-First Design**: Prioritize Islamic values and accessibility to diverse users
- **Accessibility**: WCAG 2.1 AA compliance minimum for all features
- **Performance**: Mobile-first, optimized for low-bandwidth environments
- **Inclusivity**: Support RTL languages (Arabic) and LTR languages (English)

### Technical Standards
- **Code Quality**: TypeScript strict mode, ESLint enforcement
- **Testing**: Unit tests for critical paths, E2E tests for user flows
- **Performance**: Lighthouse score 80+, Core Web Vitals green
- **Security**: Regular dependency updates, no sensitive data in logs

### User Experience
- **Responsive Design**: Works on 375px+ screens (smallest phones)
- **Touch Targets**: Minimum 44x44px for interactive elements
- **Text Contrast**: WCAG AA minimum (4.5:1 for normal text)
- **Animation**: Respectful of `prefers-reduced-motion`

### Architecture
- **Component-Based**: Reusable, well-documented components
- **State Management**: Context API for global state
- **Routing**: React Router with nested routes
- **UI Framework**: Radix UI with Tailwind CSS

## Development Workflow

1. **Specification** - Define requirements clearly before implementation
2. **Planning** - Create technical implementation plan
3. **Implementation** - Code with tests
4. **Review** - Peer review with accessibility audit
5. **Deployment** - Gradual rollout with monitoring

## Quality Gates

- All tests must pass
- No TypeScript errors
- No ESLint violations
- Accessibility audit clean
- Performance benchmarks met
