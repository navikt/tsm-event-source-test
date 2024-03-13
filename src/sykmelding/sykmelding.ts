import * as R from 'remeda'
import { isAfter, isBefore, isSameDay, parseISO } from 'date-fns'

export type SykmeldingKafkaMetadata = {
    kafkaMetadata: {
        sykmeldingId: string
        timestamp: string
        fnr: string
        source: string
    }
}

export type BekreftetSykmeldingType = SykmeldingKafkaMetadata & {
    sykmelding: {
        id: string
        mottattTidspunkt: string
        sykmeldingsperioder: {
            fom: string
            tom: string
        }[]
    }
}

export type SendtSykmeldingType = SykmeldingKafkaMetadata & {
    sykmelding: {
        id: string
        mottattTidspunkt: string
        sykmeldingsperioder: {
            fom: string
            tom: string
        }[]
    }
}

export function isSykmeldingNow(sykmelding: SendtSykmeldingType | BekreftetSykmeldingType, now: Date): boolean {
    return sykmelding.sykmelding.sykmeldingsperioder.some(({ fom, tom }) => {
        return isSameDay(now, fom) || isSameDay(now, tom) || (isAfter(now, fom) && isBefore(now, tom))
    })
}

export function getLatestTom(sykmelding: SendtSykmeldingType | BekreftetSykmeldingType): Date {
    const latestTom = R.pipe(
        sykmelding.sykmelding.sykmeldingsperioder,
        R.map((it) => it.tom),
        R.map(parseISO),
        R.maxBy((it) => it.getTime()),
    )

    if (latestTom == null) {
        throw new Error(`Sykmelding without tom, impossible! (${sykmelding.kafkaMetadata.sykmeldingId})`)
    }

    return latestTom
}
