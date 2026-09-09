FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint-course-auth.sh /docker-entrypoint.d/15-course-auth.sh
RUN chmod 755 /docker-entrypoint.d/15-course-auth.sh
COPY index.html /usr/share/nginx/html/index.html
COPY assets /usr/share/nginx/html/assets
COPY topics /usr/share/nginx/html/topics
