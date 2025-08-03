# Contributing to Liquidity Sentinel

Thank you for your interest in contributing to Liquidity Sentinel! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/yourusername/lpb.git`
3. **Install** dependencies: `npm install`
4. **Create** a feature branch: `git checkout -b feature/amazing-feature`
5. **Make** your changes
6. **Test** your changes: `npm test`
7. **Commit** your changes: `git commit -m 'Add amazing feature'`
8. **Push** to your branch: `git push origin feature/amazing-feature`
9. **Open** a Pull Request

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Documentation](#documentation)
- [Support](#support)

## 🤝 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: Latest version
- **TypeScript**: 5.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/CrunchNZ/lpb.git
cd lpb

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Configuration

Copy `.env.example` to `.env` and configure your environment variables:

```bash
# Required for development
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_DEXSCREENER_API_URL=https://api.dexscreener.com
VITE_JUPITER_API_URL=https://quote-api.jup.ag

# Optional for advanced features
VITE_ENABLE_SENTIMENT_ANALYSIS=true
VITE_ENABLE_MEV_PROTECTION=true
```

## 📁 Project Structure

```
lpb/
├── src/                    # Source code
│   ├── frontend/          # React frontend
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   └── utils/         # Frontend utilities
│   ├── backend/           # Backend services
│   │   ├── integrations/  # External API integrations
│   │   ├── database/      # Database layer
│   │   ├── strategies/    # Trading strategies
│   │   └── utils/         # Backend utilities
│   ├── main.ts           # Electron main process
│   └── preload.ts        # Electron preload script
├── tests/                 # Test files
├── docs/                  # Documentation
├── scripts/               # Build and utility scripts
├── .github/               # GitHub configuration
└── dist/                  # Build output
```

## 📝 Coding Standards

### TypeScript

- Use **strict** TypeScript configuration
- Prefer **interfaces** over types for object shapes
- Use **enums** for constants
- Avoid **any** type - use proper typing
- Use **generics** for reusable components

```typescript
// ✅ Good
interface Position {
  id: string;
  token: string;
  amount: number;
  strategy: TradingStrategy;
}

// ❌ Bad
const position: any = {
  id: '123',
  token: 'SOL',
  amount: 100
};
```

### React Components

- Use **functional components** with hooks
- Follow **single responsibility** principle
- Use **TypeScript** for all components
- Implement **proper error boundaries**

```typescript
// ✅ Good
interface PositionCardProps {
  position: Position;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onEdit,
  onDelete,
}) => {
  const handleEdit = useCallback(() => {
    onEdit(position.id);
  }, [position.id, onEdit]);

  return (
    <div className="position-card">
      <h3>{position.token}</h3>
      <p>Amount: {position.amount}</p>
      <button onClick={handleEdit}>Edit</button>
      <button onClick={() => onDelete(position.id)}>Delete</button>
    </div>
  );
};
```

### File Naming

- Use **PascalCase** for components: `PositionCard.tsx`
- Use **camelCase** for utilities: `marketUtils.ts`
- Use **kebab-case** for test files: `position-card.test.tsx`
- Use **UPPER_CASE** for constants: `API_ENDPOINTS.ts`

### Import Order

```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

// 3. Internal imports
import { Position } from '../types';
import { usePosition } from '../hooks';
import { formatAmount } from '../utils';

// 4. Relative imports
import './PositionCard.css';
```

## 🧪 Testing Guidelines

### Test Structure

- **Unit tests** for individual functions
- **Integration tests** for component interactions
- **E2E tests** for user workflows
- **Accessibility tests** for WCAG compliance

### Test Naming

```typescript
// ✅ Good
describe('PositionCard', () => {
  describe('when position is profitable', () => {
    it('should display green profit indicator', () => {
      // test implementation
    });
  });

  describe('when position is losing', () => {
    it('should display red loss indicator', () => {
      // test implementation
    });
  });
});
```

### Test Coverage

- Aim for **90%+** code coverage
- Test **happy path** and **error cases**
- Test **edge cases** and **boundary conditions**
- Test **accessibility** features

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- tests/position-card.test.tsx
```

## 📝 Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Commit Format

```
type(scope): description

[optional body]

[optional footer]
```

### Examples

```bash
# ✅ Good
feat(positions): add position card component
fix(auth): resolve wallet connection issue
docs(readme): update installation instructions
test(components): add unit tests for PositionCard

# ❌ Bad
added new feature
fixed bug
updated docs
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update** documentation if needed
2. **Add** tests for new functionality
3. **Run** the full test suite: `npm run validate`
4. **Check** code formatting: `npm run format:check`
5. **Verify** accessibility: `npm run test:a11y`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Accessibility tested
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on multiple platforms
4. **Documentation** review
5. **Final approval** and merge

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update** version in `package.json`
2. **Update** `CHANGELOG.md`
3. **Create** release branch
4. **Run** full test suite
5. **Build** for all platforms
6. **Create** GitHub release
7. **Deploy** to distribution channels

### Release Commands

```bash
# Update version
npm version patch|minor|major

# Build for all platforms
npm run build:full

# Create release
npm run release
```

## 📚 Documentation

### Code Documentation

- **JSDoc** comments for functions
- **README** for each major component
- **Inline** comments for complex logic
- **API** documentation for public interfaces

```typescript
/**
 * Calculates the impermanent loss for a liquidity position
 * @param initialPrice - The initial token price
 * @param currentPrice - The current token price
 * @param positionSize - The size of the position
 * @returns The impermanent loss percentage
 */
export const calculateImpermanentLoss = (
  initialPrice: number,
  currentPrice: number,
  positionSize: number,
): number => {
  // Implementation
};
```

### User Documentation

- **User Guide**: Complete user documentation
- **API Reference**: Backend API documentation
- **Deployment Guide**: Production deployment instructions
- **Troubleshooting**: Common issues and solutions

## 🆘 Support

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/CrunchNZ/lpb/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CrunchNZ/lpb/discussions)
- **Documentation**: [Project Docs](./docs/)
- **Email**: support@liquiditysentinel.com

### Reporting Bugs

When reporting bugs, please include:

1. **Environment**: OS, Node.js version, npm version
2. **Steps**: Detailed reproduction steps
3. **Expected**: What should happen
4. **Actual**: What actually happens
5. **Screenshots**: If applicable
6. **Logs**: Error messages and stack traces

### Feature Requests

When requesting features, please include:

1. **Use case**: Why this feature is needed
2. **Proposed solution**: How it should work
3. **Alternatives**: Other approaches considered
4. **Mockups**: UI/UX mockups if applicable

## 🏆 Recognition

Contributors will be recognized in:

- **README.md**: Contributors section
- **CHANGELOG.md**: Release notes
- **GitHub**: Contributors graph
- **Documentation**: Credit where applicable

## 📄 License

By contributing to Liquidity Sentinel, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Thank you for contributing to Liquidity Sentinel! 🚀** 