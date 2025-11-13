# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND pnpm-lock.yaml are copied.
# Copying this first prevents re-running pnpm install on every code change.
COPY package.json pnpm-lock.yaml ./

# Install dependencies, including dev dependencies for the build process
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application's source code from the host to the image.
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /usr/src/app

# Only copy production dependencies from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./package.json

# Copy the secrets folder containing SSL certificates
COPY --from=build /usr/src/app/secrets ./secrets

# Copy the data and config folders with JSON files (mantiene la estructura src/)
COPY --from=build /usr/src/app/src/data ./src/data
COPY --from=build /usr/src/app/src/config ./src/config

# The app listens on port 3000, so we expose it
EXPOSE 3000

# The command to run the application
CMD ["node", "dist/main"]
