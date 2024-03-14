import * as R from 'remeda'
import logger from '../utils/logger.ts'
import { isSameDay } from 'date-fns'

export class SykmeldteInternal {
    public hasStarted = false
    public initialBatchComplete = false

    private _sykmeldt: Record<string, { expiry: Date; items: { tom: Date; id: string }[] }> = {}

    public sykmeldt(fnr: string, id: string, expiry: Date) {
        if (fnr in this._sykmeldt) {
            // User has sykmelding
            const existing = this._sykmeldt[fnr]
            const existingItem = existing.items.find((item) => item.id === id)

            if (existingItem != null) {
                // Item exists, update expiry
                existingItem.tom = expiry
                if (isSameDay(existing.expiry, expiry)) {
                    // This item was the newest exiry date
                    existing.expiry = expiry
                }
                return
            } else {
                // New item
                existing.items.push({ tom: expiry, id })
                if (existing.expiry < expiry) {
                    existing.expiry = expiry
                }
            }
        } else {
            // First time user has sykmelding
            this._sykmeldt[fnr] = { expiry, items: [{ tom: expiry, id }] }
        }
    }

    public isSykmeldt(fnr: string, now: Date) {
        let sykmeldt = this._sykmeldt[fnr]

        if (sykmeldt == null) return false

        return now <= sykmeldt.expiry
    }

    public tombstone(id: string) {
        const pair = R.pipe(
            this._sykmeldt,
            R.toPairs.strict,
            R.find(([_, value]) => value.items.some((item) => item.id === id)),
        )

        if (!pair) {
            // User not sykmeldt, nothing to remove
            return
        }

        const [key, value] = pair
        value.items = value.items.filter((item) => item.id !== id)
        if (value.items.length === 0) {
            delete this._sykmeldt[key]
        }
    }

    public get size(): number {
        return Object.keys(this._sykmeldt).length
    }

    public cleanExpired(now: Date) {
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

export default new SykmeldteInternal()
