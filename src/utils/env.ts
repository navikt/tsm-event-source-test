import * as z from 'zod'
import fs from 'fs'
import logger from './logger.ts'
import { BEKREFTET_TOPIC, SENDT_TOPIC } from '../kafka/topic.ts'

const partitionOffsetTupleSchema = z.tuple([z.number(), z.string()])
const envSchema = z.object({
    KAFKA_BROKER: z.string(),
    KAFKA_CA: z.array(z.string()),
    KAFKA_KEY: z.string(),
    KAFKA_CERTIFICATE: z.string(),
    TOPIC_SEEK_OFFSET: z
        .preprocess(
            (val) => (val == null || typeof val !== 'string' ? null : JSON.parse(val)),
            z.object({
                [BEKREFTET_TOPIC]: z.array(partitionOffsetTupleSchema),
                [SENDT_TOPIC]: z.array(partitionOffsetTupleSchema),
            }),
        )
        .optional(),
})

const rawEnv = {
    KAFKA_BROKER: Bun.env.KAFKA_BROKERS,
    KAFKA_CA: Bun.env.KAFKA_CA ? [Bun.env.KAFKA_CA] : [fs.readFileSync(Bun.env.KAFKA_CA_PATH!!, 'utf-8')],
    KAFKA_KEY: Bun.env.KAFKA_PRIVATE_KEY ?? fs.readFileSync(Bun.env.KAFKA_PRIVATE_KEY_PATH!!, 'utf-8'),
    KAFKA_CERTIFICATE: Bun.env.KAFKA_CERTIFICATE ?? fs.readFileSync(Bun.env.KAFKA_CERTIFICATE_PATH!!, 'utf-8'),
    TOPIC_SEEK_OFFSET: Bun.env.TOPIC_SEEK_OFFSET ?? null,
}

const parsedEnv = envSchema.safeParse(rawEnv)
if (!parsedEnv.success) {
    logger.error('Missing environment variables!')
    logger.error(parsedEnv.error)
    process.exit(1)
}

export const env: z.infer<typeof envSchema> = parsedEnv.data
