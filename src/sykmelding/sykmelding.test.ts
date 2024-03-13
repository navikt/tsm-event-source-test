import { test, expect } from 'bun:test'
import { isSykmeldingNow } from './sykmelding.ts'
import { parseISO } from 'date-fns'

test('isSykmeldingNow inside+1', async () => {
    const isNow = isSykmeldingNow(
        {
            sykmelding: {
                id: '1',
                mottattTidspunkt: '2021-01-01',
                sykmeldingsperioder: [
                    {
                        fom: '2021-01-01',
                        tom: '2021-01-10',
                    },
                ],
            },
            kafkaMetadata: {
                fnr: '123',
                sykmeldingId: '1',
                source: 'test',
                timestamp: '2021-01-01',
            },
        },
        parseISO('2021-01-02'),
    )
    expect(isNow).toBe(true)
})

test('isSykmeldingNow now same as fom', async () => {
    const isNow = isSykmeldingNow(
        {
            sykmelding: {
                id: '1',
                mottattTidspunkt: '2021-01-01',
                sykmeldingsperioder: [
                    {
                        fom: '2021-01-01',
                        tom: '2021-01-10',
                    },
                ],
            },
            kafkaMetadata: {
                fnr: '123',
                sykmeldingId: '1',
                source: 'test',
                timestamp: '2021-01-01',
            },
        },
        parseISO('2021-01-01'),
    )

    expect(isNow).toBe(true)
})

test('isSykmeldingNow now same as tom', async () => {
    const isNow = isSykmeldingNow(
        {
            sykmelding: {
                id: '1',
                mottattTidspunkt: '2021-01-01',
                sykmeldingsperioder: [
                    {
                        fom: '2021-01-01',
                        tom: '2021-01-10',
                    },
                ],
            },
            kafkaMetadata: {
                fnr: '123',
                sykmeldingId: '1',
                source: 'test',
                timestamp: '2021-01-01',
            },
        },
        parseISO('2021-01-10'),
    )
    expect(isNow).toBe(true)
})

test('isSykmeldingNow outside tom+1', async () => {
    const isNow = isSykmeldingNow(
        {
            sykmelding: {
                id: '1',
                mottattTidspunkt: '2021-01-01',
                sykmeldingsperioder: [
                    {
                        fom: '2021-01-01',
                        tom: '2021-01-10',
                    },
                ],
            },
            kafkaMetadata: {
                fnr: '123',
                sykmeldingId: '1',
                source: 'test',
                timestamp: '2021-01-01',
            },
        },
        parseISO('2021-01-11'),
    )
    expect(isNow).toBe(false)
})

test('isSykmeldingNow outside fom-1', async () => {
    const isNow = isSykmeldingNow(
        {
            sykmelding: {
                id: '1',
                mottattTidspunkt: '2021-01-01',
                sykmeldingsperioder: [
                    {
                        fom: '2021-01-02',
                        tom: '2021-01-10',
                    },
                ],
            },
            kafkaMetadata: {
                fnr: '123',
                sykmeldingId: '1',
                source: 'test',
                timestamp: '2021-01-01',
            },
        },
        parseISO('2021-01-01'),
    )
    expect(isNow).toBe(false)
})
