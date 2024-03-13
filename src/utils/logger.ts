import pino from 'pino'

const logger = (defaultConfig = {}): pino.Logger =>
    pino({
        ...defaultConfig,
        timestamp: false,
        formatters: {
            level: (label) => {
                return { level: label }
            },
            log: (object: any) => {
                if (object.err) {
                    const err = pino.stdSerializers.err(object.err)
                    object.stack_trace = err.stack
                    object.type = err.type
                    object.message = err.message
                    delete object.err
                }

                return object
            },
        },
    })

export default logger()
