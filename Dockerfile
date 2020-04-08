FROM node:12-alpine3.9

WORKDIR /app

RUN apk add ghostscript

COPY package.json package-lock.json ./
RUN npm install

COPY . .
COPY ./src/ ./src/

# RUN mkdir /app/output

EXPOSE 3300

CMD ["node", "./index.js"]
