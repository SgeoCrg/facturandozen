# Dockerfile para Backend Node.js - Facturando Zen
FROM node:18-bullseye-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Crear usuario no-root primero
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# Copiar package files
COPY package*.json ./

# Instalar dependencias (forzando compilación de módulos nativos desde cero)
ENV npm_config_build_from_source=true
RUN rm -rf node_modules && \
    npm ci --only=production && \
    npm rebuild bcrypt --build-from-source && \
    rm -rf /tmp/* && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p logs uploads

# Cambiar ownership
RUN chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Comando de inicio
CMD ["npm", "start"]
