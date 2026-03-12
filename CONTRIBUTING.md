# Contributing to Wise Quran

First off, thank you for considering contributing to Wise Quran! It's people like you that make open-source software such a great community. 

## Code of Conduct

By participating, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to the repository owner.

## How Can I Contribute?

### Reporting Bugs
If you find a bug, please open an Issue with a clear title and a description. Detail the steps to reproduce the bug, what you expected to happen, and what actually happened.

### Suggesting Enhancements
Enhancements use the same Issue tracking system. If you have an idea for a new feature, open an Issue labeled `enhancement` and describe your proposal.

### Pull Requests
1. Fork the repo and create your branch from `main`.
2. Install dependencies with `npm install`.
3. If you've added code that should be tested, add tests.
4. Ensure the test suite passes (`npm test` or `npm run lint`).
5. Run the development server (`npm run dev`) to test your changes locally.
6. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/wisequran.git
cd wisequran

# Install NPM dependencies
npm install

# Start the Vite development server
npm run dev
```

## Commit Messages

We loosely follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (white-space, formatting)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools and libraries
