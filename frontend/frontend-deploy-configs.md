# 🌐 CONFIGURACIONES DE DEPLOY FRONTEND

## Vercel (Recomendado)

1. Ve a https://vercel.com
2. Conecta tu GitHub
3. Importa proyecto frontend/
4. Configura variables de entorno:
   - REACT_APP_API_URL: https://tu-backend-url.com/api
   - REACT_APP_STRIPE_PUBLISHABLE_KEY: pk_live_tu_stripe_publishable_key
5. Deploy automático

## Netlify

1. Ve a https://netlify.com
2. Conecta tu GitHub
3. Importa proyecto frontend/
4. Configura variables de entorno
5. Deploy automático

## GitHub Pages

1. npm install -g gh-pages
2. npm run build
3. gh-pages -d build
4. Configura GitHub Pages en settings

## VPS Manual

1. Copia carpeta build/ a tu servidor
2. Configura Nginx para servir archivos estáticos
3. Configura SSL con Let's Encrypt

