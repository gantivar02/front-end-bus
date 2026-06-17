# check=skip=SecretsUsedInArgOrEnv
# ^ Silencia el warning "secreto en ARG/ENV" para VITE_RECAPTCHA_SITE_KEY.
#   La SITE key de reCAPTCHA es PUBLICA por diseno: se incrusta en el
#   frontend y es visible en el navegador (no es secreta). La llave
#   SECRETA de reCAPTCHA vive en el backend (ms-security), no aqui.
#   Ademas Vite exige el nombre exacto VITE_RECAPTCHA_SITE_KEY.

# ============================================================
# front-end-bus — React + Vite, servido por Nginx
# Multi-stage: Node compila la SPA a archivos estaticos y Nginx los
# sirve. Nginx es mucho mas liviano y rapido para servir estaticos
# que Node.
#
# OJO: Vite "hornea" las variables VITE_* en tiempo de BUILD (quedan
# incrustadas en el JavaScript generado), por eso se pasan como ARG
# (build args), no como variables de entorno de runtime.
# ============================================================

# ---------- Etapa 1: build ----------
# Usamos la imagen "slim" (Debian/glibc) en vez de "alpine" (musl) para
# el build: Vite/Rollup traen binarios nativos que a veces fallan en
# Alpine ("Cannot find module @rollup/rollup-linux-x64-musl"). La imagen
# final igual es nginx:alpine, asi que no pesa mas.
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URLs que el NAVEGADOR usara para llamar a los backends. Como el
# navegador corre en la maquina del usuario (no en la red de Docker),
# apuntan a los puertos PUBLICADOS en el host (localhost:3000, :8081).
ARG VITE_MS_NEGOCIO_URL=http://localhost:3000/api
ARG VITE_MS_NEGOCIO_STATIC_URL=http://localhost:3000
ARG VITE_RECAPTCHA_SITE_KEY=
ENV VITE_MS_NEGOCIO_URL=$VITE_MS_NEGOCIO_URL
ENV VITE_MS_NEGOCIO_STATIC_URL=$VITE_MS_NEGOCIO_STATIC_URL
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY

RUN npm run build          # genera /app/dist

# ---------- Etapa 2: runtime (nginx) ----------
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
