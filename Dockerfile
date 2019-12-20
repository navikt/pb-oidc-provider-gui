FROM node:carbon

COPY ./ /app
WORKDIR /app

RUN npm install && npm run build

RUN npm install serve
RUN yarn global add serve

EXPOSE 5000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT /entrypoint.sh
