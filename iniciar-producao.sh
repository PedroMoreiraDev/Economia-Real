#!/usr/bin/env bash
set -e

echo "==============================================================================="
echo "    Iniciando Plataforma de Gestao Financeira com IA em Modo Producao (Docker)"
echo "==============================================================================="

if ! command -v docker &> /dev/null; then
    echo "[ERRO] Docker nao foi encontrado no sistema ou nao esta no PATH."
    exit 1
fi

echo "[1/2] Construindo imagens e subindo servicos (Postgres + Backend + Frontend/Nginx)..."
docker compose -f docker-compose.prod.yml up --build -d

echo "[2/2] Verificando containers em execucao..."
docker compose -f docker-compose.prod.yml ps

echo "==============================================================================="
echo "    Stack de Producao Ativa com Sucesso!"
echo "==============================================================================="
echo "  - Frontend SPA (Nginx):      http://localhost"
echo "  - Backend REST API:          http://localhost:8080/api/v1/health"
echo "  - Swagger Documentacao:      http://localhost:8080/swagger-ui.html"
echo "  - Banco PostgreSQL:          localhost:5432 (database: finance_db)"
echo "==============================================================================="
