# =============================================================================
# Stage 1: Build da Aplicação React com TypeScript e Vite
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cache otimizado de dependências do npm
COPY package.json package-lock.json ./
RUN npm ci

# Cópia do código-fonte e compilação do bundle de produção estático
COPY . ./
RUN npm run build

# =============================================================================
# Stage 2: Runtime Mínimo com Nginx Alpine de Alta Performance
# =============================================================================
FROM nginx:1.25-alpine AS runner

# Substitui a configuração padrão do Nginx pelo proxy reverso e SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os artefatos compilados pelo Vite para o diretório servido pelo Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
