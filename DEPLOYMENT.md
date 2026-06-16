# BlockStop-Office Deployment Guide

## Quick Start

### 1. Initial Setup

```bash
# Navigate to project directory
cd /home/user/BlockStop-Office

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit with your configuration
nano .env.local  # or your preferred editor
```

### 2. Database Setup

#### Local PostgreSQL Setup
```bash
# Create database
createdb blockstop_office

# Create user
createuser blockstop_user
psql -U postgres -c "ALTER USER blockstop_user WITH PASSWORD 'your_secure_password';"

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE blockstop_office TO blockstop_user;"

# Initialize schema
npm run db:setup

# Verify schema
psql blockstop_office -c "\dt"
```

#### Update .env.local
```
DATABASE_URL=postgresql://blockstop_user:your_secure_password@localhost:5432/blockstop_office
```

### 3. Authentication Setup

#### Generate NextAuth Secret
```bash
# Using OpenSSL
openssl rand -base64 32

# Set in .env.local
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev

# Application will be available at http://localhost:3000
```

## SAML Configuration

### 1. Prepare Your Identity Provider
- Obtain the SAML entry point URL
- Extract the certificate
- Configure the Assertion Consumer Service (ACS) URL

### 2. Update .env.local
```
SAML_ENTRY_POINT=https://your-idp.example.com/app/123/sso/saml
SAML_ISSUER=blockstop-office
SAML_CERT=-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJC...
-----END CERTIFICATE-----
```

### 3. Configure ACS URL in IdP
```
https://your-domain.com/auth/sso/callback?provider=saml
```

## OAuth Configuration

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   ```
   http://localhost:3000/auth/sso/callback?provider=google
   https://your-domain.com/auth/sso/callback?provider=google
   ```
6. Copy Client ID and Secret to .env.local

### Microsoft OAuth
1. Go to [Azure App Registrations](https://portal.azure.com)
2. Create new application
3. Add Web platform
4. Add redirect URIs:
   ```
   http://localhost:3000/auth/sso/callback?provider=microsoft
   https://your-domain.com/auth/sso/callback?provider=microsoft
   ```
5. Create client secret
6. Copy Application ID and secret to .env.local

## Production Deployment

### 1. Build Application
```bash
npm run build

# Verify build succeeded
ls -la .next/
```

### 2. Environment Setup
```
NODE_ENV=production
NEXTAUTH_SECRET=<strong-random-secret>
DATABASE_URL=postgresql://user:password@prod-db:5432/blockstop_office
NEXTAUTH_URL=https://blockstop.yourdomain.com
```

### 3. Database Backups
```bash
# Create daily backup script
cat > /usr/local/bin/backup-blockstop.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump blockstop_office | gzip > /backups/blockstop_$TIMESTAMP.sql.gz
# Keep only last 30 days
find /backups -name "blockstop_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-blockstop.sh

# Add to crontab
0 2 * * * /usr/local/bin/backup-blockstop.sh
```

### 4. Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

USER nextjs
EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: blockstop_office
      POSTGRES_USER: blockstop_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./blockos/init-db-enterprise.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U blockstop_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  blockstop-office:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://blockstop_user:${DB_PASSWORD}@postgres:5432/blockstop_office
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
```

#### Start with Docker Compose
```bash
# Create .env.docker file
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
DB_PASSWORD=secure_password

# Run
docker-compose up -d

# Verify
docker-compose logs -f blockstop-office
```

### 5. Nginx Configuration
```nginx
upstream blockstop {
    server localhost:3000;
}

server {
    listen 80;
    server_name blockstop.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blockstop.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/blockstop.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blockstop.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://blockstop;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
}
```

### 6. SSL Certificate
```bash
# Using Let's Encrypt
certbot certonly --standalone -d blockstop.yourdomain.com

# Auto-renewal with cron
0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring & Maintenance

### 1. Health Checks
```bash
# Monitor application health
curl -s http://localhost:3000/api/health | jq .

# Add to monitoring system
* * * * * curl -f http://localhost:3000/api/health || alert
```

### 2. Logging
```bash
# View application logs
docker-compose logs -f blockstop-office

# Or with systemd
journalctl -u blockstop-office -f

# Rotate logs
logrotate /etc/logrotate.d/blockstop
```

### 3. Database Maintenance
```bash
# Vacuum and analyze
psql blockstop_office -c "VACUUM ANALYZE;"

# Check database size
psql blockstop_office -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### 4. Clean Old Audit Logs
```bash
# Add to crontab to run weekly
0 3 * * 0 psql blockstop_office -c "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';"
```

## Security Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Enable HTTPS in production
- [ ] Configure database password
- [ ] Set appropriate database user permissions
- [ ] Enable database backups
- [ ] Configure IP restrictions (if needed)
- [ ] Set up intrusion detection
- [ ] Enable audit logging
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql postgresql://blockstop_user@localhost/blockstop_office

# Check connection pool
psql blockstop_office -c "SELECT count(*) FROM pg_stat_activity;"
```

### Authentication Issues
```bash
# Verify NextAuth configuration
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL

# Check JWT
npm run type-check
```

### Performance Issues
```bash
# Check slow queries
psql blockstop_office -c "
  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
  SELECT query, calls, total_time FROM pg_stat_statements
  ORDER BY total_time DESC LIMIT 10;"
```

## Support

Contact the development team for deployment assistance.
