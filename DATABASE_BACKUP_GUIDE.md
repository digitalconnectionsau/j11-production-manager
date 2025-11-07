# Database Backup Configuration - Railway

## Automatic Backups

Railway PostgreSQL databases include automatic backups:

### ✅ How to Verify Backups Are Enabled

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project**: j11-production-manager
3. **Click on your PostgreSQL service**
4. **Navigate to "Backups" tab**

### Default Railway Backup Settings

- **Frequency**: Daily automatic backups
- **Retention**: Last 7 daily backups
- **Location**: Railway's secure backup storage
- **Cost**: Included with PostgreSQL addon

### Manual Backup (On-Demand)

To create a manual backup via CLI:

```bash
# Using Railway CLI
railway db backup create

# Or using pg_dump directly
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

#### Via Railway Dashboard:
1. Go to PostgreSQL service → Backups tab
2. Select backup to restore
3. Click "Restore" button
4. Confirm restoration (this will overwrite current database)

#### Via Command Line:
```bash
# Download backup first, then restore
psql "$DATABASE_URL" < backup_file.sql
```

### Test Restore Procedure

**⚠️ IMPORTANT**: Always test on a non-production database first!

1. **Create a test database on Railway**
2. **Download latest backup**:
   ```bash
   railway db backup download <backup-id> > test_backup.sql
   ```
3. **Restore to test database**:
   ```bash
   psql "$TEST_DATABASE_URL" < test_backup.sql
   ```
4. **Verify data integrity**:
   ```bash
   psql "$TEST_DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
   psql "$TEST_DATABASE_URL" -c "SELECT COUNT(*) FROM login_activity;"
   ```

## Disaster Recovery Plan

### 🔴 If Database Is Lost/Corrupted

1. **Stop all application instances** to prevent data inconsistency
2. **Create new PostgreSQL service** on Railway (if needed)
3. **Restore from latest backup**:
   - Via Railway Dashboard: Select backup → Restore
   - Via CLI: Use restore commands above
4. **Update DATABASE_URL** environment variable (if new service)
5. **Run database migrations** to ensure schema is up-to-date:
   ```bash
   npm run db:migrate
   ```
6. **Verify data integrity** by checking critical tables
7. **Restart application instances**
8. **Monitor error logs** for any issues

### Additional Backup Strategy (Recommended)

For extra safety, implement offsite backups:

```bash
# Daily cron job to backup to S3/Dropbox
0 2 * * * pg_dump "$DATABASE_URL" | gzip > /backups/j11_$(date +\%Y\%m\%d).sql.gz
```

## Monitoring Backup Health

Set up alerts to notify you if backups fail:

1. **Enable Railway notifications** for your PostgreSQL service
2. **Check backup status weekly** via dashboard
3. **Test restore monthly** to ensure backups are valid

## Recovery Time Objective (RTO)

- **Small database (<1GB)**: 5-10 minutes
- **Medium database (1-10GB)**: 15-30 minutes
- **Large database (>10GB)**: 30-60 minutes

## Recovery Point Objective (RPO)

- **With daily backups**: Up to 24 hours of data loss
- **To improve RPO**: Enable continuous archiving (WAL archiving)

## Backup Status: ✅

- [x] Railway automatic backups enabled by default
- [x] 7-day retention active
- [ ] **Action Required**: Verify in Railway dashboard
- [ ] **Action Required**: Test restore procedure once
- [ ] **Optional**: Set up offsite backups for extra safety
