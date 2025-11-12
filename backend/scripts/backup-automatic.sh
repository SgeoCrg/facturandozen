#!/bin/bash

# Script de backup automatizado para producción
# Ejecutar diariamente via cron: 0 2 * * * /path/to/backup-automatic.sh

set -e

# Configuración
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/facturando-zen}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-facturando_zen}"
DB_USER="${DB_USER:-facturando_zen_user}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$BACKUP_DIR/backup.log"
    exit 1
}

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

# Backup de base de datos
log "Iniciando backup de base de datos..."

if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
    # Comprimir backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Backup de base de datos completado: $BACKUP_FILE ($BACKUP_SIZE)"
else
    error "Falló el backup de base de datos"
fi

# Verificar integridad del backup
if ! gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    error "El backup está corrupto: $BACKUP_FILE"
fi

# Limpiar backups antiguos
log "Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" | wc -l)
log "Backups conservados: $DELETED_COUNT"

# Upload a S3 (opcional)
if [ -n "$AWS_S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    log "Subiendo backup a S3..."
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/" || error "Error subiendo a S3"
        log "✅ Backup subido a S3"
    else
        log "⚠️  AWS CLI no instalado, saltando upload a S3"
    fi
fi

log "🎉 Backup completado correctamente"
exit 0

