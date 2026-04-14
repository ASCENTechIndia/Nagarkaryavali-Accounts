function ok(res, data = null, message = "success") {
  return res.json({ ok: true, message, data });
}

function fail(res, error = "failed", status = 400) {
  return res.status(status).json({ ok: false, error });
}

module.exports = { ok, fail };
