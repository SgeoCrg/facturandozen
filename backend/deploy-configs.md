# 🚀 CONFIGURACIONES DE DEPLOY

## Railway (Recomendado)

1. Ve a https://railway.app
2. Conecta tu GitHub
3. Crea nuevo proyecto
4. Añade servicio PostgreSQL
5. Añade servicio Node.js
6. Configura variables de entorno desde .env.production
7. Deploy automático

## Heroku

1. Instala Heroku CLI
2. heroku login
3. heroku create facturando-zen-backend
4. heroku addons:create heroku-postgresql:hobby-dev
5. heroku config:set $(cat .env.production | xargs)
6. git push heroku main

## DigitalOcean App Platform

1. Ve a https://cloud.digitalocean.com/apps
2. Create App
3. Connect GitHub
4. Selecciona backend/
5. Configura variables de entorno
6. Deploy

## VPS Manual

1. Instala Node.js 18+
2. Instala PostgreSQL
3. Clona repositorio
4. npm install
5. Configura .env.production
6. npm run migrate
7. pm2 start src/server.js
8. Configura Nginx reverse proxy
9. Configura SSL con Let's Encrypt

## Docker

1. docker build -t facturando-zen-backend .
2. docker run -p 3001:3001 --env-file .env.production facturando-zen-backend

