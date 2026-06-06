# Stage 1: Build the React application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files (handling both npm and yarn)
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies using yarn or npm based on what's available
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else npm ci || npm install; fi

# Copy source code
COPY . .

# Build the app (Vite outputs to 'dist')
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
