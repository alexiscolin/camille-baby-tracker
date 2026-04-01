# Features V1

## 1. Authentication

- Google sign-in (email allowlist)
- Only authorized users can access data
- Sign out (header button mobile, sidebar icon desktop)

## 2. Quick Event Logging

Modal-based interface triggered from the timeline (no separate page):

### Feeding
- Type: left breast / right breast / bottle
- Start time (pre-filled with now, editable)
- Duration (optional — manual input)
- Infection / Engorgement flags
- Notes (optional)

### Pee
- Time (pre-filled with now, editable)
- Notes (optional)

### Poop
- Time (pre-filled with now, editable)
- Color/consistency (optional)
- Notes (optional)

### Medication
- Medication name
- Dose
- Time (pre-filled with now, editable)
- Notes (optional)

### Event Management
- Add event: per-day "+" button in timeline opens modal
- Edit event: tap any event in timeline to edit via modal
- Delete event: delete button in edit modal with confirmation
- Events can be added for any past day (not just today)
- Body scroll locked when modal is open

## 3. Dashboard (Home Page)

### Greeting Header
- Dynamic greeting (Good morning/afternoon/evening)
- Baby name + age badge (e.g., "12 days old") right-aligned
- Cache/sync indicator

### Quick Stats Hero
- **Time since last feeding** — primary card with accent background, shows side used
- **Breast balance today** — visual proportional bar (L/R), "next side" recommendation, handles zero correctly
- **Wet diaper alert** — count/expected with hour-weighted threshold, descriptive message, color-coded (green/orange/red)
- **Average feeding interval** — computed from recent events, with explanatory hint
- Each card has a contextual hint explaining what it measures

### Today's Summary (desktop only)
- 4 summary cards: feedings, pees, poops, meds counts

### Daily Activity Chart + Radar (desktop: side by side 2/3 + 1/3)
- Chart: Line or Bar (user toggle), range selector (7d/14d/30d)
- Shows all 4 event types with averages row below (icon + value + label inline)
- Radar: Today vs 7-day average spider chart, 4 axes

### Calendar Strip (above timeline)
- Horizontal scrollable day buttons (~90% width)
- Click to scroll to that day in the timeline
- "Load more" chevron button + date picker icon on the right
- Native date picker for jumping to any date

### Multi-Day Timeline
- Events grouped by day (Today, Yesterday, dates...)
- Each day section: date header + summary badges + "+" add button + event list
- Hour markers on left ordinate column
- Event time + relative time in parentheses: "14:30 (2 hours ago)"
- Clickable events open edit modal
- Consistent font sizes across all tile elements

### Responsive Behavior
- **Mobile**: QuickStats → Chart → Timeline (vertical stack), bottom nav
- **Desktop (1024px+)**: Dark sidebar (icon-only) + two-column layout (main panel + timeline panel)

## 4. Statistics Page

Full analytics view for detailed review (e.g., pediatrician visits):

### Key Metrics Row
- Total events, total feedings, avg interval, busiest day, peak feeding hour
- Each with colored icon badge

### Daily Overview Chart
- Bar or Line chart (user toggle)
- Range selector: 7d / 14d / 30d
- Shows all event types (feedings, pees, poops, meds)
- Larger charts on desktop (300-440px)

### Daily Distribution (Stacked Area)
- Stacked area chart showing proportion of each event type per day
- Visual representation of activity composition over time

### Today vs Average (Radar)
- Spider chart: today's counts vs period average on 4 axes
- Shows how today compares to the selected range average

### Daily Averages
- Per event type with colored icon, average count/day
- Average feeding interval

### Day vs Night Feedings
- Horizontal stacked bar with sun/moon icons
- Percentage split (Day 6:00–20:00 / Night 20:00–6:00)

### Left/Right Balance Trend
- Stacked bar chart: L/R/Bottle distribution per day

### Feeding Intervals Trend
- Line chart: average time between feedings per day

### Feeding Duration Trend
- Line chart: average feeding session length per day

### Feeding Hour Distribution
- Bar chart: number of feedings per hour of day (24 buckets)

### Desktop: Two-column grid for smaller charts

## 5. Navigation & Layout

### Mobile (< 1024px)
- Sticky header: Baby name tracker brand + logout button
- Bottom nav: Timeline | Stats (2 tabs)
- Max-width: 480px (phone), 700px (tablet)

### Desktop (≥ 1024px)
- Fixed dark sidebar (72px): logo + icon nav (Dashboard, Stats) + logout
- No bottom nav
- Full-width layout (no max-width cap)
- Dashboard: two-column (main panel flex:3 + timeline panel flex:2)
- Timeline panel: sticky, scrollable, white card

## 6. Dark Mode

- Automatic via `prefers-color-scheme: dark`
- Dark backgrounds (#0f0e1a, #1a1930), light text
- Adjusted shadows for dark surfaces
- Event type colors use semi-transparent backgrounds in dark mode
- Sidebar adapts to darker shade

## 7. Accessibility & UX

- Focus-visible outlines on all interactive elements (2px primary ring)
- Touch targets: 40-44px minimum on all buttons
- Modal body scroll lock
- aria-labels on icon-only buttons
- Keyboard navigation (Enter/Space) on timeline events
- No hover effects on non-interactive elements
- WCAG-aware color contrast

## 8. PWA

- Installable on home screen (mobile and desktop)
- Works offline (Firestore persistent cache + IndexedDB)
- Offline banner + cache/sync indicators
- Custom icon and splash screen
