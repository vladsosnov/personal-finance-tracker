# Security Guide

This document provides security guidelines for deploying and maintaining the Personal Finance Tracker application.

## Critical Security Actions Before Production

### 1. Rotate Database Credentials (URGENT)

**If credentials were previously committed to the repository:**

1. **Immediately rotate MongoDB credentials:**
   - Log into MongoDB Atlas (or your MongoDB provider)
   - Navigate to Database Access
   - Delete the old user: `vladyslavsosnov_db_user`
   - Create a new database user with a strong password
   - Update connection string in your production environment variables

2. **Remove credentials from git history:**
   ```bash
   # Option 1: Using BFG Repo-Cleaner (recommended)
   git clone --mirror https://github.com/your-username/your-repo.git
   java -jar bfg.jar --replace-text passwords.txt your-repo.git
   cd your-repo.git
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force

   # Option 2: Using git filter-branch
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch backend/.env' \
     --prune-empty --tag-name-filter cat -- --all
   git push --force --all
   ```

3. **Verify removal:**
   ```bash
   git log --all --full-history --source -- '*/.env'
   ```

### 2. Environment Variable Setup

**Never commit these files:**
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`

**Required environment variables for production:**

```bash
# Backend (.env)
PORT=4000
MONGODB_URI=mongodb+srv://NEW_USER:NEW_PASSWORD@cluster.mongodb.net/dbname
JWT_SECRET=$(openssl rand -base64 32)  # Must be 32+ characters
FRONTEND_ORIGIN=https://yourdomain.com
NODE_ENV=production

# Optional: Email configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

**Frontend environment variables:**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_GRAPHQL_URL=https://api.yourdomain.com/graphql
```

## Deployment Platforms

### Vercel (Frontend)

1. Go to Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL` with your backend URL
3. Redeploy the application

### Railway/Render/Fly.io (Backend)

1. Set environment variables in the platform dashboard
2. Never paste production secrets in terminal history or logs
3. Use platform secret management features

## Security Checklist

### Before Every Deployment

- [ ] All `.env` files are in `.gitignore`
- [ ] No secrets in code or configuration files
- [ ] JWT_SECRET is 32+ characters
- [ ] FRONTEND_ORIGIN matches actual frontend URL
- [ ] MongoDB credentials are rotated and strong
- [ ] Database network access is restricted to application IPs
- [ ] HTTPS is enforced (no HTTP in production)

### Database Security

- [ ] Enable MongoDB Atlas IP allowlist (never use 0.0.0.0/0 in production)
- [ ] Enable MongoDB Atlas audit logs
- [ ] Set up automated backups (recommended: daily)
- [ ] Test backup restoration procedure
- [ ] Enable encryption at rest
- [ ] Use separate databases for dev/staging/production

### Application Security

- [ ] Rate limiting configured for all endpoints
- [ ] CSRF protection enabled (Origin header validation)
- [ ] Input validation on all user inputs
- [ ] Password strength requirements enforced
- [ ] Email verification enabled
- [ ] Session tokens stored in HttpOnly cookies
- [ ] CORS configured with specific origin (not wildcard)

### Monitoring

- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Configure uptime monitoring
- [ ] Enable structured logging
- [ ] Set up alerts for failed authentications
- [ ] Monitor rate limit violations

## Security Incident Response

### If Credentials Are Compromised

1. **Immediately rotate all secrets:**
   - Database credentials
   - JWT_SECRET (will invalidate all sessions)
   - SMTP credentials
   - API keys

2. **Audit access logs:**
   - Check MongoDB Atlas access logs
   - Review application logs for suspicious activity
   - Check for unauthorized data access

3. **Notify affected users if data breach occurred**

4. **Document the incident and remediation steps**

### If User Data Is Exposed

1. Follow data breach notification requirements for your jurisdiction
2. Rotate all user passwords (force password reset)
3. Investigate scope of exposure
4. Strengthen security controls

## Regular Security Maintenance

### Weekly
- Review failed login attempts
- Check rate limit violations
- Monitor error rates

### Monthly
- Review user accounts for anomalies
- Update dependencies (`npm audit fix`)
- Test backup restoration
- Review and rotate service credentials

### Quarterly
- Security audit of codebase
- Penetration testing (if budget allows)
- Review and update security policies
- Update Node.js and MongoDB versions

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourdomain.com (replace with your actual security contact).

**Do not:**
- Open public GitHub issues for security vulnerabilities
- Share exploit details publicly before patching

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
