import * as fs from 'fs'
import { Kafka } from 'kafkajs'

export const GROUP_ID = 'tsm-event-source-test'

const kafka = new Kafka({
    clientId: 'tsm-event-source-test',
    brokers: [Bun.env.KAFKA_BROKERS!!],
    ssl: {
        rejectUnauthorized: false,
        ca: Bun.env.KAFKA_CA ? [Bun.env.KAFKA_CA] : [fs.readFileSync(Bun.env.KAFKA_CA_PATH!!, 'utf-8')],
        key: Bun.env.KAFKA_PRIVATE_KEY ?? fs.readFileSync(Bun.env.KAFKA_PRIVATE_KEY_PATH!!, 'utf-8'),
        cert: Bun.env.KAFKA_CERTIFICATE ?? fs.readFileSync(Bun.env.KAFKA_CERTIFICATE_PATH!!, 'utf-8'),
    },
})

export default kafka
