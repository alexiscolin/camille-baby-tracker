# Features V2 (Future)

Ideas for future versions, to be prioritized based on needs.

## Sleep Tracking
- Log naps and night sleep with start/end times
- Total sleep hours per day
- Evolution charts

## Growth Charts
- Periodic weight, height, head circumference entries
- Growth curves with WHO percentiles
- Export for health records

## Free-form Notes
- Daily journal (free text)
- Custom tags

## Data Export
- CSV export for spreadsheets
- Formatted PDF export for pediatrician
- Full history or by date range

## Night Mode (Enhancement)
- Manual dark/light toggle (currently auto-only via prefers-color-scheme)
- Time-based automatic switching (force dark at night hours)
- Reduced brightness mode for 3am feedings

## Notifications and Reminders
- "Last feeding X hours ago" (push notification)
- Programmable medication reminders
- Daily summary

## Sharing
- Read-only link for nanny / grandparents
- Roles: parent (read/write) vs observer (read-only)

## Multi-baby
- Support multiple children in the same account
- Easy profile switching

## Event Pagination & Virtualization
- Cursor-based pagination for Firestore queries (avoid loading 100+ events at once)
- Virtual scrolling in timeline for long days (react-window or similar)
- Paginated stats queries to reduce Firestore read costs at scale

## Runtime Data Validation
- Zod schemas for all Firestore document types (Family, Baby, BabyEvent)
- Validate data on read (replace unsafe `as` type assertions)
- Graceful handling of corrupted or schema-mismatched documents

## Advanced Testing
- Component tests with Testing Library (DashboardPage, StatsPage)
- Hook integration tests with mocked Firebase (useEvents, useFamily, useAuth)
- Firestore security rules unit tests (via @firebase/rules-unit-testing)
- E2E tests for critical flows: login, setup, event creation, edit, delete, offline sync
- Error scenario tests: network failures, invalid data, permission denied

## Monitoring & Error Tracking
- Sentry or similar for production error tracking
- Firebase Performance Monitoring for slow queries
- Analytics for feature usage (anonymous, privacy-respecting)

## Rate Limiting
- Cloud Functions (Blaze plan) to enforce write rate limits per user
- Prevent Spark plan quota exhaustion from spam writes
- Daily event count cap per family (configurable)

## Advanced Stats (if volume justifies it)
- Week-over-week comparison overlay on charts
- Feeding efficiency trend (volume/duration if bottle-fed)
- Custom date range picker for stats
- Heatmap: 7-day × 24-hour grid showing feeding density
