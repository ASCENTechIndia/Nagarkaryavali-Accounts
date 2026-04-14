// //auth.controller.js
// const asyncHandler = require("../../libs/asyncHandler");
// const { ok } = require("../../libs/response");
// const service = require("./auth.service");
// /**
//  * Controller = only HTTP layer
//  * - reads req
//  * - calls service
//  * - returns standardized JSON
//  *
//  * Service should handle:
//  * - procedure/function calling
//  * - multiple queries
//  * - transactions
//  */

// /**
//  * POST /api/auth/send-otp
//  * body: { mobile, mode?, userId?, ulbId? }
//  */
// exports.sendOtp = asyncHandler(async (req, res) => {
//   const { userId, mobile, otp, mode} = req.body;

//   const data = await require("./auth.service").sendOtp({
//     userId,
//     mobile,
//     otp,
//     mode,
//   });
//   return ok(res, data, "OTP sent");
// });

// /**
//  * POST /api/auth/verify-otp
//  * body: { mobile, otp, mode?, userId?, ulbId? }
//  * returns: { user, token }
//  */
// exports.verifyOtp = asyncHandler(async (req, res) => {
//   const { userId, mobile, otp, mode } = req.body;

//   const data = await require("./auth.service").verifyOtp({
//     userId,
//     mobile,
//     otp,
//     mode,
//   });

//   return ok(res, data, "Login success");
// });

// /**
//  * POST /api/auth/login
//  * For email/password (optional if your project has it)
//  * body: { email, password }
//  */
// exports.login = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   const data = await require("./auth.service").login({
//     email,
//     password,
//   });

//   return ok(res, data, "Login success");
// });

// /**
//  * POST /api/auth/register
//  * body: { name, email, mobile, password }
//  */
// exports.register = asyncHandler(async (req, res) => {
//   const { name, email, mobile, password } = req.body;

//   const data = await require("./auth.service").register({
//     name,
//     email,
//     mobile,
//     password,
//   });

//   return ok(res, data, "Registered successfully");
// });

// /**
//  * POST /api/auth/refresh
//  * body: { refreshToken }
//  * returns: { token }
//  */
// exports.refresh = asyncHandler(async (req, res) => {
//   const { refreshToken } = req.body;

//   const data = await require("./auth.service").refresh({ refreshToken });

//   return ok(res, data, "Token refreshed");
// });


// /**
//  * POST /api/auth/logout
//  * header: Authorization: Bearer <token>
//  * or body: { refreshToken }
//  */
// exports.logout = asyncHandler(async (req, res) => {
//   const authHeader = req.headers.authorization || "";
//   let token = authHeader.startsWith("Bearer ")
//     ? authHeader.substring(7)
//     : null;

//   // allow tokens passed via query string (sendBeacon) or body
//   const refreshToken =
//     req.body?.refreshToken || req.query?.refreshToken || null;

//   if (!token && req.query?.token) {
//     token = req.query.token;
//   }

//   const data = await require("./auth.service").logout({
//     token,
//     refreshToken,
//   });

//   return ok(res, data, "Logged out");
// });

// /**
//  * GET /api/auth/me
//  * header: Authorization: Bearer <token>
//  */
// exports.me = asyncHandler(async (req, res) => {
//   // req.user should be set by auth.middleware.js
//   const user = req.user || null;
//   return ok(res, user, "User profile");
// });


// exports.loginProc = asyncHandler(async (req, res) => {
//   const payload = {
//     userId: req.body.userId,
//     password: req.body.password,
//     macaddr: req.body.macaddr || "",
//     ipaddr: req.body.ipaddr || req.ip,
//     hostname: req.body.hostname || req.headers.host || "",
//     source: req.body.source || "WEB",
//   };

//   const data = await service.loginProc(payload);
//   return ok(res, data, "Login success");
// });

// exports.changePassword = asyncHandler(async (req, res) => {
//   const { userId, oldPassword, newPassword, ulbId } = req.body;

//   const data = await service.changePassword({
//     userId,
//     oldPassword,
//     newPassword,
//     ulbId,
//   });

//   return ok(res, data, data.message);
// });



// auth.controller.js

const asyncHandler = require("../../libs/asyncHandler");
const { ok } = require("../../libs/response");
const service = require("./auth.service");

exports.loginProc = asyncHandler(async (req, res) => {
  const payload = {
    userId: req.body.userId,
    password: req.body.password,
    macaddr: req.body.macaddr || "",
    ipaddr: req.body.ipaddr || req.ip,
    hostname: req.body.hostname || req.headers.host || "",
    source: req.body.source || "WEB",
    deptId: req.body.deptId || 0   // 🔥 IMPORTANT FIX
  };

  const data = await service.loginProc(payload);

  return ok(res, data, "Login success");
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { userId, oldPassword, newPassword, ulbId } = req.body;

  const data = await service.changePassword({
    userId,
    oldPassword,
    newPassword,
    ulbId,
  });

  return ok(res, data, data.message);
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const data = await service.refresh({ refreshToken });

  return ok(res, data, "Token refreshed");
});


exports.logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || "";

  let token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  const refreshToken =
    req.body?.refreshToken || req.query?.refreshToken || null;

  if (!token && req.query?.token) {
    token = req.query.token;
  }

  const data = await service.logout({
    token,
    refreshToken,
  });

  return ok(res, data, "Logged out");
});


exports.me = asyncHandler(async (req, res) => {
  return ok(res, req.user || null, "User profile");
});