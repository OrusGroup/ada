FROM nginx:alpine

# Copy custom configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static assets
COPY public /usr/share/nginx/html

# Ensure permissions (optional but good practice)
RUN chmod -R 755 /usr/share/nginx/html

# Expose port (must match nginx.conf)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
