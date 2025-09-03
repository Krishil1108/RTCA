const pino = require('pino');

// Redact common sensitive fields if present anywhere in objects
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: ['req.headers.authorization', 'password', 'token', 'refreshToken', 'client_secret', '*.password'],
    remove: true
  },
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' }
  }
});

module.exports = logger;
