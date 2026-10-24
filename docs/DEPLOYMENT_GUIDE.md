# RouteShield — Production Deployment Guide

## 1. Prerequisites

- A cloud virtual machine (AWS EC2, Ubuntu 22.04 LTS or Debian 12 recommended)
- Docker & Docker Compose v2+ installed
- Domain name with DNS A record pointing to the server IP
- Free Let's Encrypt SSL/TLS Certificate (via Certbot / Nginx reverse proxy)

---

## 2. Docker Compose Deployment (Recommended)

### Step 1: Clone the repository and configure environment
```bash
git clone <repository_url> routeshield
cd routeshield
cp .env.example .env
```

### Step 2: Configure Production Environment Variables
Edit `.env` using `nano .env`:
- Set `NODE_ENV=production`
- Generate a 64-character hex secret for `JWT_SECRET`:
  ```bash
  openssl rand -hex 32
  ```
- Generate a random string for `COOKIE_SECRET`
- Provide your production domain in `FRONTEND_URL` (e.g. `https://routeshield.yourdomain.com`)
- Set a descriptive Nominatim contact email in `NOMINATIM_USER_AGENT`

### Step 3: Launch Containers
```bash
docker compose up -d --build
```

### Step 4: Verify Health Status
```bash
docker compose ps
curl -i http://localhost:5000/api/health
```

---

## 3. Nginx Reverse Proxy with HTTPS (Certbot)

Install Nginx and Certbot:
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure `/etc/nginx/sites-available/routeshield`:
```nginx
server {
    server_name routeshield.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

Enable site and acquire SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/routeshield /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d routeshield.yourdomain.com
```

---

## 4. MongoDB Atlas Connection (Alternative to Local Docker Mongo)

If connecting to MongoDB Atlas cloud:
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a Cluster (e.g., M0 Free Tier).
3. Under Database Access, create a database user and password.
4. Under Network Access, add the static IP of your production server.
5. In `.env`, update `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/routeshield?retryWrites=true&w=majority
   ```
6. RouteShield automatically initializes required `2dsphere` indexes on launch.
