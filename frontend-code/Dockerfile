FROM nginx:alpine

# Xóa default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy cấu hình nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy toàn bộ code frontend vào thư mục phục vụ của nginx
COPY . /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
