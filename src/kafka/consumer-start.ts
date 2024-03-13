import logger from '../utils/logger.ts'
import { type BekreftetSykmeldingType, getLatestTom, isSykmeldingNow } from '../sykmelding/sykmelding.ts'
import inMem from '../in-mem/sykmeldte.ts'
import type { KafkaMessage } from 'kafkajs'
import mps from '../utils/mps.ts'
import { BEKREFTET_TOPIC, processFromByPartition, SENDT_TOPIC } from './topic.ts'
import { consumer, initSykmeldingConsumer, setSykmeldingConsumerOffsetToEvergreen } from './consumer-config.ts'

function handleTopicMessage(now: Date) {
    return async (topic: string, message: KafkaMessage) => {
        const value = message.value
        if (value == null) {
            inMem.tombstone(message.key?.toString() ?? '')
            return
        }

        if (topic === BEKREFTET_TOPIC) {
            const sykmelding: BekreftetSykmeldingType = JSON.parse(value.toString('utf-8'))
            if (isSykmeldingNow(sykmelding, now)) {
                inMem.sykmeldt(
                    sykmelding.kafkaMetadata.fnr,
                    sykmelding.kafkaMetadata.sykmeldingId,
                    getLatestTom(sykmelding),
                )
                return
            }
        } else if (topic === SENDT_TOPIC) {
            const sykmelding: BekreftetSykmeldingType = JSON.parse(value.toString('utf-8'))
            if (isSykmeldingNow(sykmelding, now)) {
                inMem.sykmeldt(
                    sykmelding.kafkaMetadata.fnr,
                    sykmelding.kafkaMetadata.sykmeldingId,
                    getLatestTom(sykmelding),
                )
                return
            }
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
            if (!inMem.hasStarted && mps.mps() > 0) {
                logger.info('First messages started')
                inMem.hasStarted = true
            }

            const now = new Date()
            const messageHandler = handleTopicMessage(now)
            for (let message of batch.messages) {
                if (!isRunning() || isStale()) break

                await messageHandler(batch.topic, message)
                await resolveOffset(message.offset)
                await heartbeat()
            }

            messagesRead += batch.messages.length
            if (messagesRead - lastLoggedIndex >= 10000) {
                // Only log progress every 10k processed messages
                logger.info(`${messagesRead}: ${inMem.size} (mps: ${mps.mps()})`)
                lastLoggedIndex = messagesRead - (messagesRead % 10000)
            }

            mps.readMessages(batch.messages.length)
        },
    })

    await setSykmeldingConsumerOffsetToEvergreen()
}

const intervalTimer = setInterval(() => {
    if (inMem.hasStarted && !inMem.initialBatchComplete && mps.mps() < 10) {
        logger.info('Initial batch complete')
        inMem.initialBatchComplete = true
        clearInterval(intervalTimer)
    }
}, 100)

export async function stopConsumer() {
    logger.info(`Stopping consumer ${(await consumer.describeGroup()).groupId}`)
    await consumer.stop()
    await consumer.disconnect()
    logger.info(`Consumer stopped after reading ${messagesRead} messages`)
}
