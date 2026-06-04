FROM node:22-alpine
RUN npm install -g pnpm@11
WORKDIR /app
ARG CACHEBUST=1
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN cd artifacts/api-server && node ./build.mjs
EXPOSE 3000
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
