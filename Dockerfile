# Use node image
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Set env for production
ENV NODE_ENV=production

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
