@echo off
chcp 65001 >nul
echo ===============================================================================
echo     Iniciando Plataforma de Gestao Financeira com IA em Modo Producao (Docker)
echo ===============================================================================

echo [1/3] Verificando Docker e Docker Compose...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Docker nao foi encontrado no sistema ou nao esta em execucao.
    echo Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)

echo [2/3] Construindo imagens e subindo servicos (Postgres + Backend + Frontend/Nginx)...
docker compose -f docker-compose.prod.yml up --build -d

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao iniciar containers do Docker Compose.
    pause
    exit /b 1
)

echo [3/3] Aguardando estabilizacao dos servicos...
timeout /t 5 >nul

echo ===============================================================================
echo     Stack de Producao Ativa com Sucesso!
echo ===============================================================================
echo   - Frontend SPA (Nginx):      http://localhost
echo   - Backend REST API:          http://localhost:8080/api/v1/health
echo   - Swagger Documentacao:      http://localhost:8080/swagger-ui.html
echo   - Banco PostgreSQL:          localhost:5432 (database: finance_db)
echo ===============================================================================
pause
