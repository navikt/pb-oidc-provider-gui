FROM node:carbon

COPY ./ ./

RUN npm install && npm run build

RUN npm install serve
RUN yarn global add serve

ENV PORT=5000
EXPOSE $PORT

CMD ["serve", "-s", "build"]
