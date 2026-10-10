@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-21
cd /d "%~dp0backend"
echo ========================================================
echo  Compilando e Gerando JAR do Backend...
echo ========================================================
call mvnw.cmd package -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao compilar o backend.
    pause
    exit /b %ERRORLEVEL%
)
echo ========================================================
echo  Iniciando Finance Backend (Perfil DEV com H2)...
echo ========================================================
"%JAVA_HOME%\bin\java.exe" "-Dspring.profiles.active=dev" -jar target\finance-backend-0.1.0-SNAPSHOT.jar
pause
