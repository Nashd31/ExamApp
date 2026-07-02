FROM node:24-alpine

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
