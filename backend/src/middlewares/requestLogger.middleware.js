// // backend/src/middlewares/requestLogger.middleware.js
// const pinoHttp = require("pino-http");
// const logger = require("../libs/logger");

// module.exports = pinoHttp({
//   logger,
//   customLogLevel: function (res, err) {
//     if (res.statusCode >= 500 || err) return "error";
//     if (res.statusCode >= 400) return "warn";
//     return "info";
//   },
// });
// src/middlewares/requestLogger.middleware.js
const pinoHttp = require("pino-http");
const logger = require("../libs/logger"); // ✅ important: correct path

function safeBody(body, maxLen = 1500) {
  if (!body) return undefined;
  try {
    const s = JSON.stringify(body);
    if (s.length <= maxLen) return body;
    return { _truncated: true, _bytes: Buffer.byteLength(s), _preview: s.slice(0, maxLen) + "..." };
  } catch {
    return "[unserializable]";
  }
}

module.exports = pinoHttp({
  logger,
  wrapSerializers: false,

  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.socket?.remoteAddress,
        headers: {
          "user-agent": req.headers["user-agent"],
          "content-type": req.headers["content-type"],
        },
        params: req.params,
        query: req.query,
        body: safeBody(req.body),
      };
    },

    res(res) {
      return {
        statusCode: res.statusCode,
        body: res.locals?.responseBody, // ✅ captured by responseBodyCapture
      };
    },

    err(err) {
      return {
        type: err?.name,
        message: err?.message,
        code: err?.code,
        status: err?.status,
      };
    },
  },

  customProps(req, res) {
    return {
      route: req.route?.path,
    };
  },

  customLogLevel(res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  // ✅ message includes responseTime from pino-http log "responseTime"
  customSuccessMessage(req, res) {
    return `✅ ${req.method} ${(req.originalUrl || req.url)} -> ${res.statusCode}`;
  },

  customErrorMessage(req, res, err) {
    return `❌ ${req.method} ${(req.originalUrl || req.url)} -> ${res.statusCode} | ${err?.message}`;
  },

  autoLogging: {
    ignore(req) {
      return req.originalUrl === "/favicon.ico";
    },
  },
});
