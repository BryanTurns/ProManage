FROM node

RUN npm install -g nodemon

WORKDIR /app

COPY . .

RUN npm install

EXPOSE $WEB_PORT

ENV NODE_ENV="development"

CMD ["sh", "-c", "npm install && npm run dev"]