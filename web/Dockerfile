
FROM node:alpine AS development
WORKDIR /app
COPY ./package*.json /app
RUN npm install
COPY . .

CMD ["npm","start"]