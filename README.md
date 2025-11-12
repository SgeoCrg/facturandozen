# Facturando Zen - Sistema de Facturación

## Configuración

### 1. Variables de Entorno

```bash
cp .env.example .env
nano .env
```

**Importante:** Cambiar:
- `DB_PASSWORD`: Contraseña segura para PostgreSQL
- `JWT_SECRET`: Generar clave secreta
- `SUPERADMIN_PASSWORD`: Contraseña del superadmin
- `STRIPE_SECRET_KEY`: Clave de Stripe (si usas pagos)
- `VERIFACTU_API_KEY`: Clave de VeriFactu (si usas facturación electrónica)

### 2. Generar Secret Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Obtener Certificado SSL

```bash
../../scripts/ssl-cert.sh facturandozen.com tu-email@example.com
```

### 4. Desplegar

```bash
../../scripts/deploy.sh facturandozen
```

## Estructura

```
facturandozen/
├── backend/          # Node.js/Express Backend
│   ├── src/          # Código de la aplicación
│   ├── migrations/   # Migraciones de base de datos
│   ├── Dockerfile    # Dockerfile del backend
│   └── package.json
├── frontend/         # React Frontend
│   ├── src/          # Código fuente
│   ├── build/        # Build de producción
│   ├── Dockerfile    # Dockerfile del frontend
│   └── package.json
├── docker-compose.yml # Orquestación de servicios
├── nginx.conf.example # Configuración nginx
└── .env              # Variables de entorno (no commitear)
```

## Servicios

### Backend
- **Puerto interno:** 5000
- **Endpoint:** `/api`
- **Health check:** `/api/health`

### Frontend
- **Puerto interno:** 80 (nginx)
- **Acceso:** Raíz del dominio

### Base de Datos
- **Tipo:** PostgreSQL 15
- **Puerto interno:** 5432
- **Volumen:** `facturandozen-db-data`

### Redis
- **Puerto interno:** 6379
- **Uso:** Cache y sesiones
- **Volumen:** `facturandozen-redis-data`

## Comandos Útiles

### Ver logs
```bash
cd projects/facturandozen
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
docker-compose logs -f redis
```

### Reiniciar servicios
```bash
docker-compose restart
```

### Detener servicios
```bash
docker-compose down
```

### Ejecutar migraciones
```bash
docker-compose exec backend npm run migrate
```

### Acceder a base de datos
```bash
docker-compose exec db psql -U facturando_zen_user -d facturando_zen
```

### Backup
```bash
../../scripts/backup.sh facturandozen
```

## Características

- ✅ Sistema multi-tenant
- ✅ Integración con Stripe (pagos)
- ✅ Integración con VeriFactu (facturación electrónica)
- ✅ Sistema de afiliados
- ✅ Redis para cache y sesiones
- ✅ Sistema LOPD completo
- ✅ Emails automáticos

## Notas

- El backend está en Node.js/Express con PostgreSQL
- El frontend está en React servido con nginx
- Todos los servicios están en la red `facturandozen-network` compartimentada
- Redis se usa para cache y gestión de sesiones
