import Cron from 'croner'
import inMem from './in-mem/sykmeldte.ts'
import logger from './utils/logger.ts'

export async function configureCron() {
    /**
     * Every night at 4:02 evict anyone that is no longer sykmeldt from the state
     */
    const job = Cron('02 4 * * *', () => {
        inMem.cleanExpired()
    })

    logger.info(
        `Configured cron, next runs will be ${job
            .nextRuns(5)
            .map((date) => date.toISOString())
            .join(', ')}`,
    )
}
