# Stage 1: Build
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build the application
# Note: Vite environment variables must be provided at build time
# These should be passed as build args in Cloud Build
ARG VITE_GEMINI_API_KEY
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GA_TRACKING_ID

ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GA_TRACKING_ID=$VITE_GA_TRACKING_ID

RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine

# Copy the build output to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed (for SPA routing)
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
