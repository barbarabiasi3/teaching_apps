#!/bin/sh
set -eu

if [ -z "${COURSE_ACCESS_HASH:-}" ]; then
  echo "COURSE_ACCESS_HASH must be set before nginx starts." >&2
  exit 1
fi

printf 'student:%s\n' "$COURSE_ACCESS_HASH" > /etc/nginx/.htpasswd
chown root:nginx /etc/nginx/.htpasswd
chmod 640 /etc/nginx/.htpasswd
