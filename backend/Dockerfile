# =============================================================================
# Stage 1: Build da Aplicação Java Spring Boot com Maven
# =============================================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache de dependências do Maven
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Cópia do código-fonte e compilação do artefato de produção
COPY src ./src
RUN mvn clean package -DskipTests -B

# =============================================================================
# Stage 2: Runtime Mínimo, Seguro e Otimizado para Contêineres
# =============================================================================
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Instalação de bibliotecas gráficas e fontes TrueType para suporte a gráficos/CAPTCHA em Alpine
RUN apk add --no-cache fontconfig freetype ttf-dejavu && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

# Cópia do executável JAR a partir do estágio de build
COPY --from=builder /build/target/finance-backend-*.jar /app/app.jar
RUN chown -R appuser:appgroup /app

USER appuser

# Parâmetros JVM de alta performance para contêineres Docker
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom -Djava.awt.headless=true"
ENV SERVER_PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
