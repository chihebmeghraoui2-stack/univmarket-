FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm@11
RUN pnpm install --no-frozen-lockfile
RUN cd artifacts/api-server && node ./build.mjs
EXPOSE 3000
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
