FROM node:carbon

COPY ./ ./

RUN npm install && npm run build

EXPOSE 5000

CMD [ "npm", "start" ]
