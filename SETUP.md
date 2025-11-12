# Setup Facturando Zen - Guía de Configuración

## ✅ Proyecto Preparado

El proyecto Facturando Zen está listo para desplegar en Docker. El código ha sido movido desde:
- `/Users/seoforceseoforceagency/Downloads/sistema facturacion basico`

A la estructura compartimentada:
- `/Users/seoforceseoforceagency/Desktop/servidor/projects/facturandozen`

## 📋 Cambios Realizados

### 1. Docker Compartimentado
- ✅ Backend: Node.js/Express en puerto 5000 (interno)
- ✅ Frontend: React servido con nginx en puerto 80 (interno)
- ✅ Base de datos: PostgreSQL 15 en puerto 5432 (interno)
- ✅ Redis: Cache y sesiones en puerto 6379 (interno)
- ✅ Red compartimentada: `facturandozen-network`

### 2. Nginx Configurado
- ✅ Proxy para `/api/` → Backend
- ✅ Proxy para `/` → Frontend
- ✅ Health check en `/health`

### 3. Servicios
- ✅ Backend con Node.js 18
- ✅ Frontend con React (build estático)
- ✅ PostgreSQL 15
- ✅ Redis 7

## 🚀 Próximos Pasos

### 1. Configurar Variables de Entorno

```bash
cd /Users/seoforceseoforceagency/Desktop/servidor/projects/facturandozen
cp env.facturando-zen.example .env
# O usar el .env.example si existe
nano .env
```

**Cambiar obligatoriamente:**
- `DB_PASSWORD`: Contraseña segura para PostgreSQL
- `JWT_SECRET`: Generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `SUPERADMIN_PASSWORD`: Contraseña del superadmin
- `STRIPE_SECRET_KEY`: Si usas Stripe
- `VERIFACTU_API_KEY`: Si usas VeriFactu

### 2. Obtener Certificado SSL

```bash
cd /Users/seoforceseoforceagency/Desktop/servidor
./scripts/ssl-cert.sh facturandozen.com tu-email@example.com
```

### 3. Desplegar

```bash
./scripts/deploy.sh facturandozen
```

## ⚠️ Importante: Migración de Datos

Si tienes datos existentes:

1. **Exportar datos** de la base de datos anterior
2. **Adaptar scripts SQL** si es necesario
3. **Importar en PostgreSQL** usando migraciones o scripts

### Scripts de Inicialización

Los scripts en `backend/migrations/` se ejecutarán automáticamente al iniciar PostgreSQL la primera vez (si están en `/docker-entrypoint-initdb.d/`).

## 🔧 Comandos Útiles

### Ver logs en tiempo real
```bash
cd projects/facturandozen
docker-compose logs -f
```

### Acceder a base de datos
```bash
docker-compose exec db psql -U facturando_zen_user -d facturando_zen
```

### Ejecutar migraciones
```bash
docker-compose exec backend npm run migrate
```

### Reiniciar servicios
```bash
docker-compose restart
```

### Detener todo
```bash
docker-compose down
```

### Acceder a Redis
```bash
docker-compose exec redis redis-cli
```

## 📝 Notas

- El proyecto está **compartimentado**: no puede acceder a otros proyectos
- Los datos persisten en volúmenes Docker
- Nginx actúa como reverse proxy unificado
- SSL automático con Let's Encrypt
- Redis se usa para cache y gestión de sesiones

## 🐛 Troubleshooting

### Backend no conecta a DB
```bash
# Verificar variables de entorno
docker-compose exec backend env | grep DB_

# Verificar conexión
docker-compose exec backend node -e "const db = require('./src/config/database'); console.log(db.sequelize.authenticate())"
```

### Frontend no carga
```bash
# Verificar build
docker-compose exec frontend ls -la /usr/share/nginx/html

# Ver logs
docker-compose logs frontend
```

### Nginx no conecta
```bash
# Verificar red
docker network inspect facturandozen-network

# Conectar manualmente
docker network connect facturandozen-network nginx-proxy
```

### Redis no funciona
```bash
# Verificar conexión
docker-compose exec redis redis-cli ping

# Ver logs
docker-compose logs redis
```


