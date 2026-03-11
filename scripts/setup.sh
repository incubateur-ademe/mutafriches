#!/bin/bash
set -e

echo "== Mutafriches - Setup =="
echo ""

# 1. Copier .env si absent
if [ ! -f apps/api/.env ]; then
  cp .env.example apps/api/.env
  echo "[OK] .env copie dans apps/api/"
else
  echo "[OK] apps/api/.env existe deja"
fi

# 2. Installer les dependances
echo ""
echo "Installation des dependances..."
pnpm install

# 3. Demarrer PostgreSQL
echo ""
echo "Demarrage de PostgreSQL (Docker)..."
pnpm db:start

# 4. Attendre que PostgreSQL soit pret
echo "Attente de PostgreSQL..."
until docker exec mutafriches-postgres pg_isready -U mutafriches_user -d mutafriches > /dev/null 2>&1; do
  sleep 1
done
echo "[OK] PostgreSQL pret"

# 5. Synchroniser le schema
echo ""
echo "Synchronisation du schema de base de donnees..."
pnpm db:push

echo ""
echo "== Setup termine =="
echo ""
echo "Pour demarrer le projet :"
echo "  pnpm start:dev"
echo ""
echo "Acces :"
echo "  UI     : http://localhost:5173"
echo "  API    : http://localhost:3000"
echo "  Swagger: http://localhost:3000/api"
