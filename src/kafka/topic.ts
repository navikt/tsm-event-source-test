export const BEKREFTET_TOPIC = 'teamsykmelding.syfo-bekreftet-sykmelding'
export const SENDT_TOPIC = 'teamsykmelding.syfo-sendt-sykmelding'

export type SYKMELDING_TOPICS = typeof BEKREFTET_TOPIC | typeof SENDT_TOPIC

export const processFromByPartition: Record<typeof BEKREFTET_TOPIC | typeof SENDT_TOPIC, [number, string][]> = {
    [BEKREFTET_TOPIC]: [
        [0, '182653'],
        [1, '175834'],
        [2, '346481'],
    ],
    [SENDT_TOPIC]: [
        [0, '4442393'],
        [1, '4435253'],
        [2, '4438448'],
    ],
}
