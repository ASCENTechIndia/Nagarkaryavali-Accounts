// //auth.routes.js
// const express = require("express");
// const controller = require("./auth.controller");

// // middlewares
// const validate = require("../../middlewares/validate.middleware");
// const auth = require("../../middlewares/auth.middleware");

// const { otpRateLimit, loginRateLimit } = require("../../middlewares/rateLimit.middleware");

// // validations (zod schemas)
// const {
//   sendOtpSchema,
//   verifyOtpSchema,
//   registerSchema,
//   loginSchema,
//   refreshSchema,
//   logoutSchema,
//   loginProcSchema,
//   changePasswordSchema
// } = require("./auth.validation");

// const router = express.Router();

// /**
//  * Base path used in app.js:
//  * app.use("/api/auth", authRoutes)
//  *
//  * Final endpoints:
//  * POST   /api/auth/send-otp
//  * POST   /api/auth/verify-otp
//  * POST   /api/auth/register
//  * POST   /api/auth/login
//  * POST   /api/auth/refresh
//  * POST   /api/auth/logout
//  * GET    /api/auth/me
//  */

// // OTP flow
// // router.post("/send-otp", validate(sendOtpSchema), controller.sendOtp);
// router.post(
//   "/send-otp",
//   otpRateLimit,
//   validate(sendOtpSchema),
//   controller.sendOtp
// );
// router.post("/verify-otp", validate(verifyOtpSchema), controller.verifyOtp);

// // Email/password flow (optional)
// router.post("/register", validate(registerSchema), controller.register);
// //router.post("/login", validate(loginSchema), controller.login);

// router.post(
//   "/login",
//   loginRateLimit,
//   validate(loginSchema),
//   controller.login
// );
// // Token flow (optional)
// router.post("/refresh", validate(refreshSchema), controller.refresh);

// // Logout (optional)
// // If you want logout to require login, keep `auth()`
// // If you want logout without auth, remove `auth()`
// router.post("/logout", validate(logoutSchema), auth(), controller.logout);

// router.post(
//   "/login-proc",
//   loginRateLimit,         // if you have it
//   validate(loginProcSchema),
//   controller.loginProc
// );
// // Profile
// router.get("/me", auth(), controller.me);

// router.post(
//   "/change-password",
//   auth(),
//   validate(changePasswordSchema),
//   controller.changePassword
// );


// module.exports = router;



const express = require("express");
const router = express.Router();

const controller = require("./auth.controller");

router.post("/login-proc", controller.loginProc);

router.post("/change-password", controller.changePassword);

router.post("/refresh", controller.refresh);

router.post("/logout", controller.logout);

router.get("/me", controller.me);

module.exports = router;