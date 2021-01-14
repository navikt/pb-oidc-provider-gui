FROM node:14-alpine

COPY ./ /app
WORKDIR /app

RUN npm install && npm run build

RUN npm install -g serve

EXPOSE 5000

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ./entrypoint.sh
