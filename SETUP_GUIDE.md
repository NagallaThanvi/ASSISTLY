# 🚀 Complete Setup & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Firebase Configuration](#firebase-configuration)
4. [Environment Variables](#environment-variables)
5. [Development](#development)
6. [Production Deployment](#production-deployment)
7. [Security Hardening](#security-hardening)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- **Node.js** 16.x or higher ([Download](https://nodejs.org/))
- **npm** 8.x or higher (comes with Node.js)
- **Firebase Account** ([Sign up free](https://firebase.google.com/))
- **Git** ([Download](https://git-scm.com/))

### Optional
- **Firebase CLI** for deployment: `npm install -g firebase-tools`
- **Groq API Key** for AI chatbot ([Free](https://console.groq.com/))

### Check Your Setup
```bash
node --version  # Should be 16.x or higher
npm --version   # Should be 8.x or higher
git --version
```

---

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ASSISTLY.git
cd ASSISTLY
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages. If you see any warnings about vulnerabilities:
```bash
npm audit fix
```

### 3. Verify Installation
```bash
npm run build
```

If the build succeeds, you're ready to proceed!

---

## Firebase Configuration

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: e.g., "assistly-prod"
4. Enable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** sign-in
4. (Optional) Enable **Google** sign-in

### 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create Database"
3. Choose **Production mode** (we'll deploy rules next)
4. Select your region (choose closest to your users)
5. Click "Enable"

### 4. Deploy Security Rules

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore (use existing rules)
# - Hosting (optional, for Firebase Hosting)

# Deploy security rules
firebase deploy --only firestore:rules
```

### 5. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the **web icon** (</>)
4. Register your app (name: "Assistly Web")
5. Copy the configuration object

---

## Environment Variables

### 1. Create .env File

```bash
cp .env.example .env
```

### 2. Fill in Your Configuration

Open `.env` and replace placeholder values:

```env
# Firebase Configuration (FROM FIREBASE CONSOLE)
REACT_APP_FIREBASE_API_KEY=AIza...your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123:web:abc123

# Optional: AI Chatbot (Groq - FREE)
REACT_APP_GROQ_API_KEY=gsk_your_groq_key_here

# Optional: Google Analytics
REACT_APP_GA_ID=G-XXXXXXXXXX

# Application Settings
REACT_APP_NAME="Assistly"
REACT_APP_DESCRIPTION="Your trusted community assistance platform"
REACT_APP_URL=http://localhost:3000

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_NOTIFICATIONS=true
```

### 3. Verify Configuration

The app will validate your configuration on startup and show warnings if anything is missing.

---

## Development

### 1. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

### 2. Fix ESLint Warnings (Optional)

```bash
# Automatically fix formatting and simple issues
npm run lint:fix

# Check for remaining issues
npm run lint
```

### 3. Run Tests

```bash
npm test
```

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

---

## Production Deployment

### Option 1: Firebase Hosting (Recommended)

#### Advantages
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Automatic deployments
- ✅ Free tier (10 GB transfer/month)

#### Steps

1. **Install Firebase CLI** (if not already installed)
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Initialize Hosting**
```bash
firebase init hosting

# Select:
# - Use an existing project
# - Public directory: build
# - Configure as single-page app: Yes
# - Set up automatic builds: No (for now)
```

4. **Build and Deploy**
```bash
# Create production build
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

5. **Your app is live!**
```
https://your-project.web.app
```

#### Continuous Deployment (Optional)

Set up GitHub Actions for automatic deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # Add other env variables from GitHub Secrets
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

### Option 2: Netlify

#### Steps

1. **Connect Repository**
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect your Git repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Add Environment Variables**
   - Go to Site Settings > Build & deploy > Environment
   - Add all `REACT_APP_*` variables from your `.env` file

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy automatically

#### Custom Domain
- Go to Domain settings
- Add your custom domain
- Update DNS records as instructed

### Option 3: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Option 4: Traditional Hosting (Apache/Nginx)

1. **Build**
```bash
npm run build
```

2. **Upload** the `build/` folder to your server

3. **Configure Server**

**Apache** (.htaccess):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Nginx**:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Security Hardening

### 1. Enable Firebase App Check

1. Go to Firebase Console > App Check
2. Click "Get Started"
3. Register your app with reCAPTCHA v3
4. Get your site key from [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
5. Add to `.env`:
```env
REACT_APP_RECAPTCHA_SITE_KEY=your-site-key
```

6. Update `src/firebase.js`:
```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true
});
```

7. Enforce App Check in Firebase Console

### 2. Update Security Rules

Review and update `firestore.rules` regularly:

```bash
firebase deploy --only firestore:rules
```

### 3. Set Up Monitoring

1. **Firebase Performance Monitoring**
```bash
firebase init performance
```

2. **Error Tracking** (Optional - Sentry)
```bash
npm install @sentry/react
```

Add to `src/index.js`:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV
});
```

### 4. Configure CORS

Update `firebase.json`:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          }
        ]
      }
    ]
  }
}
```

---

## Troubleshooting

### Build Errors

**Error: "React Scripts not found"**
```bash
npm install react-scripts
```

**Error: "Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Firebase Errors

**Error: "Permission denied"**
- Check Firestore security rules
- Verify user is authenticated
- Ensure user is in correct community

**Error: "Firebase config invalid"**
- Verify all environment variables in `.env`
- Check for typos in Firebase config
- Ensure Firebase project is active

### Deployment Issues

**Firebase Hosting: 404 errors on refresh**
- Ensure `firebase.json` has proper rewrites:
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Netlify: Environment variables not working**
- Verify all `REACT_APP_*` variables are added in Netlify UI
- Rebuild the site after adding variables

### Performance Issues

**Slow initial load**
```bash
# Analyze bundle size
npm install -g source-map-explorer
npm run build
source-map-explorer 'build/static/js/*.js'
```

**Firestore slow queries**
- Add indexes for complex queries (Firebase Console > Firestore > Indexes)
- Enable persistence (already done in `src/firebase.js`)

---

## Next Steps

### 1. Create Your First Admin Account
- Navigate to `/admin-signup`
- Create admin account and community

### 2. Customize Branding
- Update `public/manifest.json`
- Replace `public/logo192.png` and `public/logo512.png`
- Update colors in `src/App.css`

### 3. Set Up Email Notifications (Optional)
- Get SendGrid API key
- Add to `.env`:
```env
REACT_APP_SENDGRID_API_KEY=SG.your-key
```

### 4. Enable AI Chatbot (Optional)
- Get Groq API key (free): https://console.groq.com/
- Add to `.env`:
```env
REACT_APP_GROQ_API_KEY=gsk_your-key
```

### 5. Monitor and Maintain
- Check Firebase usage monthly
- Update dependencies quarterly
- Review security rules regularly
- Monitor error logs

---

## Support

- **Documentation**: See [README.md](./README.md)
- **Security**: See [SECURITY.md](./SECURITY.md)
- **Issues**: Open a GitHub issue
- **Email**: [your-email@example.com]

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Last Updated**: November 2025  
**Version**: 1.0.0
