# tsm-event-source-test

Create the following:

`.env.development`:

```
KAFKA_BROKERS=<use tsm kafka config>
KAFKA_CA_PATH=<use tsm kafka config>
KAFKA_PRIVATE_KEY_PATH=<use tsm kafka config>
KAFKA_CERTIFICATE_PATH=<use tsm kafka config>
```

Run the app:

```bash
bun run src/index.ts | bun pino-pretty
```
