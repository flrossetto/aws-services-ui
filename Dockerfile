# Multi-stage build para aplicação React otimizada

# Estágio 1: Build
FROM node:20-alpine AS builder

# Configurar variáveis de ambiente
ENV NODE_ENV=production
# Desabilitar CI para não tratar warnings como erros
ENV CI=false

# Argumentos de build para informações do git
ARG GIT_TAG=latest
ARG GIT_COMMIT=unknown

# Labels para metadados da imagem
LABEL org.opencontainers.image.title="AWS Services UI"
LABEL org.opencontainers.image.description="Frontend React/TypeScript para gerenciamento de serviços AWS (S3, SQS, DynamoDB) conectado a emuladores AWS"
LABEL org.opencontainers.image.version="${GIT_TAG}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.source="https://github.com/flrossetto/aws-ui"
LABEL org.opencontainers.image.licenses="MIT"
LABEL maintainer="Fabio Rossetto (@flrossetto)"

# Instalar dependências do sistema necessárias (apenas python3, não precisa de g++ para React)
RUN apk add --no-cache python3

# Criar diretório de trabalho
WORKDIR /app

# Copiar apenas arquivos necessários para instalação de dependências
COPY package*.json ./

# Instalar dependências de produção primeiro (mais rápido)
RUN npm install --production --ignore-scripts --no-audit --no-fund --loglevel=error

# Copiar código fonte
COPY . .

# Instalar devDependencies separadamente
RUN npm install --only=dev --ignore-scripts --no-audit --no-fund --loglevel=error && \
    npm cache clean --force

# Build da aplicação
RUN npm run build

# Estágio 2: Servidor Nginx leve
FROM nginx:alpine

# Argumentos de build para informações do git (herdados do builder)
ARG GIT_TAG=latest
ARG GIT_COMMIT=unknown

# Labels para metadados da imagem (herdados do builder)
LABEL org.opencontainers.image.title="AWS Services UI"
LABEL org.opencontainers.image.description="Frontend React/TypeScript para gerenciamento de serviços AWS (S3, SQS, DynamoDB) conectado a emuladores AWS"
LABEL org.opencontainers.image.version="${GIT_TAG}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.source="https://github.com/flrossetto/aws-ui"
LABEL org.opencontainers.image.licenses="MIT"
LABEL maintainer="Fabio Rossetto (@flrossetto)"

# Remover configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copiar configuração customizada do Nginx
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados do estágio anterior
COPY --from=builder /app/build /usr/share/nginx/html

# Expor porta 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
