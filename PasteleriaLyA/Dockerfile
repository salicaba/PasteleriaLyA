# --- Etapa 1: Construcción (Builder) ---
# Usamos una imagen de Node para compilar el proyecto
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias primero (para aprovechar el caché de Docker)
COPY package.json package-lock.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código fuente (tus componentes de React, Tailwind, etc.)
COPY . .

# Construimos la aplicación para producción (crea la carpeta /dist)
RUN npm run build

# --- Etapa 2: Servidor (Runner) ---
# Usamos Nginx para servir los archivos estáticos (es más rápido que Node para esto)
FROM nginx:alpine

# Copiamos los archivos construidos en la etapa anterior a la carpeta de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# (Opcional) Si tienes una config personalizada de nginx, la copiarías aquí
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 (el estándar web)
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]