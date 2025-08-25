#!/bin/bash

# ========== 🔐 НАСТРОЙКИ ==========
SSH_KEY="$HOME/.ssh/id_rsa_main-22"    # Путь до SSH-ключа
USER="root"                            # Логин
HOST="5.129.235.249"                   # IP сервера
REMOTE_DIR="/var/www/tg-multiplier"   # Путь на сервере
LOCAL_DIST_DIR="dist"                 # Папка после билда
NGINX_CONTAINER_NAME="tg-multiplier-nginx" # Имя контейнера nginx

# ========== 🚧 СБОРКА ==========
echo "📦 Собираем фронт..."
npm run build || { echo "❌ Сборка провалилась"; exit 1; }

# ========== 🧹 ЧИСТИМ СТАРЫЙ БИЛД НА СЕРВЕРЕ ==========
echo "🧹 Удаляем старый dist на сервере..."
ssh -i "$SSH_KEY" "$USER@$HOST" "rm -rf $REMOTE_DIR/*"

# ========== 🚀 ЗАЛИВАЕМ НОВЫЙ БИЛД ==========
echo "🚀 Копируем dist + Dockerfile + nginx.conf на сервер..."
scp -i "$SSH_KEY" -r "$LOCAL_DIST_DIR" Dockerfile nginx.conf "$USER@$HOST:$REMOTE_DIR"

# ========== 🔨 Сборка нового Docker-образа ==========
echo "🔨 Собираем новый Docker-образ для nginx..."
ssh -i "$SSH_KEY" "$USER@$HOST" "cd $REMOTE_DIR && docker build -t tg-multiplier-nginx ."

# ========== 🔁 Удаляем старый контейнер и запускаем новый ==========
echo "🔁 Перезапускаем контейнер $NGINX_CONTAINER_NAME с новым образом..."
ssh -i "$SSH_KEY" "$USER@$HOST" "docker rm -f $NGINX_CONTAINER_NAME || true && docker run -d --name $NGINX_CONTAINER_NAME --network multiplier-net -p 80:80 tg-multiplier-nginx"

# ========== ✅ ГОТОВО ==========
echo "✅ Готово! Фронт обновлён на сервере и nginx перезапущен."