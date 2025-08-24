FROM nginx:alpine

# Скопировать билд в стандартную папку nginx
COPY dist/ /usr/share/nginx/html/

# Копируем наш конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4000

CMD ["nginx", "-g", "daemon off;"]