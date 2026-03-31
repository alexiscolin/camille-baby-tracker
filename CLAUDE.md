# CLAUDE.md - Baby Tracker

## Project Overview

Post-birth baby tracking PWA (React + Firebase). See `specs/` for full specifications.

## Communication

- Always give honest, critical feedback — never sugarcoat
- Flag issues proactively, even if not asked
- If something is fragile, not production-ready, or has trade-offs, say so upfront

## Coding Principles

### TDD — Red, Green, Refactor

1. **Red**: Write a failing test first
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Clean up while keeping tests green

Every feature or bug fix starts with a test. No production code without a corresponding test.

### DRY — Don't Repeat Yourself

- Extract shared logic into hooks, utils, or components
- Single source of truth for types (see `src/types/`)
- Reuse Firestore query patterns via custom hooks

### YAGNI — You Aren't Gonna Need It

- Only build what is specified in the current feature scope
- No speculative abstractions or premature optimizations
- If it's not in the specs, don't build it

### KISS — Keep It Simple, Stupid

- Prefer simple, readable solutions over clever ones
- Flat component hierarchies when possible
- Minimal dependencies

### SOLID

- Single responsibility per component/hook/function
- Depend on abstractions (interfaces/types), not implementations
- Small, focused modules

## Git Rules

- **NEVER push to GitHub** — all work stays local until explicitly authorized
- **NEVER commit** — unless the user explicitly asks for it
- **NEVER amend** existing commits — create new ones if asked to commit

## Code Style

- TypeScript strict mode — no `any` types
- Functional components with hooks (no class components)
- Named exports (no default exports)
- File naming: `kebab-case.ts` for utils, `PascalCase.tsx` for components
- Test files: colocated as `*.test.ts(x)` or in `tests/` directory

## Tech Stack

- React 19 + Vite + TypeScript
- Firebase (Auth + Firestore + Hosting)
- Recharts for data visualization
- Vitest + Testing Library for tests
- vite-plugin-pwa for PWA support

## Project Structure

```
src/
├── components/    # Reusable UI components
├── pages/         # App pages/views
├── hooks/         # Custom React hooks
├── services/      # Firebase and external services
├── types/         # Shared TypeScript types
├── utils/         # Pure utility functions
├── App.tsx
└── main.tsx
```

## Testing

- Run tests: `npm run test`
- Run tests in watch mode: `npm run test:watch`
- All tests must pass before any feature is considered done
- Test naming: `describe('ComponentName')` / `it('should do something specific')`

## Documentation Language

- All code, comments, commit messages, and documentation must be in **English**
