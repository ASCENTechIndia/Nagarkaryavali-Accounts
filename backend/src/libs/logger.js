// const pino = require("pino");

// const logger = pino({
//   transport:
//     process.env.NODE_ENV !== "production"
//       ? { target: "pino-pretty" }
//       : undefined,
// });

// module.exports = logger;
// backend/src/libs/logger.js
// const fs = require("fs");
// const path = require("path");
// const pino = require("pino");

// const logsDir = path.join(process.cwd(), "logs");
// if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

// const logger = pino(
//   {
//     level: process.env.LOG_LEVEL || "info",
//     timestamp: pino.stdTimeFunctions.isoTime,
//   },
//   pino.multistream([
//     { stream: process.stdout }, // console
//     { stream: fs.createWriteStream(path.join(logsDir, "app.log"), { flags: "a" }) },
//     { level: "error", stream: fs.createWriteStream(path.join(logsDir, "error.log"), { flags: "a" }) },
//   ])
// );

// module.exports = logger;

// backend/src/libs/logger.js
// src/libs/logger.js
const fs = require("fs");
const path = require("path");
const pino = require("pino");

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const isDev = process.env.NODE_ENV !== "production";

// pretty console in dev
const prettyTransport = isDev
  ? pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: true,
      },
    })
  : undefined;

const streams = [
  // console
  { level: process.env.LOG_LEVEL || "info", stream: prettyTransport || process.stdout },

  // file logs (always JSON)
  { level: "info", stream: fs.createWriteStream(path.join(logsDir, "app.log"), { flags: "a" }) },
  { level: "error", stream: fs.createWriteStream(path.join(logsDir, "error.log"), { flags: "a" }) },
];

const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    base: { service: process.env.SERVICE_NAME || "property-backend" },
    timestamp: pino.stdTimeFunctions.isoTime,

    // hide secrets
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.password",
        "req.body.pass",
        "req.body.token",
        "req.body.refreshToken",
        "req.body.otp",
      ],
      censor: "***",
    },

    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
    },
  },
  pino.multistream(streams)
);

module.exports = logger;