#!/bin/sh

# Install netcat (nc) if using an image without it
echo "🔧 Updating package list and installing netcat..."
apk update && apk add netcat-openbsd

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready at $DATABASE_HOST:5432..."
until nc -z -v -w30 "$DATABASE_HOST" 5432; do
  echo "⏱️ PostgreSQL is not ready yet. Waiting..."
  sleep 1
done
echo "✅ PostgreSQL is ready."

# Run migrations
echo "📦 Running migrations..."
npx typeorm-ts-node-commonjs -d ./dist/modules/database/data-source.js migration:run
migration_exit_code=$?

if [ $migration_exit_code -ne 0 ]; then
  echo "❌ Migration failed with exit code $migration_exit_code. Exiting."
  exit $migration_exit_code
fi
echo "✅ Migrations completed successfully."

# Start the application
echo "🚀 Starting the application..."
node dist/main.js
