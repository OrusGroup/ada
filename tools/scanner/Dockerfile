FROM node:18-alpine

WORKDIR /app

# Create a minimal package.json on the fly to avoid using the massive original one
RUN echo '{"name": "ada-lite", "version": "1.0.0", "dependencies": {"express": "^4.18.2"}}' > package.json

# Install ONLY express
RUN npm install

# Copy minimal server and public assets
COPY server.js .
COPY public ./public

# Environment
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
