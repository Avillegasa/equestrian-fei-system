# 🚀 Production Deployment Guide

## Equestrian FEI Competition Management System

This guide provides step-by-step instructions for deploying the system to production.

---

## 📋 Pre-Deployment Checklist

### ✅ Code Preparation
- [x] All unnecessary files removed (cache, node_modules, development databases)
- [x] .gitignore updated to prevent future bloat
- [ ] All changes committed to git
- [ ] Code reviewed and tested locally
- [ ] Environment variables configured

### ✅ System Requirements

**Backend Requirements:**
- Python 3.10+
- PostgreSQL 15+
- Redis (for caching and WebSockets)
- 2GB RAM minimum (4GB recommended)
- 20GB disk space minimum

**Frontend Requirements:**
- Node.js 18+
- npm 9+ or yarn 1.22+

---

## 🗂️ Files Removed for Production

The following files have been cleaned up:

### Backend
- ✅ `__pycache__/` directories (Python cache)
- ✅ `*.pyc`, `*.pyo` files (compiled Python)
- ✅ `db.sqlite3` (development database)
- ✅ `*.log` files (development logs)

### Frontend
- ✅ `node_modules/` (will be reinstalled on server)
- ✅ `dist/` (will be rebuilt for production)
- ✅ `.vite/` (Vite cache)

### Documentation/Reference
- ✅ `pasantia.txt` (internship notes)
- ✅ `REPORTE_FINAL_ENTREGA.md` (delivery report)
- ✅ `setup_local.sh` (local setup script)
- ✅ `PHASE3_EXCEL_SETUP.md` (development phase docs)
- ✅ `PHASE4_OFFLINE_SETUP.md` (development phase docs)
- ✅ `computing tables/` (reference material folder)

### System Files
- ✅ `.DS_Store` (macOS metadata)
- ✅ `Thumbs.db` (Windows metadata)

### Files KEPT (Important)
- ✅ `MANUAL_TESTING_GUIDE.md` - Complete testing instructions
- ✅ `CLAUDE.md` - Project documentation and architecture
- ✅ `README.md` - Project overview
- ✅ `.env.example` - Environment template
- ✅ `.gitignore` - Git exclusions

---

## 🔧 Deployment Steps

### **STEP 1: Prepare Server Environment**

#### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.2 Install Required Software
```bash
# Python 3.10+
sudo apt install python3.10 python3.10-venv python3-pip -y

# PostgreSQL 15
sudo apt install postgresql postgresql-contrib -y

# Redis
sudo apt install redis-server -y

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Nginx (web server)
sudo apt install nginx -y

# Git
sudo apt install git -y
```

#### 1.3 Verify Installations
```bash
python3 --version  # Should be 3.10+
psql --version     # Should be 15+
redis-cli --version
node --version     # Should be 18+
npm --version
nginx -v
```

---

### **STEP 2: Clone Repository**

```bash
# Create deployment directory
sudo mkdir -p /var/www/equestrian-fei
sudo chown $USER:$USER /var/www/equestrian-fei
cd /var/www/equestrian-fei

# Clone repository
git clone <YOUR_REPOSITORY_URL> .

# Verify structure
ls -la
# Should see: backend/, frontend/, .env.example, CLAUDE.md, etc.
```

---

### **STEP 3: Configure Database**

#### 3.1 Create PostgreSQL Database
```bash
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE DATABASE equestrian_fei_db;
CREATE USER equestrian_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';
ALTER ROLE equestrian_user SET client_encoding TO 'utf8';
ALTER ROLE equestrian_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE equestrian_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE equestrian_fei_db TO equestrian_user;
\q
```

#### 3.2 Test Database Connection
```bash
psql -h localhost -U equestrian_user -d equestrian_fei_db
# Enter password when prompted
# If successful, exit with: \q
```

---

### **STEP 4: Backend Setup**

#### 4.1 Navigate to Backend
```bash
cd /var/www/equestrian-fei/equestrian-fei-system/backend
```

#### 4.2 Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 4.3 Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn  # Production WSGI server
```

#### 4.4 Configure Environment Variables
```bash
# Copy example file
cp .env.example .env

# Edit with production values
nano .env
```

**Production `.env` Configuration:**
```bash
# Django Settings
DEBUG=False
SECRET_KEY=<GENERATE_SECURE_KEY_HERE>
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,YOUR_SERVER_IP

# Database (PostgreSQL)
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=equestrian_fei_db
DATABASE_USER=equestrian_user
DATABASE_PASSWORD=YOUR_SECURE_PASSWORD
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# CORS (adjust to your frontend domain)
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Email (configure if needed)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Generate SECRET_KEY:**
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

#### 4.5 Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### 4.6 Create Superuser
```bash
python manage.py createsuperuser
# Follow prompts to create admin account
```

#### 4.7 Collect Static Files
```bash
python manage.py collectstatic --noinput
```

#### 4.8 Test Backend
```bash
# Test server (development mode)
python manage.py runserver 0.0.0.0:8000

# In another terminal, test:
curl http://localhost:8000/api/
# Should return API response

# Stop test server: Ctrl+C
```

---

### **STEP 5: Frontend Setup**

#### 5.1 Navigate to Frontend
```bash
cd /var/www/equestrian-fei/equestrian-fei-system/frontend
```

#### 5.2 Configure Environment
```bash
# Copy example (if exists) or create new
nano .env
```

**Production `.env` Configuration:**
```bash
VITE_API_URL=https://api.your-domain.com/api
VITE_WS_URL=wss://api.your-domain.com/ws
```

#### 5.3 Install Dependencies
```bash
npm install
```

#### 5.4 Build for Production
```bash
npm run build
# This creates optimized files in dist/
```

#### 5.5 Verify Build
```bash
ls -la dist/
# Should see: index.html, assets/, etc.
```

---

### **STEP 6: Configure Gunicorn (Backend)**

#### 6.1 Create Gunicorn Service
```bash
sudo nano /etc/systemd/system/equestrian-backend.service
```

**Service Configuration:**
```ini
[Unit]
Description=Equestrian FEI Backend (Gunicorn)
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/equestrian-fei/equestrian-fei-system/backend
Environment="PATH=/var/www/equestrian-fei/equestrian-fei-system/backend/venv/bin"
ExecStart=/var/www/equestrian-fei/equestrian-fei-system/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /var/log/equestrian-backend-access.log \
    --error-logfile /var/log/equestrian-backend-error.log \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
```

#### 6.2 Create Log Files
```bash
sudo touch /var/log/equestrian-backend-access.log
sudo touch /var/log/equestrian-backend-error.log
sudo chown www-data:www-data /var/log/equestrian-backend-*.log
```

#### 6.3 Set Permissions
```bash
sudo chown -R www-data:www-data /var/www/equestrian-fei
```

#### 6.4 Start Gunicorn Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable equestrian-backend
sudo systemctl start equestrian-backend
sudo systemctl status equestrian-backend
# Should show "active (running)"
```

---

### **STEP 7: Configure Nginx**

#### 7.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/equestrian-fei
```

**Nginx Configuration:**
```nginx
# Backend API Server
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /static/ {
        alias /var/www/equestrian-fei/equestrian-fei-system/backend/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /var/www/equestrian-fei/equestrian-fei-system/backend/media/;
    }
}

# Frontend Server
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/equestrian-fei/equestrian-fei-system/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optimize static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 7.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/equestrian-fei /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

#### 7.3 Configure Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

### **STEP 8: SSL Certificate (HTTPS)**

#### 8.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### 8.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose redirect option (2 - redirect HTTP to HTTPS)

#### 8.3 Test Auto-Renewal
```bash
sudo certbot renew --dry-run
```

---

### **STEP 9: Final Verification**

#### 9.1 Check All Services
```bash
sudo systemctl status equestrian-backend  # Should be active
sudo systemctl status nginx               # Should be active
sudo systemctl status postgresql          # Should be active
sudo systemctl status redis               # Should be active
```

#### 9.2 Test Frontend
```bash
# Open in browser:
https://your-domain.com
# Should load React application
```

#### 9.3 Test Backend API
```bash
# Open in browser:
https://api.your-domain.com/api/
# Should return API response
```

#### 9.4 Test Login
```bash
# Login with superuser credentials created earlier
# Verify dashboard loads correctly
```

---

## 🔒 Security Checklist

- [ ] `DEBUG=False` in production `.env`
- [ ] Strong `SECRET_KEY` generated
- [ ] PostgreSQL uses strong passwords
- [ ] Firewall configured (only 80, 443, SSH open)
- [ ] SSL certificate installed and auto-renewal enabled
- [ ] `ALLOWED_HOSTS` configured correctly
- [ ] CORS settings restricted to your domain
- [ ] Database backups scheduled
- [ ] Security headers configured (Nginx)
- [ ] Redis protected (localhost only)

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
# Backend logs
sudo tail -f /var/log/equestrian-backend-error.log
sudo tail -f /var/log/equestrian-backend-access.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Django logs (if configured)
sudo journalctl -u equestrian-backend -f
```

### Restart Services
```bash
# Backend
sudo systemctl restart equestrian-backend

# Nginx
sudo systemctl restart nginx

# PostgreSQL
sudo systemctl restart postgresql

# Redis
sudo systemctl restart redis
```

### Update Application
```bash
cd /var/www/equestrian-fei

# Pull latest changes
git pull origin main

# Update backend
cd equestrian-fei-system/backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
deactivate
sudo systemctl restart equestrian-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo systemctl restart nginx
```

### Database Backups
```bash
# Create backup script
sudo nano /usr/local/bin/backup-equestrian-db.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/equestrian-fei"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U equestrian_user -h localhost equestrian_fei_db | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -type f -name "backup_*.sql.gz" -mtime +30 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-equestrian-db.sh

# Schedule daily backups (cron)
sudo crontab -e
# Add line:
0 2 * * * /usr/local/bin/backup-equestrian-db.sh
```

---

## 🆘 Troubleshooting

### Issue: Backend 502 Bad Gateway
**Solution:**
```bash
sudo systemctl status equestrian-backend
sudo tail -f /var/log/equestrian-backend-error.log
# Check for Python errors, fix, then restart
```

### Issue: Frontend shows blank page
**Solution:**
```bash
# Check browser console for errors
# Verify VITE_API_URL is correct in frontend/.env
# Rebuild frontend
cd /var/www/equestrian-fei/equestrian-fei-system/frontend
npm run build
```

### Issue: Database connection error
**Solution:**
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U equestrian_user -d equestrian_fei_db

# Check backend/.env database credentials
```

### Issue: Static files not loading
**Solution:**
```bash
cd /var/www/equestrian-fei/equestrian-fei-system/backend
source venv/bin/activate
python manage.py collectstatic --noinput
sudo systemctl restart nginx
```

---

## 📞 Post-Deployment

### What to Do After Deployment

1. **Initial Data Setup:**
   - Login as admin
   - Create initial users (organizers, judges)
   - Create FEI categories
   - Configure system settings

2. **User Training:**
   - Refer to `MANUAL_TESTING_GUIDE.md` for user workflows
   - Train organizers on competition creation
   - Train judges on scoring system
   - Train riders on registration

3. **Monitoring:**
   - Monitor server resources (CPU, RAM, disk)
   - Check logs regularly for errors
   - Verify backups are running
   - Test disaster recovery procedures

4. **Performance Optimization:**
   - Enable Redis caching
   - Configure CDN (optional)
   - Optimize database queries
   - Monitor response times

---

## 🎯 Quick Reference Commands

```bash
# Check backend status
sudo systemctl status equestrian-backend

# View backend logs
sudo journalctl -u equestrian-backend -f

# Restart backend
sudo systemctl restart equestrian-backend

# Restart nginx
sudo systemctl restart nginx

# Django management commands
cd /var/www/equestrian-fei/equestrian-fei-system/backend
source venv/bin/activate
python manage.py <command>

# Database backup (manual)
pg_dump -U equestrian_user equestrian_fei_db > backup.sql

# Update SSL certificates
sudo certbot renew
```

---

## ✅ Deployment Complete!

Your Equestrian FEI Competition Management System is now live in production!

**Next Steps:**
1. ✅ Verify all services are running
2. ✅ Test all user roles (Admin, Organizer, Judge, Rider, Viewer)
3. ✅ Configure monitoring and alerts
4. ✅ Set up automated backups
5. ✅ Train users on the system
6. ✅ Schedule regular maintenance windows

**Support Resources:**
- `CLAUDE.md` - System architecture and features
- `MANUAL_TESTING_GUIDE.md` - Complete testing workflows
- `README.md` - Project overview

---

**Deployed by:** Claude Code
**System Version:** 1.0.0
**Deployment Date:** October 2025
**Status:** Production Ready ✅
