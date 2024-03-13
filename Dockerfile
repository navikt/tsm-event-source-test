FROM oven/bun:1.0 as build

WORKDIR /app

COPY /bun.lockb /app
COPY /bunfig.toml /app
COPY /package.json /app
COPY /src /app

RUN bun install --production

ENV NODE_ENV=production
EXPOSE 3000

FROM oven/bun:1.0-distroless

WORKDIR /app

COPY --from=build /app /app

CMD ["./index.ts"]
