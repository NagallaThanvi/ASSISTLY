# Security Policy for Assistly

## 🔒 Security Overview

This document outlines the security measures, best practices, and guidelines for the Assistly platform.

## 🚨 Reporting Security Vulnerabilities

**DO NOT** open a public issue for security vulnerabilities.

Instead, please email: [your-security-email@example.com]

We will acknowledge your email within 48 hours and provide a detailed response within 7 days.

## 🛡️ Security Features

### Authentication & Authorization
- ✅ Firebase Authentication with secure session management
- ✅ Role-based access control (RBAC)
- ✅ Community-level data isolation
- ✅ Admin approval workflow for community joins
- ✅ Secure password requirements (min 8 chars, mixed case, numbers, special chars)

### Data Protection
- ✅ Firestore Security Rules enforce data isolation
- ✅ Client-side input sanitization
- ✅ XSS protection via Content Security Policy
- ✅ HTTPS-only in production (enforced via HSTS headers)
- ✅ No sensitive data in client-side storage

### API Security
- ✅ Rate limiting on all API endpoints
- ✅ Request validation and sanitization
- ✅ Environment-based API key management
- ✅ CORS configuration for trusted origins only

### Infrastructure Security
- ✅ Firebase App Check (recommended for production)
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Automated dependency vulnerability scanning
- ✅ Secure session management

## 🔐 Environment Variables Security

### Never Commit These Files
```
.env
.env.local
.env.development.local
.env.production.local
```

### Required Environment Variables
See `.env.example` for the complete list. Critical variables:
- `REACT_APP_FIREBASE_*` - Firebase configuration
- `REACT_APP_GROQ_API_KEY` - AI chatbot API key (optional)
- `REACT_APP_SENDGRID_API_KEY` - Email service (optional)

### Best Practices
1. **Use different API keys for dev/staging/production**
2. **Rotate API keys every 90 days**
3. **Never log or expose API keys in error messages**
4. **Use environment-specific secrets management in CI/CD**
5. **Enable Firebase App Check in production**

## 🔍 Security Checklist for Deployment

### Pre-Deployment
- [ ] All API keys are environment-specific
- [ ] `.env` file is **NOT** committed to Git
- [ ] Firebase Security Rules are deployed
- [ ] Firebase App Check is enabled (recommended)
- [ ] All dependencies are up-to-date (`npm audit fix`)
- [ ] Security headers are configured
- [ ] HTTPS is enforced
- [ ] Rate limiting is enabled
- [ ] Error logging is configured (no sensitive data in logs)

### Post-Deployment
- [ ] Test authentication flows
- [ ] Verify community isolation (users can't see other communities' data)
- [ ] Check CSP headers are active (`inspect > Network > Response Headers`)
- [ ] Test rate limiting (make rapid requests)
- [ ] Verify HTTPS redirect works
- [ ] Monitor error logs for security issues
- [ ] Set up Firebase billing alerts

## 🛠️ Firebase Security Rules

### Key Security Measures
1. **Community Isolation**: Users can only access data from their assigned community
2. **Role-Based Access**: Admins have elevated permissions, regular users are restricted
3. **Owner Checks**: Users can only modify their own content
4. **Authentication Required**: All operations require a valid Firebase auth token

### Testing Security Rules
```bash
firebase emulators:start --only firestore
npm run test:rules
```

### Deploying Security Rules
```bash
firebase deploy --only firestore:rules
```

## 🔄 Dependency Management

### Regular Updates
```bash
# Check for vulnerabilities
npm audit

# Fix automatically (non-breaking)
npm audit fix

# Review and fix breaking changes
npm audit fix --force
```

### Automated Scanning
- GitHub Dependabot (recommended)
- Snyk integration
- npm audit in CI/CD pipeline

## 🚫 Common Security Pitfalls to Avoid

### ❌ DO NOT
1. Hardcode API keys in source code
2. Commit `.env` files to Git
3. Use `eval()` or `Function()` with user input
4. Trust user input without validation
5. Store sensitive data in localStorage
6. Expose stack traces in production
7. Use outdated dependencies
8. Disable security features for "convenience"

### ✅ DO
1. Use environment variables for secrets
2. Validate and sanitize all user input
3. Enable Firebase App Check
4. Use HTTPS everywhere
5. Implement rate limiting
6. Log security events (without sensitive data)
7. Keep dependencies updated
8. Follow principle of least privilege

## 📊 Monitoring & Logging

### What to Monitor
- Failed authentication attempts
- Rate limit violations
- Firestore security rule denials
- API errors and failures
- Unusual usage patterns

### Logging Best Practices
```javascript
// ✅ Good - No sensitive data
logError('Authentication failed', { userId: user.id, timestamp: Date.now() });

// ❌ Bad - Exposes sensitive data
logError('Auth failed', { email: user.email, password: '***' });
```

### Error Tracking Services (Optional)
- Sentry (recommended)
- LogRocket
- Firebase Crashlytics

## 🔑 Authentication Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Session Management
- Sessions expire after 1 hour of inactivity
- Force re-authentication for sensitive operations
- Implement logout on all devices

### Multi-Factor Authentication (Future Enhancement)
- SMS-based 2FA
- Authenticator app support
- Backup codes

## 🌐 API Security

### Rate Limiting
```javascript
import { apiRateLimiter } from './utils/rateLimiter';

// 60 requests per minute per user
if (!apiRateLimiter.tryAcquire(userId)) {
  throw new Error('Rate limit exceeded. Please try again later.');
}
```

### Input Validation
```javascript
import { sanitizeInput } from './utils/security';

// Always sanitize user input
const cleanInput = sanitizeInput(userInput);
```

## 🔒 Firebase App Check Setup (Highly Recommended)

### Benefits
- Protects against unauthorized access
- Prevents API abuse
- Blocks automated attacks

### Setup Steps
1. Go to Firebase Console > App Check
2. Register your app with reCAPTCHA v3
3. Add App Check SDK to your app
4. Enforce App Check for Firestore and Functions

```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true
});
```

## 📱 Client-Side Security

### Content Security Policy (CSP)
Already configured in `public/_headers`. Prevents:
- XSS attacks
- Code injection
- Clickjacking
- Data exfiltration

### HTTPS Enforcement
- All production traffic must use HTTPS
- HSTS headers force HTTPS
- Automatic HTTP → HTTPS redirect

## 🔐 Community Isolation

### How It Works
1. Each user is assigned to ONE community
2. Firestore security rules enforce community-based access
3. Users cannot query or access data from other communities
4. Admins can only manage their assigned community

### Testing Isolation
```javascript
// Try to access another community's data
// Should fail with permission denied error
const otherCommunityDoc = await getDoc(doc(db, 'requests', 'other-community-request-id'));
```

## 📋 Security Audit Checklist

### Monthly
- [ ] Review Firebase usage and costs
- [ ] Check for new dependency vulnerabilities
- [ ] Review access logs for suspicious activity
- [ ] Verify security rules are up-to-date

### Quarterly
- [ ] Rotate API keys
- [ ] Update dependencies
- [ ] Security audit of custom code
- [ ] Review and update this security policy

### Annually
- [ ] Full security penetration test
- [ ] Review and update Firebase security rules
- [ ] Audit user permissions
- [ ] Update security documentation

## 📞 Contact

For security concerns or questions:
- Email: [security@your-domain.com]
- Response time: < 48 hours
- Critical issues: Immediate response

## 📄 License & Compliance

This application follows industry-standard security practices and is designed to be:
- GDPR compliant (with proper user consent flows)
- CCPA compliant
- SOC 2 ready (with additional audit procedures)

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Maintained by**: Assistly Security Team
