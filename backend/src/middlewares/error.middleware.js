// const { AppError } = require("../libs/errors");
// const logger = require("../libs/logger");

// module.exports = (err, req, res, next) => {
//   logger.error(err);

//   if (err instanceof AppError) {
//     return res.status(err.status).json({ ok: false, error: err.message });
//   }

//   return res.status(500).json({ ok: false, error: "Internal Server Error" });
// };


const { AppError } = require("../libs/errors");
const logger = require("../libs/logger");

module.exports = (err, req, res, next) => {
  logger.error(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({ ok: false, error: err.message });
  }

  return res.status(500).json({ ok: false, error: "Internal Server Error" });
};
