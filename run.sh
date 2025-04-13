#!/bin/bash
set -e

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"

# Check if nc is available (for Linux/macOS)
if command -v nc &> /dev/null; then
  # If `nc` (netcat) is available
  echo "Waiting for database to be ready"
  while ! nc -z $DB_HOST $DB_PORT; do
    echo "Waiting for connection to $DB_HOST:$DB_PORT..."
    sleep 0.1
  done
else
  # Windows-specific approach using PowerShell
  echo "Waiting for database to be ready"
  while ! powershell -Command "[System.Net.Sockets.TcpClient]::new('$DB_HOST', $DB_PORT).Connected"; do
    echo "Waiting for connection to $DB_HOST:$DB_PORT..."
    sleep 0.1
  done
fi

echo "Database is up, starting migrations"
npm run migrations:up & PID=$!
# Wait for migration to finish
wait $PID
echo "Migration finished"

# Run the seeders in order
echo "Running seeder: RoleSeeder"
npm run seed:run -- -n RoleSeeder

echo "Running seeder: PermissionSeeder"
npm run seed:run -- -n PermissionSeeder

echo "Running seeder: AdminUserSeeder"
npm run seed:run -- -n AdminUserSeeder

echo "Running seeder: RolePermissionSeeder"
npm run seed:run -- -n RolePermissionSeeder

# Start the server
echo "Starting server"
npm run start
