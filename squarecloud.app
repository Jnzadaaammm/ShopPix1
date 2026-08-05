DISPLAY_NAME=Ecommerce
MEMORY=4096
VERSION=recommended
AUTORESTART=true
RUNTIME=nodejs
START=npx prisma db push && npm run build && npm run db:seed && npx concurrently "npm:start" "npm:bot"
SUBDOMAIN=shoppix