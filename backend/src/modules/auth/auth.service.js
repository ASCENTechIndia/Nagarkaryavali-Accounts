// //auth.service.js
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// const { AppError } = require("../../libs/errors");

// const repo = require("./auth.repo");
// const { JWT_SECRET, NODE_ENV } = require("../../config/env");
// const passwordEncryption = require("../../libs/passwordEncryption");

// /**
//  * =========================
//  * Token helpers
//  * =========================
//  */

// // Access token expiration: 30 minutes (backend)
// // Frontend has 1-minute inactivity timeout for session security
// // This allows API requests to complete without timeout failures
// const ACCESS_TOKEN_EXPIRES_IN = "30m";

// // Refresh token is optional (if you want long sessions)
// const REFRESH_TOKEN_EXPIRES_IN = "30d";

// // set false if you don't want refresh tokens right now
// const USE_REFRESH_TOKENS = true;

// // Token blacklist: stores JTI (JWT ID) or full token hash to prevent reuse
// const TOKEN_BLACKLIST = new Set();

// // Function to add token to blacklist
// function blacklistToken(token) {
//   try {
//     const decoded = jwt.decode(token); // decode without verification
//     if (decoded && decoded.exp) {
//       TOKEN_BLACKLIST.add(token);
      
//       // Auto-cleanup expired tokens from blacklist
//       const expiresAt = decoded.exp * 1000;
//       const timeout = Math.max(expiresAt - Date.now(), 0);
      
//       setTimeout(() => {
//         TOKEN_BLACKLIST.delete(token);
//         console.log("🗑️ Removed expired token from blacklist");
//       }, timeout + 1000); // Add 1 second buffer
//     }
//   } catch (err) {
//     console.warn("Failed to blacklist token:", err.message);
//   }
// }

// // Function to check if token is blacklisted
// function isTokenBlacklisted(token) {
//   return TOKEN_BLACKLIST.has(token);
// }

// function signAccessToken(payload) {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
// }

// function signRefreshToken(payload) {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
// }

// function verifyToken(token) {
//   try {
//     return jwt.verify(token, JWT_SECRET);
//   } catch (e) {
//     throw new AppError("Invalid or expired token", 401);
//   }
// }

// function safeUser(user) {
//   if (!user) return null;
//   // remove any sensitive keys if present
//   const { password_hash, passwordHash, ...rest } = user;
//   return rest;
// }

// /**
//  * =========================
//  * OTP FLOW
//  * =========================
//  */

// /**
//  * Send OTP
//  * body: { mobile, mode?, userId?, ulbId? }
//  */
// async function sendOtp({ userId = null,mobile,  otp = null, mode = 1 }) {
//   if (!mobile) throw new AppError("mobile is required", 422);

//   // You can add stricter validation if needed:
//   // if (!/^\d{10}$/.test(String(mobile))) throw new AppError("Invalid mobile", 422);

//   const result = await repo.sendOtp({
//     userId,
//     mobile: Number(mobile),
//     otp: otp !== null ? String(otp) : null,
//     mode: Number(mode),
//   });


//   const errorCode = Number(result.out_errorcode ?? 0);
//   const errorMsg = result.out_errormsg ?? "Login failed";


//   // If verification failed, your stored procedure usually blocks user fetch.
//   // If user is null, treat as invalid otp.
//   if (errorCode !== -100) {
//     throw new AppError(errorMsg, 422);
//   }
//   return result;
// }

// /**
//  * Verify OTP + login => returns JWT (and optional refresh token)
//  * body: { mobile, otp, mode?, userId?, ulbId? }
//  */
// async function verifyOtp({ userId = null,mobile,  otp = null, mode = 1 }) {
//   if (!mobile) throw new AppError("mobile is required", 422);
//   if (!otp) throw new AppError("otp is required", 422);

//   const result = await repo.verifyOtp({
//     userId,
//     mobile: Number(mobile),
//     otp: String(otp),
//     mode: Number(mode),
//   });


//   const errorCode = Number(result.out_errorcode ?? 0);
//   const errorMsg = result.out_errormsg ?? "Login failed";


//   // If verification failed, your stored procedure usually blocks user fetch.
//   // If user is null, treat as invalid otp.
//   if (errorCode !== -100) {
//     throw new AppError(errorMsg, 422);
//   }

//    return result;
// }

// /**
//  * =========================
//  * EMAIL/PASSWORD (OPTIONAL)
//  * =========================
//  */

// async function register({ name, email, mobile, password }) {
//   if (!name) throw new AppError("name is required", 422);
//   if (!email) throw new AppError("email is required", 422);
//   if (!mobile) throw new AppError("mobile is required", 422);
//   if (!password || password.length < 6) {
//     throw new AppError("password must be at least 6 characters", 422);
//   }

//   // If you want to check duplicates, add repo method for that.
//   const passwordHash = await bcrypt.hash(password, 10);

//   const user = await repo.registerUser({
//     name: String(name).trim(),
//     email: String(email).trim().toLowerCase(),
//     mobile: String(mobile).trim(),
//     passwordHash,
//   });

//   return { user: safeUser(user) };
// }

// async function login({ email, password }) {
//   if (!email) throw new AppError("email is required", 422);
//   if (!password) throw new AppError("password is required", 422);

//   const userRow = await repo.loginWithPassword({
//     email: String(email).trim().toLowerCase(),
//   });

//   if (!userRow) throw new AppError("Invalid credentials", 401);

//   const hash = userRow.password_hash || userRow.passwordHash;
//   if (!hash) throw new AppError("Password login not configured for this user", 400);

//   const ok = await bcrypt.compare(password, hash);
//   if (!ok) throw new AppError("Invalid credentials", 401);

//   const token = signAccessToken({ sub: userRow.id, email: userRow.email });

//   let refreshToken = null;
//   if (USE_REFRESH_TOKENS) {
//     refreshToken = signRefreshToken({ sub: userRow.id });
//     try {
//       await repo.saveRefreshToken({ userId: userRow.id, refreshToken });
//     } catch (e) {
//       if (NODE_ENV === "production") {
//         // optionally enforce
//         // throw e;
//       }
//     }
//   }

//   return { user: safeUser(userRow), token, refreshToken };
// }

// /**
//  * =========================
//  * REFRESH + LOGOUT (OPTIONAL)
//  * =========================
//  */

// async function refresh({ refreshToken }) {
//   if (!USE_REFRESH_TOKENS) throw new AppError("Refresh token disabled", 400);
//   if (!refreshToken) throw new AppError("refreshToken is required", 422);

//   const decoded = verifyToken(refreshToken);
//   const userId = decoded.sub;

//   if (!userId) throw new AppError("Invalid refresh token", 401);

//   // ✅ NEW: Validate refresh token exists in database (not revoked)
//   const storedToken = await repo.getRefreshToken({ refreshToken });
//   if (!storedToken) {
//     throw new AppError("Refresh token has been revoked (logged out)", 401);
//   }

//   const token = signAccessToken({ sub: userId });
//   return { token };
// }

// async function logout({ refreshToken, token }) {
//   // ✅ NEW: Also blacklist the access token in database to revoke immediately
//   if (token) {
//     console.log("🚫 Blacklisting access token on logout");
//     blacklistToken(token); // in-memory blacklist
    
//     try {
//       await repo.blacklistAccessToken({ token }); // database blacklist
//       console.log("🚫 Added token to database blacklist");
//     } catch (e) {
//       console.warn("⚠️ Failed to add token to database blacklist:", e.message);
//       if (NODE_ENV === "production") throw e;
//     }
//   }

//   // ✅ Delete refresh token (revokes session)
//   if (USE_REFRESH_TOKENS && refreshToken) {
//     try {
//       await repo.deleteRefreshToken({ refreshToken });
//       console.log("🗑️ Deleted refresh token from DB");
//     } catch (e) {
//       // if table missing, ignore in dev
//       console.warn("⚠️ Failed to delete refresh token:", e.message);
//       if (NODE_ENV === "production") {
//         // optionally enforce
//         // throw e;
//       }
//     }
//   }

//   return { ok: true, message: "Logged out successfully" };
// }


// async function loginProc(payload) {
//   //console.log("loginProc payload:", payload);
  
//   // ✅ Encrypt password before sending to stored procedure
//   let encryptedPayload = { ...payload };
//   if (payload.password) {
//     try {
//       encryptedPayload.password = passwordEncryption.encryptPassword(payload.password);
//       console.log("✅ Password encrypted for login");
//     } catch (error) {
//       logger.error("❌ Password encryption failed:", error.message);
//       throw new AppError("Password encryption failed", 500);
//     }
//   }
  
//   const out = await repo.loginByProcedure(encryptedPayload);
//    // console.log("PROC OUT:", out);

//   if (!out) {
//     // This happens if pg driver didn't return OUT row
//     throw new AppError(
//       "Procedure executed but OUT params not returned. Check PG procedure OUT behavior with CALL.",
//       500
//     );
//   }

//   console.log("Login Proc Output :::::", out);

//   const errorCode = Number(out.out_errorcode ?? 0);
//   const errorMsg = out.out_errormsg ?? "Login failed";

//   // if (errorCode !== 9999) {
//   //   throw new AppError(errorMsg, 500);
//   // }

//   if (errorCode != 9999) {
//   // Auth failures → 401
//   if (
//     errorMsg.toLowerCase().includes("invalid") ||
//     errorMsg.toLowerCase().includes("password") ||
//     errorMsg.toLowerCase().includes("credential")
//   ) {
//     throw new AppError(errorMsg, 401);
//   }

//   // User blocked / forbidden
//   if (errorMsg.toLowerCase().includes("blocked")) {
//     throw new AppError(errorMsg, 403);
//   }

//   // Business / validation errors
//   throw new AppError(errorMsg, 422);
// }


//   const token = signAccessToken({
//     sub: out.out_userid,
//     name: out.out_username,
//     orgId: out.out_orgid,
//     roles: ["USER"], // change if you have roles mapping
//   });

//   let refreshToken = null;
//   if (USE_REFRESH_TOKENS) {
//     refreshToken = signRefreshToken({ sub: out.out_userid });
//     try {
//       await repo.saveRefreshToken({ userId: out.out_userid, refreshToken });
//     } catch (e) {
//       if (NODE_ENV === "production") {
//         // optionally enforce
//         // throw e;
//       }
//     }
//   }

//   return {
//     token,
//     refreshToken,
//     user: {
//       userId: out.out_userid,
//       userName: out.out_username,
//       orgId: out.out_orgid,
//       mobile: out.out_mobileno,
//       userType: out.out_usertype,
//       desigId: out.out_desigid,
//       prabhagId: out.out_prabhagid,
//       prabhagName: out.out_prabhagname,
//       corporation: out.out_corporation,
//       corporationAddress: out.out_corporationaddress,
//       receiptOfficeName: out.out_receiptofficename,
//       chalanOfficeName: out.out_chalanofficename,
//       collectionCenter: out.out_collectioncenter,
//       otpValidate: out.out_otpvalidate,
//       lastLogin: out.out_lastlogin,
//       lastLogout: out.out_lastlogout,
//     },
//   };
// }


// async function changePassword({ userId, oldPassword, newPassword, ulbId }) {
//   if (!userId) throw new AppError("userId is required", 422);
//   if (!oldPassword) throw new AppError("oldPassword is required", 422);
//   if (!newPassword) throw new AppError("newPassword is required", 422);
//   if (!ulbId) throw new AppError("ulbId is required", 422);

//   if (oldPassword === newPassword) {
//     throw new AppError("New password and old password cannot be same", 422);
//   }

//   // ✅ Encrypt both old and new passwords
//   let encryptedOldPassword = oldPassword;
//   let encryptedNewPassword = newPassword;
  
//   try {
//     encryptedOldPassword = passwordEncryption.encryptPassword(oldPassword);
//     encryptedNewPassword = passwordEncryption.encryptPassword(newPassword);
//     console.log("✅ Passwords encrypted for change password");
//   } catch (error) {
//     logger.error("❌ Password encryption failed:", error.message);
//     throw new AppError("Password encryption failed", 500);
//   }

//   const result = await repo.changePassword({
//     userId,
//     oldPassword: encryptedOldPassword,
//     newPassword: encryptedNewPassword,
//     ulbId: Number(ulbId),
//   });

//   if (!result) {
//     throw new AppError(
//       "Procedure executed but OUT params not returned",
//       500
//     );
//   }

//   const errorCode = Number(result.out_errorcode ?? 0);
//   const errorMsg = result.out_errormsg ?? "Password change failed";

//   if (errorCode !== -100) {
//     throw new AppError(errorMsg, 422);
//   }

//     return {
//     errorCode,
//     message: errorMsg,
//   };
// }

// module.exports = {
//   sendOtp,
//   verifyOtp,
//   register,
//   login,
//   refresh,
//   logout,
//     loginProc,
//     changePassword,
//     isTokenBlacklisted,
//     blacklistToken
// };


// auth.service.js (Oracle Compatible)

const jwt = require("jsonwebtoken");
const { AppError } = require("../../libs/errors");

const repo = require("./auth.repo");
const { JWT_SECRET, NODE_ENV } = require("../../config/env");
const { encryptPassword } = require("../../libs/encryption");


const ACCESS_TOKEN_EXPIRES_IN = "30m";
const REFRESH_TOKEN_EXPIRES_IN = "30d";
const USE_REFRESH_TOKENS = true;

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    throw new AppError("Invalid or expired token", 401);
  }
}


async function loginProc(payload) {
  console.log("📥 Incoming payload:", payload);

  // ✅ IMPORTANT: Encrypt before sending to Oracle
  const encryptedPassword = encryptPassword(payload.password);

  console.log("🔐 Encrypted password:", encryptedPassword);

  const finalPayload = {
    ...payload,
    password: encryptedPassword,
  };

  console.log("📤 Sending to DB:", finalPayload);

  const out = await repo.loginByProcedure(finalPayload);

  console.log("📥 DB Response:", out);

  if (!out) {
    throw new AppError("Procedure did not return output", 500);
  }

  const errorCode = Number(out.errorCode ?? 0);
  const errorMsg = out.errorMsg ?? "Login failed";

  console.log("⚠️ ErrorCode:", errorCode);
  console.log("⚠️ ErrorMsg:", errorMsg);

  if (errorCode !== 9999) {
    throw new AppError(errorMsg, 401);
  }

  return {
    token: signAccessToken({
      sub: out.userId,
      name: out.username,
      orgId: out.orgId,
    }),
    user: out,
  };
}

async function changePassword({ userId, oldPassword, newPassword, ulbId }) {
  if (!userId) throw new AppError("userId is required", 422);
  if (!oldPassword) throw new AppError("oldPassword is required", 422);
  if (!newPassword) throw new AppError("newPassword is required", 422);
  if (!ulbId) throw new AppError("ulbId is required", 422);

  if (oldPassword === newPassword) {
    throw new AppError("New password cannot be same", 422);
  }

  const result = await repo.changePassword({
    userId,
    oldPassword,
    newPassword,
    ulbId: Number(ulbId),
  });

  if (!result) {
    throw new AppError("Procedure did not return output", 500);
  }

  const errorCode = Number(result.errorCode ?? 0);
  const errorMsg = result.errorMsg ?? "Password change failed";

  if (errorCode !== 9999) {
    throw new AppError(errorMsg, 422);
  }

  return {
    message: errorMsg,
    errorCode,
  };
}

module.exports = {
  loginProc,
  verifyToken,
  changePassword
};