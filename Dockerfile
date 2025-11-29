# Etapa base: Node 20
FROM node:20

# Crear carpeta de la app
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./
COPY secrets ./secrets

# Instalar dependencias
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Exponer el puerto del backend (6161)
EXPOSE 6161

# Comando por defecto
CMD ["npm", "run", "start:dev"]