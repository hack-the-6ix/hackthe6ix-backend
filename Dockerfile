FROM node:16 as base
WORKDIR /usr/ht6/server

ENV TZ=America/Toronto
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

EXPOSE 6971

RUN mkdir build
COPY package*.json ./build/
COPY . ./build/
RUN cd build && npm install
RUN cd build && npm run build

FROM base as deploy
RUN mv ./build/dist/ .
RUN mv ./build/node_modules/ .
RUN rm -r ./build
RUN ls -la dist
ENV NODE_ENV=production
CMD ["node", "./dist/index.js"]
