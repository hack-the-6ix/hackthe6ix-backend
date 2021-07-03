FROM node:14
WORKDIR /usr/ht6/server

EXPOSE 6971

RUN mkdir build
COPY package*.json ./build/
COPY . ./build/
RUN cd build && npm install
RUN cd build && npm run build
RUN mv ./build/dist/ .
RUN mv ./build/node_modules/ .
RUN rm -r ./build
RUN ls -la dist
CMD ["node", "./dist/index.js"]
