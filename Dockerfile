# Build stage
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build-time arguments for environment variables
# These are baked into the static site at build time
ARG VITE_GEMINI_API_KEY
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GA_TRACKING_ID
ARG VITE_FIREBASE_API_KEY
ARG VITE_ACCESS_CODE

# Set environment variables for the build process
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GA_TRACKING_ID=$VITE_GA_TRACKING_ID
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_ACCESS_CODE=$VITE_ACCESS_CODE

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the build output to Nginx's serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to handle SPA routing and port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run expects the container to listen on the port defined by the PORT env var (default 8080)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
