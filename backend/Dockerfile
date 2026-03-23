FROM golang:1.24-alpine AS build

WORKDIR /app
COPY backend/go.mod backend/go.sum* ./backend/
WORKDIR /app/backend
RUN go mod download

COPY backend /app/backend

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/blockchain_watcher ./cmd/blockchain_watcher
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/telegram_bot_worker ./cmd/telegram_bot_worker

FROM alpine:3.21

WORKDIR /app
RUN adduser -D appuser
USER appuser

COPY --from=build /out/api /usr/local/bin/api
COPY --from=build /out/blockchain_watcher /usr/local/bin/blockchain_watcher
COPY --from=build /out/telegram_bot_worker /usr/local/bin/telegram_bot_worker

ENTRYPOINT ["/bin/sh", "-lc", "case \"$APP_RUNTIME\" in api) exec /usr/local/bin/api ;; watcher) exec /usr/local/bin/blockchain_watcher ;; bot) exec /usr/local/bin/telegram_bot_worker ;; *) exec /usr/local/bin/api ;; esac"]
