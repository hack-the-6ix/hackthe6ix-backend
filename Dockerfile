FROM node:14
WORKDIR /usr/ht6/server

COPY package*.json ./
RUN npm ci

COPY . .
EXPOSE $PORT
CMD ["npm", "start"]