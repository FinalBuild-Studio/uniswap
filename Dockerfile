FROM node:12-alpine

WORKDIR /app

COPY . .

RUN npm install --global pnpm@5 && \
  pnpm install

EXPOSE 3000

ENTRYPOINT ["pnpm", "start"]
