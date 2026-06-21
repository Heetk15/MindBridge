FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy rest of the application
COPY . .

# Ensure data directories exist
RUN mkdir -p data/chroma logs

EXPOSE 5004

CMD ["npm", "start"]
