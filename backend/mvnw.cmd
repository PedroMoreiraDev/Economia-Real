@echo off
setlocal
if not defined JAVA_HOME (
    set "JAVA_HOME=C:\Program Files\Java\jdk-21"
)
"C:\apache-maven-3.9.11-bin\apache-maven-3.9.11\bin\mvn.cmd" %*
endlocal
