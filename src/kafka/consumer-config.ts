import kafka, { GROUP_ID } from './client.ts'
import { BEKREFTET_TOPIC, processFromByPartition, SENDT_TOPIC } from './topic.ts'
import type { Consumer } from 'kafkajs'
import logger from '../utils/logger.ts'
import { env } from '../utils/env.ts'

export const consumer = kafka.consumer({
    groupId: `${GROUP_ID}-${Date.now()}`,
})

export async function initSykmeldingConsumer(): Promise<Consumer> {
    await consumer.connect()
    await consumer.subscribe({
        topics: [/*BEKREFTET_TOPIC, */ SENDT_TOPIC],
        fromBeginning: true,
    })

    return consumer
}

export async function setSykmeldingConsumerOffsetToEvergreen() {
    if (env.TOPIC_SEEK_OFFSET == null) {
        logger.info('No topic seek offset found, not seeking to any offset')
        return
    }

    logger.info('Seeking to recent data')
    for (const [partition, offset] of processFromByPartition[BEKREFTET_TOPIC]) {
        logger.info(`Seeking to ${BEKREFTET_TOPIC} partition ${partition} offset ${offset}`)
        consumer.seek({
            topic: BEKREFTET_TOPIC,
            partition,
            offset,
        })
    }

    for (const [partition, offset] of processFromByPartition[SENDT_TOPIC]) {
        logger.info(`Seeking to ${SENDT_TOPIC} partition ${partition} offset ${offset}`)
        consumer.seek({
            topic: SENDT_TOPIC,
            partition,
            offset,
        })
    }
}
