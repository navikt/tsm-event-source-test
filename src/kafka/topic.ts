export const BEKREFTET_TOPIC = 'teamsykmelding.syfo-bekreftet-sykmelding'
export const SENDT_TOPIC = 'teamsykmelding.syfo-sendt-sykmelding'

export const processFromByPartition: Record<typeof BEKREFTET_TOPIC | typeof SENDT_TOPIC, [number, string][]> = {
    [BEKREFTET_TOPIC]: [
        [0, '1'],
        [1, '1'],
        [2, '1'],
    ],
    [SENDT_TOPIC]: [
        [0, '1'],
        [1, '1'],
        [2, '1'],
    ],
}
