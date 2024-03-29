import { startConsumer, stopConsumer } from './kafka/consumer-start.ts'

import logger from './utils/logger.ts'
import { configureApi } from './api.ts'
import { configureCron } from './cron.ts'
// import { startConsumer, stopConsumer } from './kafka/one-off/consumer-find-evergreen-offset.ts'

process.on('exit', async (code) => {
    if (code === 0) {
        logger.info('Exiting... Gracefully shutting down consumer')
    } else {
        logger.error(`Exiting with error code ${code}...`)
    }

    await stopConsumer()
})

logger.info("Welcome to Karl's Event Sourcing App!")

await configureApi()
await configureCron()
await startConsumer()
