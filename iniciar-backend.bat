@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-21
cd /d "%~dp0backend"
echo ========================================================
echo  Iniciando Finance Backend (Perfil DEV com H2 em memoria)
echo ========================================================
"%JAVA_HOME%\bin\java.exe" "-Dspring.profiles.active=dev" -jar target\finance-backend-0.1.0-SNAPSHOT.jar
pause
