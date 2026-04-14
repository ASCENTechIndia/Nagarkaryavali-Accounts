// src/middlewares/responseBodyCapture.middleware.js
function trim(val, max = 2000) {
  if (val == null) return val;
  const str = typeof val === "string" ? val : JSON.stringify(val);
  if (str.length <= max) return val;
  return { _truncated: true, _bytes: Buffer.byteLength(str), _preview: str.slice(0, max) + "..." };
}

module.exports = function responseBodyCapture(req, res, next) {
  const enabled = String(process.env.LOG_RESPONSE_BODY || "").toLowerCase() === "true";
  if (!enabled) return next();

  const oldJson = res.json.bind(res);
  const oldSend = res.send.bind(res);

  res.json = (body) => {
    res.locals.responseBody = trim(body);
    return oldJson(body);
  };

  res.send = (body) => {
    res.locals.responseBody = trim(body);
    return oldSend(body);
  };

  next();
};
