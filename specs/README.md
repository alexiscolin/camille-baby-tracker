# Baby Tracker - Specifications

Post-birth baby tracking application.

## Documents

- [Architecture](./architecture.md) - Technical stack and architecture decisions
- [Features V1](./features-v1.md) - First version features
- [Features V2](./features-v2.md) - Future version ideas
- [Data Model](./data-model.md) - Firestore data model
- [Security](./security.md) - Security rules and authentication

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- A Firebase project (free Spark plan)

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Enable **Authentication** > Sign-in methods: Email/Password and Google
3. Create a **Cloud Firestore** database (start in production mode)
4. Copy Firestore security rules from [security.md](./security.md) into Firestore > Rules
5. Go to Project Settings > General > Your apps > Add a web app
6. Copy the Firebase config object

### Local Development

```bash
# Clone and install
cd feeding-nursing
npm install

# Create environment file from the Firebase config
cp .env.example .env.local
# Fill in your Firebase config values in .env.local

# Start dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Environment Variables

Create a `.env.local` file at the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting (select your project, set build dir to "dist")
firebase init hosting

# Deploy
npm run build && firebase deploy
```
