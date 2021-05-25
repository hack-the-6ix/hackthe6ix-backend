FROM node:14
WORKDIR /usr/ht6/server

COPY package*.json ./
RUN npm ci

COPY . .
EXPOSE $PORT
RUN ls -la
CMD ["npm", "start"]
