#!/bin/bash
# ===================================================
# سكريبت الإعداد - موقع بكلمة
# شغّله مرة واحدة على سيرفر name.com VPS
# ===================================================

set -e

echo "==> تثبيت Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> تثبيت PM2..."
sudo npm install -g pm2

echo "==> تثبيت nginx..."
sudo apt-get install -y nginx

echo "==> نسخ إعدادات nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/biklima
sudo ln -sf /etc/nginx/sites-available/biklima /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "==> إعداد ملف البيئة..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  عدّل ملف .env وأضف قيمك الحقيقية ثم شغّل: pm2 start ecosystem.config.cjs"
else
  echo "✓ ملف .env موجود"
fi

echo "==> تشغيل السيرفر..."
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -1 | sudo bash

echo "==> تثبيت SSL مجاني (اختياري)..."
echo "شغّل: sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d biklima.com -d www.biklima.com"

echo ""
echo "✅ تم الإعداد! الموقع يعمل على المنفذ 3000"
