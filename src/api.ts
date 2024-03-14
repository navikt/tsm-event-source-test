import { Elysia } from 'elysia'
import inMem from './in-mem/sykmeldte.ts'

export async function configureApi() {
    new Elysia()
        .get('/is-sykmeldt', ({ headers, set }) => {
            const fnr = headers['x-fnr'] ?? null

            if (fnr == null) {
                set.status = 400
                return {
                    error: 'X-Fnr header is required',
                }
            }

            const isSykmeldt = inMem.isSykmeldt(fnr, new Date())
            return {
                isSykmeldt,
            }
        })
        .get('/debug', ({ set }) => {
            if (Bun.env.NODE_ENV !== 'development') {
                set.status = 404
                return {
                    error: 'Not found',
                }
            }

            return inMem.debug
        })
        .get('/internal/is_alive', ({ set }) => {
            return { status: 'ok' }
        })
        .get('/internal/is_ready', ({ set }) => {
            if (!inMem.initialBatchComplete) {
                set.status = 423
                return { status: 'still processing initial set of messages' }
            }

            return { status: 'ok' }
        })
        .listen(3000)
}
