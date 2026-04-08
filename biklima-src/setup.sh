#!/bin/bash
set -e
echo ""
echo "========================================"
echo "  إعداد موقع بكلمة على السيرفر"
echo "========================================"
echo ""

# 1. Install Node.js 20
if ! command -v node &> /dev/null; then
  echo "==> تثبيت Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "✓ Node.js موجود: $(node -v)"
fi

# 2. Install PM2
if ! command -v pm2 &> /dev/null; then
  echo "==> تثبيت PM2..."
  sudo npm install -g pm2
else
  echo "✓ PM2 موجود"
fi

# 3. Install nginx
if ! command -v nginx &> /dev/null; then
  echo "==> تثبيت nginx..."
  sudo apt-get install -y nginx
else
  echo "✓ nginx موجود"
fi

# 4. Setup nginx
echo "==> إعداد nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/biklima
sudo ln -sf /etc/nginx/sites-available/biklima /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "✓ nginx جاهز"

# 5. Install Node.js dependencies
echo "==> تثبيت اعتمادية Node.js..."
npm install --omit=dev
echo "✓ تم تثبيت الاعتمادية"

# 6. Check .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  يجب تعبئة ملف .env أولاً:"
  echo "   nano .env"
  echo ""
  echo "بعد التعبئة شغّل:"
  echo "   node migrate.js && pm2 start ecosystem.config.cjs && pm2 save"
  exit 0
fi

# 7. Run DB migration
echo "==> إعداد قاعدة البيانات..."
node migrate.js

# 8. Start server
echo "==> تشغيل السيرفر..."
pm2 delete biklima 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# 9. Setup PM2 startup
pm2 startup | grep "sudo" | bash || true

echo ""
echo "========================================"
echo "  ✅ تم الإعداد! الموقع يعمل الآن"
echo "========================================"
echo ""
echo "أوامر مفيدة:"
echo "  pm2 status          - حالة السيرفر"
echo "  pm2 logs biklima    - عرض السجلات"
echo "  pm2 restart biklima - إعادة التشغيل"
echo ""
echo "لتفعيل HTTPS:"
echo "  apt install -y certbot python3-certbot-nginx"
echo "  certbot --nginx -d bikalima.com -d www.bikalima.com"
