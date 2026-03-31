# Architecture

## Technical Stack

| Layer       | Technology                    | Rationale                                                      |
| ----------- | ----------------------------- | -------------------------------------------------------------- |
| Frontend    | React 19 + Vite + TypeScript  | Fast builds, type-safe, mature ecosystem                       |
| PWA         | vite-plugin-pwa (Workbox)     | Installable on mobile/desktop, works offline                   |
| Auth        | Firebase Authentication       | Google sign-in + email/password, free tier                     |
| Database    | Cloud Firestore               | Real-time sync, per-user security rules, Spark plan (free)     |
| Hosting     | Firebase Hosting              | Free, CDN, automatic HTTPS                                    |
| Charts      | Recharts                      | Lightweight, React-native, good DX                             |
| Styling     | CSS Modules or Tailwind CSS   | Locally scoped, no class conflicts                             |
| Tests       | Vitest + Testing Library      | Fast, Vite-compatible, Jest-like API                           |

## Firebase Overview

Firebase is Google's cloud platform for web/mobile apps. It bundles several services under one project, one console, one billing plan:

- **Firebase Auth** — user management and sign-in
- **Cloud Firestore** — NoSQL real-time database
- **Firebase Hosting** — static hosting with CDN
- **Firebase Security Rules** — declarative data access control

## Spark Plan (Free Tier) — Limits

| Service    | Limit                              |
| ---------- | ---------------------------------- |
| Firestore  | 1 GB storage, 50k reads/day, 20k writes/day |
| Hosting    | 10 GB storage, 360 MB/day transfer |
| Auth       | Unlimited                          |

For family use (2-3 users), these limits will never be reached.

## Project Structure

```
feeding-nursing/
├── specs/                  # Specifications (this folder)
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/              # App pages/views
│   ├── hooks/              # Custom hooks (auth, data, etc.)
│   ├── services/           # Firebase, API calls
│   ├── types/              # Shared TypeScript types
│   ├── utils/              # Utility functions
│   ├── App.tsx
│   └── main.tsx
├── public/
├── tests/                  # Unit and integration tests
├── firebase/
│   └── firestore.rules     # Firestore security rules
├── CLAUDE.md
├── package.json
└── vite.config.ts
```
