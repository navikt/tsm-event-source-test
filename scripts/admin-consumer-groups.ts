import * as R from 'remeda'

import kafka from '../src/kafka/client.ts'

const admin = kafka.admin()
await admin.connect()

const groups = await admin.listGroups()
const toDelete = R.pipe(
    groups.groups,
    R.filter((it) => it.groupId.startsWith('tsm-event-source-test')),
    R.map((it) => {
        return {
            groupId: it.groupId,
            date: new Date(+it.groupId.split('-').splice(-1)[0]),
        }
    }),
)

console.log(toDelete)
console.log(`Found ${toDelete.length} tsm consumers`)

if (toDelete.length === 0) {
    console.log('Nothing to delete')
    await admin.disconnect()
    process.exit(0)
}

if (Bun.argv.some((it) => it === '--delete')) {
    const result = await admin.deleteGroups(toDelete.map((it) => it.groupId))
    console.log(result)
    console.log(`Deleted ${result.filter((it) => it.errorCode === 0).length} groups`)
    console.log(`Failed to delete ${result.filter((it) => it.errorCode !== 0).length} groups`)
} else {
    console.log('Only dry run')
}

await admin.disconnect()
