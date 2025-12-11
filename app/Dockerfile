# 1. Imagen base estable
FROM node:18-alpine

# 2. Crear directorio de trabajo
WORKDIR /usr/src/app

# 3. Copiar únicamente package.json y package-lock.json primero
COPY package*.json ./

# 4. Instalar dependencias
RUN npm ci --only=production

# 5. Copiar el resto del código
COPY . .

# 6. Exponer el puerto de la app
EXPOSE 3000

# 7. Comando de inicio
CMD ["npm", "start"]
