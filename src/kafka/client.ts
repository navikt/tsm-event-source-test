import { Kafka } from 'kafkajs'
import { env } from '../utils/env'

export const GROUP_ID = 'tsm-event-source-test'

const kafka = new Kafka({
    clientId: 'tsm-event-source-test',
    brokers: [env.KAFKA_BROKER],
    ssl: {
        rejectUnauthorized: false,
        ca: env.KAFKA_CA,
        key: env.KAFKA_KEY,
        cert: env.KAFKA_CERTIFICATE,
    },
})

export default kafka
