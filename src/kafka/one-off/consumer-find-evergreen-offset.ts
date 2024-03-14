import logger from '../../utils/logger.ts'
import inMem from '../../in-mem/sykmeldte.ts'
import type { KafkaMessage } from 'kafkajs'
import mps from '../../utils/mps.ts'
import { BEKREFTET_TOPIC, SENDT_TOPIC, type SYKMELDING_TOPICS } from '../topic.ts'
import { consumer, initSykmeldingConsumer, setSykmeldingConsumerOffsetToEvergreen } from '../consumer-config.ts'
import type { BekreftetSykmeldingType, SendtSykmeldingType } from '../../sykmelding/sykmelding.ts'

/**
 * This is a script to find the offset of the first message in 2022
 */

const highestOffset = {
    [BEKREFTET_TOPIC]: {
        0: 0,
        1: 0,
        2: 0,
        latestDate: null as string | null,
    },
    [SENDT_TOPIC]: {
        0: 0,
        1: 0,
        2: 0,
        latestDate: null as string | null,
    },
}

function kafkaMessageDate(
    topic: SYKMELDING_TOPICS,
    partition: number,
    offset: string,
    message: BekreftetSykmeldingType | SendtSykmeldingType,
) {
    highestOffset[topic][partition as 0 | 1 | 2] = Math.max(
        highestOffset[topic][partition as 0 | 1 | 2],
        parseInt(offset),
    )
    highestOffset[topic].latestDate = message.kafkaMetadata.timestamp

    if (message.kafkaMetadata.timestamp.startsWith('2022')) {
        console.log(`Found 2022 (${topic}): `, partition, offset, message.kafkaMetadata.timestamp)
        consumer.stop()
    }
}

function handleTopicMessage(now: Date) {
    return async (topic: string, partition: number, message: KafkaMessage) => {
        const value = message.value

        // Skip tombstones
        if (value == null) return

        if (topic === BEKREFTET_TOPIC) {
            kafkaMessageDate(topic, partition, message.offset, JSON.parse(value.toString()))
        } else if (topic === SENDT_TOPIC) {
            kafkaMessageDate(topic, partition, message.offset, JSON.parse(value.toString()))
        }
    }
}

let messagesRead = 0
let lastLoggedIndex = 0
export async function startConsumer() {
    const consumer = await initSykmeldingConsumer()

    logger.info(`Starting consumer ${(await consumer.describeGroup()).groupId}`)
    consumer.run({
        partitionsConsumedConcurrently: 3,
        eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
            // if (messagesRead > 100000) {
            //     logger.info('LOCAL DEV: stopping after first 100k')
            //     await consumer.stop()
            // }

            if (!inMem.hasStarted && mps.mps() > 0) {
                logger.info('First messages started')
                inMem.hasStarted = true
            }

            const now = new Date()
            const messageHandler = handleTopicMessage(now)
            for (let message of batch.messages) {
                if (!isRunning() || isStale()) break

                await messageHandler(batch.topic, batch.partition, message)
                await resolveOffset(message.offset)
                await heartbeat()
            }

            messagesRead += batch.messages.length
            if (messagesRead - lastLoggedIndex >= 25000) {
                // Only log progress every 10k processed messages
                logger.info(`${messagesRead}: (mps: ${mps.mps()})`)
                lastLoggedIndex = messagesRead - (messagesRead % 10000)

                reportHighestStuff()
            }

            mps.readMessages(batch.messages.length)
        },
    })

    await setSykmeldingConsumerOffsetToEvergreen()
}

function reportHighestStuff() {
    console.log(`
        [BEKREFTET_TOPIC]: [
            [0, "${highestOffset[BEKREFTET_TOPIC][0]}"],
            [1, "${highestOffset[BEKREFTET_TOPIC][1]}"],
            [2, "${highestOffset[BEKREFTET_TOPIC][2]}"],
        ],
        [SENDT_TOPIC]: [
            [0, "${highestOffset[SENDT_TOPIC][0]}"],
            [1, "${highestOffset[SENDT_TOPIC][1]}"],
            [2, "${highestOffset[SENDT_TOPIC][2]}"],
        ],
        `)
    console.log(BEKREFTET_TOPIC, highestOffset[BEKREFTET_TOPIC].latestDate)
    console.log(SENDT_TOPIC, highestOffset[SENDT_TOPIC].latestDate)
}

const intervalTimer = setInterval(() => {
    if (inMem.hasStarted && !inMem.initialBatchComplete && mps.mps() < 10) {
        logger.info('Initial batch complete')
        inMem.initialBatchComplete = true
        clearInterval(intervalTimer)

        reportHighestStuff()
    }
}, 100)

export async function stopConsumer() {
    logger.info(`Stopping consumer ${(await consumer.describeGroup()).groupId}`)
    await consumer.stop()
    await consumer.disconnect()
    logger.info(`Consumer stopped after reading ${messagesRead} messages`)
}
