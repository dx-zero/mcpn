# Contributing to mcpn

Thank you for your interest in contributing to mcpn! This document provides guidelines and instructions to help you get started with contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- pnpm 10.6.2 or higher

### Setting Up the Local Environment

1. Clone the repository:

```bash
git clone git@github.com:dx-zero/mcpn.git
cd mcpn
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the packages:

```bash
pnpm run build:packages
```

## Development Process

### Creating a New Feature

1. Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:

```bash
git add .
git commit -m "feat: add your feature"
```

3. Push your branch to GitHub:

```bash
git push origin feature/your-feature-name
```

### Submitting a Pull Request

Go to the [mcpn repository](https://github.com/dx-zero/mcpn) and create a pull request from your fork.

## Code Style and Guidelines

- Follow the existing code style and naming conventions.
- Write clear, concise commit messages that follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- Add tests for your changes when applicable.
- Update documentation as needed.

## Development Scripts

- `pnpm build:packages`: Build all packages in the monorepo
- `pnpm build:templates`: Build all templates
- `pnpm build:docs`: Build documentation
- `pnpm dev:docs`: Run documentation in development mode
- `pnpm lint`: Run ESLint on the codebase
- `pnpm typecheck`: Run TypeScript type checking
- `pnpm build`: Build the main mcpn package

## Release Process

The project follows [Semantic Versioning](https://semver.org/). When a new release is ready, maintainers will:

1. Update the version number in package.json.
2. Create a changelog entry.
3. Tag the release in Git.
4. Publish to npm using `pnpm publish-npm`.

## Issues and Discussions

Feel free to open issues for bugs, feature requests, or questions. For complex discussions, start a discussion in the repository's Discussions section.

Thank you for contributing!