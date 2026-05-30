#!/usr/bin/env bash
if [[ $# -gt 0 ]]; then
  echo "Execute Command: $@"
  exec "$@"
  exit 0
fi

echo "RUNNING Dandonito app Backend..."

echo "Waiting for Dandonito app Backend POSTGRESQL Database..."
while ! nc -z ${POSTGRES_HOST} ${POSTGRES_PORT}; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "Connected to Dandonito Backend POSTGRESQL Database"

python /home/Dandonito_app/manage.py makemigrations --noinput
python /home/Dandonito_app/manage.py migrate --noinput

if [ $? -ne 0 ]; then
  echo "Migration Dandonito app Backend POSTGRESQL DB failed." >&2
  exit 1
fi

echo "Creating superuser if not exists..."
python /home/Dandonito_app/manage.py shell < /home/Dandonito_app/scripts/create_superuser.py

# python /home/spad_app/user/initFormula.py #TODO:finish this 
echo "Starting Gunicorn for wrench ..."

exec gunicorn config.wsgi:application \
  --name spod_app-gunicorn \
  --bind 0.0.0.0:${APP_PORT:-8080} \
  --workers ${GUNICORN_WORKER_NUMBER} \
  --pythonpath "/home/Dandonito_app/" \
  --log-level=info \
  --log-file=- \
  --timeout ${GUNICORN_TIMEOUT} \
  --reload
