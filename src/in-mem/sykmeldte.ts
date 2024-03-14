import * as R from 'remeda'
import logger from '../utils/logger.ts'

class Sykmeldte {
    public hasStarted = false
    public initialBatchComplete = false

    private _sykmeldt: Record<string, { expiry: Date; id: string }> = {}

    public sykmeldt(fnr: string, id: string, expiry: Date) {
        if (fnr in this._sykmeldt) {
            const existing = this._sykmeldt[fnr]

            // Keep existing if expiry is later than this one
            if (existing.expiry < expiry) {
                this._sykmeldt[fnr] = { expiry, id }
            }
        } else {
            this._sykmeldt[fnr] = { expiry, id }
        }
    }

    public friskmeldt(fnr: string) {
        delete this._sykmeldt[fnr]
    }

    public isSykmeldt(fnr: string) {
        let sykmeldt = this._sykmeldt[fnr]

        if (sykmeldt == null) return false

        return new Date() < sykmeldt.expiry
    }

    public tombstone(id: string) {
        const fnr = R.pipe(
            this._sykmeldt,
            R.toPairs,
            R.find(([_, value]) => value.id === id),
        )

        if (!fnr?.length) return

        this.friskmeldt(fnr[0])
    }

    public get size(): number {
        return Object.keys(this._sykmeldt).length
    }

    public cleanExpired() {
        const now = new Date()
        const expired = Object.entries(this._sykmeldt).filter(([_, value]) => value.expiry < now)
        expired.forEach(([key]) => delete this._sykmeldt[key])

        logger.info(`Evicted ${expired.length} from the cache`)
    }

    /**
     * @deprecated
     */
    public get debug() {
        return this._sykmeldt
    }
}

export default new Sykmeldte()
