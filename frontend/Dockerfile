FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy rest of the application
COPY . .

# Build the application
RUN npm run build

# Install serve to run the application in SPA mode
RUN npm install -g serve

EXPOSE 3000

# Serve the dist folder
CMD ["serve", "-s", "dist", "-l", "3000"]
