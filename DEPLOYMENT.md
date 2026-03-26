# Deployment Guide

## Pre-Deployment Checklist

### Security (CRITICAL - Complete Before Production)

- [ ] **Database credentials rotated** (see SECURITY.md)
- [ ] **Remove .env from git history** (see SECURITY.md)
- [ ] **Generate strong JWT secret**: `openssl rand -base64 32`
- [ ] **Database indexes added** (already in code, will auto-create)
- [ ] **CSRF protection enabled** (already in code)
- [ ] **HTTPS configured** on production domain
- [ ] **Environment variables set** in deployment platform

### Application Configuration

- [ ] Update `FRONTEND_ORIGIN` to production URL
- [ ] Update `NEXT_PUBLIC_API_URL` to production backend URL
- [ ] Configure SMTP settings (optional but recommended)
- [ ] Set `NODE_ENV=production`
- [ ] Verify CORS origin matches frontend URL

## Backend Deployment

### Option 1: Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Create new project and link:
   ```bash
   cd backend
   railway login
   railway init
   railway link
   ```

3. Set environment variables:
   ```bash
   railway variables set MONGODB_URI="mongodb+srv://..."
   railway variables set JWT_SECRET="$(openssl rand -base64 32)"
   railway variables set FRONTEND_ORIGIN="https://your-frontend.vercel.app"
   railway variables set NODE_ENV="production"
   ```

4. Deploy:
   ```bash
   railway up
   ```

### Option 2: Render

1. Create new Web Service on [Render](https://render.com)
2. Connect GitHub repository
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`
5. Add environment variables in dashboard
6. Deploy

### Option 3: Fly.io

1. Install flyctl:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Create app:
   ```bash
   cd backend
   fly launch
   ```

3. Set secrets:
   ```bash
   fly secrets set MONGODB_URI="mongodb+srv://..."
   fly secrets set JWT_SECRET="$(openssl rand -base64 32)"
   fly secrets set FRONTEND_ORIGIN="https://your-frontend.vercel.app"
   fly secrets set NODE_ENV="production"
   ```

4. Deploy:
   ```bash
   fly deploy
   ```

## Frontend Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy from frontend directory:
   ```bash
   cd frontend
   vercel
   ```

3. Set environment variable:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   # Enter your backend URL: https://your-backend.railway.app
   ```

4. Redeploy:
   ```bash
   vercel --prod
   ```

### Netlify

1. Create `netlify.toml` in frontend directory:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. Deploy via Netlify dashboard or CLI
3. Set environment variable `NEXT_PUBLIC_API_URL` in dashboard

## Database Setup (MongoDB Atlas)

1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)

2. Create database user:
   - Username: Use a unique, non-obvious name
   - Password: Generate strong password (32+ characters)
   - Permissions: Read and write to specific database

3. Configure network access:
   - Add deployment platform IP addresses
   - **Never use 0.0.0.0/0 in production**

4. Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

5. Enable backups:
   - Go to Backup tab
   - Enable Continuous Backup
   - Set retention period (recommended: 7 days minimum)

## Post-Deployment

### Verify Deployment

1. **Health checks:**
   ```bash
   curl https://your-backend.com/health
   curl https://your-backend.com/healthcheck
   ```

2. **Test authentication:**
   - Visit frontend
   - Register new account
   - Verify email link works
   - Test login/logout

3. **Test core functionality:**
   - Create a goal
   - Add operations
   - Edit and delete operations
   - Complete a goal

### Monitor Logs

**Backend (Railway):**
```bash
railway logs
```

**Frontend (Vercel):**
```bash
vercel logs
```

### Set Up Monitoring

1. **Error tracking** (Sentry):
   ```bash
   npm install @sentry/node @sentry/nextjs
   ```

2. **Uptime monitoring** (UptimeRobot):
   - Add monitor for: `https://your-backend.com/health`
   - Set alert interval: 5 minutes

3. **Database monitoring**:
   - Enable MongoDB Atlas alerts
   - Set up alerts for: connections, disk usage, query performance

## Updating Production

### Backend Updates

1. Make changes and test locally
2. Commit changes to main branch
3. Deploy:
   ```bash
   # Railway
   railway up

   # Render
   # Automatically deploys on push to main

   # Fly.io
   fly deploy
   ```

### Frontend Updates

1. Make changes and test locally
2. Commit changes to main branch
3. Vercel automatically deploys on push to main
4. Or manually: `vercel --prod`

## Rollback Procedure

### Backend (Railway)

```bash
railway rollback
```

### Frontend (Vercel)

1. Go to Vercel dashboard
2. Find previous deployment
3. Click "Promote to Production"

## Troubleshooting

### Common Issues

**"Invalid origin" errors:**
- Check `FRONTEND_ORIGIN` matches actual frontend URL
- Ensure no trailing slash in origin URL
- Verify CORS configuration

**Database connection fails:**
- Check MongoDB IP allowlist
- Verify connection string is correct
- Ensure database user has correct permissions

**JWT token issues:**
- Verify `JWT_SECRET` is set and 32+ characters
- Clear browser cookies
- Check token expiration (15 min for access, 30 days for refresh)

**Email not sending:**
- Verify SMTP credentials
- Check SMTP port (587 for TLS, 465 for SSL)
- Review email logs in console (dev mode)

### Debug Mode

Enable debug logging:
```bash
# Backend
DEBUG=* npm start

# Check logs
railway logs --tail
```

## Maintenance

### Database Backups

Test restore procedure monthly:
```bash
# Download backup from MongoDB Atlas
# Restore to test database
mongorestore --uri="mongodb+srv://..." --archive=backup.gz --gzip
```

### Dependency Updates

Update dependencies monthly:
```bash
npm audit fix
npm outdated
npm update
```

### Security Patches

Apply security patches immediately:
```bash
npm audit
npm audit fix --force  # Review changes carefully
```

## Cost Estimates

### Free Tier Deployment

- **Backend**: Railway/Render free tier ($0/month)
- **Frontend**: Vercel Hobby ($0/month)
- **Database**: MongoDB Atlas Free (M0, 512MB, $0/month)
- **Total**: $0/month (suitable for hobby/demo)

### Production Deployment

- **Backend**: Railway/Render ($5-20/month)
- **Frontend**: Vercel Pro ($20/month)
- **Database**: MongoDB Atlas M10 ($57/month)
- **Monitoring**: Sentry/LogRocket ($0-50/month)
- **Total**: $82-147/month

## Support

For deployment issues:
- Check logs first: `railway logs` or `vercel logs`
- Review this guide and SECURITY.md
- Open GitHub issue with deployment platform and error details
