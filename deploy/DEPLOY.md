# Deploying Storm AI to the VPS

Target: `stormai.decodersdigital.net` -> `/var/www/stormai` (nginx -> uvicorn on 127.0.0.1:8010, React build served by nginx).
Run everything as root on the VPS. Other apps live in `/var/www` (ehr, hrms, medai...); nothing below touches them.

## 0. Pre-flight checks (read-only)

```bash
curl -4 -s ifconfig.me; echo                      # this server's public IP
dig +short stormai.decodersdigital.net            # must print the SAME IP (DNS A record)
python3 --version; node -v; nginx -v
ss -tlnp | grep -E ':(80|443|8010)\s'             # 8010 must NOT be listed; if it is, pick another port
ls /etc/nginx/sites-enabled
ufw status
```
- If DNS does not match, add an **A record** `stormai` -> server IP at your DNS provider and wait before step 7.
- If port 8010 is taken, use a free one and change it in BOTH `stormai-backend.service` and `nginx-stormai.conf`.

## 1. System packages

```bash
apt update
apt install -y git nginx python3-venv python3-pip certbot python3-certbot-nginx
```
Frontend build needs **Node >= 20.19** (Vite 7). Check `node -v`.
Do NOT upgrade the system Node if other apps use it. If it is too old, use "Option B" in step 5.

## 2. Get the code

```bash
cd /var/www
git clone https://github.com/Hamza-Kahloon786/Saas.git stormai
cd stormai && git log --oneline -3
```
(If the repo is private, use a GitHub personal access token as the password.)

## 3. Backend

```bash
cd /var/www/stormai/Backend
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

cp ../deploy/backend.env.production.example .env
nano .env                       # fill every CHANGE_ME (generate SECRET_KEY with: openssl rand -hex 32)
chown root:www-data .env && chmod 640 .env

mkdir -p logs uploads/avatars uploads/documents
chown -R www-data:www-data logs uploads
```
- `requirements.txt` is pinned from Python 3.12. If `python3 --version` is 3.10/3.11 and pip fails, install 3.12 (`add-apt-repository ppa:deadsnakes/ppa`, `apt install python3.12 python3.12-venv`) and create the venv with `python3.12 -m venv venv`.
- **MongoDB Atlas:** add this server's IP under *Network Access*, or the app cannot connect.
- Same `DATABASE_NAME` as your local app = same data. Use a new name (e.g. `stormai_prod`) if you want a fresh database.

Quick manual test, then stop it with Ctrl+C:
```bash
sudo -u www-data ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010
# in a second terminal:  curl -s http://127.0.0.1:8010/health
```

Run it as a service:
```bash
cp ../deploy/stormai-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now stormai-backend
systemctl status stormai-backend --no-pager
curl -s http://127.0.0.1:8010/health
journalctl -u stormai-backend -n 50 --no-pager     # logs if something is wrong
```

## 4. Frontend env

```bash
cd /var/www/stormai/Frontend
cp ../deploy/frontend.env.production.example .env.production
nano .env.production            # set the publishable keys
```

## 5. Frontend build

**Option A, build on the server** (Node >= 20.19):
```bash
npm ci || npm install
npx vite build                  # NOT `npm run build`: its tsc step fails on existing type errors
ls dist/index.html
```
If the build is "Killed", the server is out of RAM: add 2 GB swap (`fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`) and retry.

**Option B, build on your own PC and upload** (no Node needed on the server):
```powershell
cd "C:\Users\LENOVO\3D Objects\job\Saas\Frontend"
copy ..\deploy\frontend.env.production.example .env.production   # then edit it
npx vite build
scp -r dist root@YOUR_SERVER_IP:/var/www/stormai/Frontend/
```

## 6. nginx

```bash
cp /var/www/stormai/deploy/nginx-stormai.conf /etc/nginx/sites-available/stormai
ln -s /etc/nginx/sites-available/stormai /etc/nginx/sites-enabled/stormai
nginx -t && systemctl reload nginx
ufw allow 'Nginx Full'          # only if ufw is active
```

## 7. HTTPS

```bash
certbot --nginx -d stormai.decodersdigital.net
```
Choose "redirect HTTP to HTTPS". Then open https://stormai.decodersdigital.net .

## 8. External services (important)

| Service | What to set |
|---|---|
| Google Cloud Console > OAuth client | Authorized redirect URI: `https://stormai.decodersdigital.net/api/v1/auth/google/callback`; Authorized JavaScript origin: `https://stormai.decodersdigital.net` |
| Stripe > Developers > Webhooks | Endpoint `https://stormai.decodersdigital.net/api/v1/auth/stripe/webhook`; copy its signing secret into `STRIPE_WEBHOOK_SECRET` |
| Twilio > phone number > SMS webhook | `https://stormai.decodersdigital.net/api/v1/ai/webhooks/twilio` |
| MongoDB Atlas | Network Access: allow the VPS IP |

After editing `Backend/.env`: `systemctl restart stormai-backend`.

## 9. Smoke test

- `curl -s https://stormai.decodersdigital.net/health` -> status healthy
- Open the site, log in, create a record, try "Forgot password".
- `journalctl -u stormai-backend -f` while testing.

## Updating later

```bash
cd /var/www/stormai && git pull
cd Backend && ./venv/bin/pip install -r requirements.txt && systemctl restart stormai-backend
cd ../Frontend && npm ci && npx vite build          # or Option B
```

## Troubleshooting

- **502 Bad Gateway:** backend is down -> `systemctl status stormai-backend`, `journalctl -u stormai-backend -n 100`.
- **Blank page / API calls to localhost:** `.env.production` was missing at build time; recreate it and rebuild.
- **CORS errors:** `BACKEND_CORS_ORIGINS` must be exactly `https://stormai.decodersdigital.net`.
- **DB errors at startup:** Atlas IP allowlist or wrong `MONGODB_URL`.
- **Google login redirect_uri_mismatch:** step 8 redirect URI does not match `GOOGLE_REDIRECT_URI` character for character.
