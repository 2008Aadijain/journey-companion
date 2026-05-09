# Production Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] Create production Supabase project
- [ ] Set up production environment variables
- [ ] Configure OAuth providers (Google, etc.)
- [ ] Enable Row Level Security on all tables
- [ ] Run database migrations
- [ ] Set up database backup strategy

### Security Configuration
- [ ] Verify all environment variables are set correctly
- [ ] Confirm RLS policies are active
- [ ] Test authentication flows
- [ ] Validate OAuth redirect URLs
- [ ] Check CORS settings in Supabase

### Application Testing
- [ ] Run full test suite: `npm test`
- [ ] Build production bundle: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Verify all routes work correctly
- [ ] Test authentication and protected routes
- [ ] Check responsive design on mobile

## Deployment

### Hosting Setup
- [ ] Choose hosting provider (Vercel, Netlify, etc.)
- [ ] Configure build settings
- [ ] Set up environment variables in hosting platform
- [ ] Configure custom domain (if applicable)
- [ ] Set up SSL certificate

### Database Migration
- [ ] Backup production database
- [ ] Run migration scripts in correct order
- [ ] Verify data integrity
- [ ] Test application with migrated data

### DNS & Domain
- [ ] Update DNS records
- [ ] Configure domain in hosting platform
- [ ] Set up SSL certificate
- [ ] Test domain resolution

## Post-Deployment

### Verification
- [ ] Test all user flows
- [ ] Verify authentication works
- [ ] Check data loading and saving
- [ ] Test real-time features
- [ ] Monitor error logs

### Monitoring & Analytics
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure analytics (Google Analytics, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation

### Performance Optimization
- [ ] Enable caching headers
- [ ] Optimize images and assets
- [ ] Set up CDN if needed
- [ ] Monitor Core Web Vitals

### Security Audit
- [ ] Run security scan
- [ ] Check for exposed credentials
- [ ] Verify HTTPS everywhere
- [ ] Test rate limiting
- [ ] Review access logs

## Rollback Plan

### Emergency Procedures
- [ ] Document rollback steps
- [ ] Keep previous version deployable
- [ ] Test rollback procedure
- [ ] Have backup database ready

### Communication
- [ ] Notify team of deployment
- [ ] Prepare user communication if needed
- [ ] Monitor user feedback
- [ ] Have support channels ready

## Maintenance

### Regular Tasks
- [ ] Monitor application health
- [ ] Review and update dependencies
- [ ] Check security vulnerabilities
- [ ] Optimize database performance
- [ ] Update SSL certificates

### Backup Strategy
- [ ] Daily database backups
- [ ] Weekly full application backups
- [ ] Test backup restoration
- [ ] Document backup procedures

---

## Environment Variables Template

```env
# Production Environment Variables
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_SUPABASE_REDIRECT_URL=https://yourdomain.com
VITE_APP_NAME=GoalCircle
VITE_APP_DESCRIPTION=GoalCircle pairs you with an accountability partner...
```

## Common Issues & Solutions

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors
- Ensure environment variables are set

### Authentication Issues
- Verify Supabase credentials
- Check OAuth provider configuration
- Confirm redirect URLs match
- Test RLS policies

### Performance Issues
- Check bundle size with `npm run build`
- Optimize images and assets
- Implement code splitting
- Set up caching strategies

### Database Issues
- Verify connection string
- Check RLS policies
- Monitor query performance
- Review database indexes