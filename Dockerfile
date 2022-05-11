FROM node:16.14.0
WORKDIR /app
COPY package*.json /app
RUN npm i -D
COPY . /app
RUN npm run build
CMD [ "npm", "start" ]