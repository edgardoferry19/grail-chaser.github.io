# Grail Chaser

Minimal watch savings tracker built with React, TypeScript, Vite, Tailwind, and Firebase.

## Local development

1. Create `.env.local` with your Firebase values:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
2. Install dependencies:
   - `npm ci`
3. Start dev server:
   - `npm run dev`

## Deploy to GitHub Pages

This repo includes a workflow at `.github/workflows/deploy-pages.yml` that deploys on every push to `main`.

### One-time repository setup

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions**, add these repository secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### Publish

Push to `main`. The workflow will build and deploy `dist` to GitHub Pages.
