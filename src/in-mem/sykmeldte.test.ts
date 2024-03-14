import { expect, test, describe } from 'bun:test'
import { SykmeldteInternal } from './sykmeldte.ts'
import { add } from 'date-fns'

describe('SykmeldteInternal', () => {
    const fakeNow = new Date(2020, 1, 1)

    test('should handle a single sykmeldt', () => {
        const inMem = new SykmeldteInternal()

        inMem.sykmeldt('test-1', 'sykmelding-1', addDays(fakeNow, 1))

        expect(inMem.size).toBe(1)
        expect(inMem.isSykmeldt('test-1', fakeNow)).toBe(true)
    })

    test('should handle a single sykmeldt thats unsykmeldt', () => {
        const inMem = new SykmeldteInternal()

        inMem.sykmeldt('test-1', 'sykmelding-1', addDays(fakeNow, 1))

        expect(inMem.size).toBe(1)
        expect(inMem.isSykmeldt('test-1', fakeNow)).toBe(true)

        const future = addDays(fakeNow, 2)
        inMem.cleanExpired(future)

        expect(inMem.size).toBe(0)
        expect(inMem.isSykmeldt('test-1', future)).toBe(false)
    })

    test('should not evict dates in the future', () => {
        const inMem = new SykmeldteInternal()

        inMem.sykmeldt('test-1', 'sykmelding-1', addDays(fakeNow, 3))

        expect(inMem.size).toBe(1)
        expect(inMem.isSykmeldt('test-1', fakeNow)).toBe(true)

        const future = addDays(fakeNow, 2)
        inMem.cleanExpired(future)

        expect(inMem.size).toBe(1)
        expect(inMem.isSykmeldt('test-1', future)).toBe(true)
    })

    test('should handle multiple sykmeldt', () => {
        const inMem = new SykmeldteInternal()

        const now = addDays(fakeNow, 0)
        inMem.sykmeldt('test-1', 'sykmelding-1', addDays(now, 1))
        inMem.sykmeldt('test-2', 'sykmelding-2', addDays(now, 2))
        inMem.sykmeldt('test-3', 'sykmelding-3', addDays(now, 3))
        inMem.cleanExpired(now)

        expect(inMem.size).toBe(3)
        expect(inMem.isSykmeldt('test-1', now)).toBe(true)
        expect(inMem.isSykmeldt('test-2', now)).toBe(true)
        expect(inMem.isSykmeldt('test-3', now)).toBe(true)

        const future = addDays(now, 2)
        inMem.cleanExpired(future)

        expect(inMem.size).toBe(2)
        expect(inMem.isSykmeldt('test-1', future)).toBe(false)
        expect(inMem.isSykmeldt('test-2', future)).toBe(true)
        expect(inMem.isSykmeldt('test-3', future)).toBe(true)
    })

    test('should handle multiple for one', () => {
        const inMem = new SykmeldteInternal()

        const now = addDays(fakeNow, 0)
        inMem.sykmeldt('test-1', 'sykmelding-1', addDays(now, 1))
        inMem.sykmeldt('test-1', 'sykmelding-2', addDays(now, 2))

        expect(inMem.size).toBe(1)
        expect(inMem.isSykmeldt('test-1', now)).toBe(true)

        const future = addDays(now, 2)
        inMem.cleanExpired(future)

        expect(inMem.size).toBe(1)
        expect(inMem.isSykmeldt('test-1', future)).toBe(true)

        const future2 = addDays(now, 3)
        inMem.cleanExpired(future2)
        expect(inMem.isSykmeldt('test-1', future)).toBe(false)
    })

    test('should tombstone when multiple for one', () => {
        const inMem = new SykmeldteInternal()

        const now = addDays(fakeNow, 0)
        inMem.sykmeldt('test-1', 'sykmelding-1', addDays(now, 1))
        inMem.sykmeldt('test-1', 'sykmelding-2', addDays(now, 2))

        expect(inMem.size).toBe(1)
        expect(inMem.isSykmeldt('test-1', now)).toBe(true)

        inMem.tombstone('sykmelding-1')
        expect(inMem.size).toBe(1)
        expect(inMem.isSykmeldt('test-1', now)).toBe(true)

        inMem.tombstone('sykmelding-2')
        expect(inMem.size).toBe(0)
        expect(inMem.isSykmeldt('test-1', now)).toBe(false)
    })

    test('should tombstone when only one', () => {
        const inMem = new SykmeldteInternal()

        const now = addDays(fakeNow, 0)
        inMem.sykmeldt('test-1', 'sykmelding-1', addDays(now, 1))

        expect(inMem.size).toBe(1)
        expect(inMem.isSykmeldt('test-1', now)).toBe(true)

        inMem.tombstone('sykmelding-1')
        expect(inMem.size).toBe(0)
        expect(inMem.isSykmeldt('test-1', now)).toBe(false)
    })

    test('should handle thousands of sykmeldte being evicted', () => {
        const inMem = new SykmeldteInternal()

        const now = addDays(fakeNow, 0)
        for (let i = 0; i < 10000; i++) {
            inMem.sykmeldt(`test-${i}`, `sykmelding-${i}`, addDays(now, i))
        }

        expect(inMem.size).toBe(10000)
        const future = addDays(now, 5000)
        inMem.cleanExpired(future)
        expect(inMem.size).toBe(5000)
    })
})

function addDays(date: Date, days: number) {
    return add(date, { days })
}
