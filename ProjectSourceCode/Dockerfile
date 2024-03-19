FROM node

RUN npm install -g nodemon

WORKDIR /app

COPY . .

RUN npm install

RUN npx tailwindcss -o ./public/styles/output.css

EXPOSE 3000

CMD ["npm", "run", "dev"]