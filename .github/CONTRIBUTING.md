# Contributing to Liquidity Sentinel

Thank you for your interest in contributing to Liquidity Sentinel! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/lpb.git
   cd lpb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Code Style

### General Guidelines

- Follow the existing code style and patterns
- Use TypeScript for all new code
- Write self-documenting code with clear variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused (under 50 lines when possible)

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type - use proper typing
- Use union types and generics where appropriate

### React Components

- Use functional components with hooks
- Follow the naming convention: PascalCase for components
- Use proper prop interfaces
- Implement proper error boundaries

### File Structure

```
src/
├── components/     # React components
├── pages/         # Page components
├── store/         # Redux store and slices
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── tests/         # Test files
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=ComponentName
```

### Writing Tests

- Write tests for all new functionality
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies
- Aim for at least 80% code coverage

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interactions', () => {
    // Test implementation
  });

  it('should handle errors gracefully', () => {
    // Test implementation
  });
});
```

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

2. **Update documentation**
   - Update README.md if needed
   - Add JSDoc comments for new functions
   - Update API documentation if applicable

3. **Check for conflicts**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

### Pull Request Guidelines

1. **Create a descriptive title**
   - Use conventional commit format: `type(scope): description`
   - Examples: `feat(ui): add new dashboard component`, `fix(auth): resolve login issue`

2. **Provide detailed description**
   - Explain what the PR does
   - Include screenshots for UI changes
   - Reference related issues

3. **Include tests**
   - Add tests for new functionality
   - Ensure existing tests still pass

4. **Follow the checklist**
   - [ ] Code follows style guidelines
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] No console errors
   - [ ] Accessibility considerations

### Review Process

- All PRs require at least one review
- Address review comments promptly
- Request reviews from relevant team members
- Use the PR template provided

## Issue Reporting

### Before Creating an Issue

1. Check existing issues for duplicates
2. Search the documentation
3. Try to reproduce the issue

### Issue Template

Use the provided issue templates:
- **Bug Report**: For reporting bugs
- **Feature Request**: For suggesting new features
- **Documentation**: For documentation improvements

### Good Issue Reports Include

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, version)
- Screenshots or error messages
- Possible solutions (if any)

## Community

### Communication

- Be respectful and inclusive
- Use clear, constructive language
- Help others learn and grow
- Follow the Code of Conduct

### Getting Help

- Check the documentation first
- Search existing issues
- Ask questions in discussions
- Join our community channels

### Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Release Process

1. Create a release branch from main
2. Update version numbers
3. Update changelog
4. Create pull request
5. Merge and tag release

## Questions?

If you have questions about contributing, please:
1. Check this document
2. Search existing issues
3. Create a new issue with the "question" label

Thank you for contributing to Liquidity Sentinel! 🚀 