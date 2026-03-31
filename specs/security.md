# Security

## Authentication

- Firebase Authentication with providers:
  - Email / password
  - Google sign-in
- Each user gets a unique UID from Firebase Auth
- No open registration: only users invited to a family can access its data

## Firestore Security Rules

See full rules in [firebase/firestore.rules](../firebase/firestore.rules).

Principle: a user can only read/write data belonging to their family.

### Access Control
- All reads/writes require family membership (checked via `isFamilyMember()`)
- `createdBy` must match the authenticated user's UID on event creation
- Family and baby deletion is forbidden

### Data Validation (server-side)
- **Event timestamps**: cannot be more than 48h in the future
- **Text fields**: validated for type (string) and length:
  - `medicationName`, `dose`: 1-200 chars
  - `notes`: max 500 chars
  - `familyName`, `babyName`: 1-100 chars
- **Numeric fields**: validated for type and bounds:
  - `durationMinutes`: positive integer, max 300
- **Enum fields**: validated against allowed values:
  - `type`: must be one of `feeding`, `pee`, `poop`, `medication`
  - `feedingType`: must be one of `left`, `right`, `bottle`

### Client-side Validation
- Input length limits enforced with `maxLength` and `slice()`
- Duration parsed and validated before submission
- Timestamps validated (max 24h in the future)
- Error messages shown to user on validation failure
- Error messages shown on Firestore write failures (network, permissions)

## Best Practices

- All communications over HTTPS (Firebase Hosting default)
- No sensitive data stored client-side (no tokens in visible localStorage)
- Firebase SDK handles session tokens automatically
- Environment variables for Firebase config (no secrets in source code)
- Firebase API keys are safe client-side (security relies on Security Rules, not key secrecy)
- `.gitignore` explicitly excludes `.env`, `.env.*` files (except `.env.example`)
- React JSX prevents XSS by default (no `dangerouslySetInnerHTML` used)
- All user inputs use controlled components (state-driven)
