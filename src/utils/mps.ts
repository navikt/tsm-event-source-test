/**
 * A singleton that tracks how many messages per second the consumer is reading.
 */
class MessagesRate {
    private readonly interval: number
    private timestamps: number[] = []

    constructor(intervalSeconds = 1) {
        this.interval = intervalSeconds * 1000 // Convert seconds to milliseconds
    }

    readMessages(messagesRead: number): void {
        const now = Date.now()
        for (let i = 0; i < messagesRead; i++) {
            this.timestamps.push(now)
        }
        this.cleanup()
    }

    mps(): number {
        this.cleanup()
        const intervalMessages = this.timestamps.length
        return (intervalMessages / this.interval) * 1000 // Convert to messages per second
    }

    private cleanup(): void {
        const threshold = Date.now() - this.interval
        this.timestamps = this.timestamps.filter((timestamp) => timestamp > threshold)
    }
}

export default new MessagesRate()
