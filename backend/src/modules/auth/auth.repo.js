// //auth.repo.js
// const { withTx } = require("../../db/tx");


// const OTP_IS_PROCEDURE = true; // change to false if it's a FUNCTION

// // 🔁 update this to your real name
// const OTP_PROC_OR_FN_NAME = "aoms_proplogin_otp";


// async function callOtpRoutine(client, { userId, mobile, otp, mode, ulbId }) {
//   // You can pass null safely when values are optional
//   const params = [
//     userId ?? null,
//     mobile ?? null,
//     otp ?? null,
//     mode ?? null,
//     ulbId ?? null,
//   ];

//   if (OTP_IS_PROCEDURE) {
//     // PROCEDURE: CALL proc($1,$2,$3,$4,$5)
//     const sql = `CALL ${OTP_PROC_OR_FN_NAME}($1,$2,$3,$4,$5)`;
//     await client.query(sql, params);
//     return { ok: true };
//   } else {
//     // FUNCTION: SELECT * FROM fn($1,$2,$3,$4,$5)
//     // If function returns something, it will be in rows
//     const sql = `SELECT * FROM ${OTP_PROC_OR_FN_NAME}($1,$2,$3,$4,$5)`;
//     const r = await client.query(sql, params);
//     return { ok: true, rows: r.rows };
//   }
// }

// /**
//  * ✅ SEND OTP flow (transaction safe)
//  * - calls stored routine (Mode usually 1)
//  * - optionally logs OTP request
//  */

// async function sendOtp({ userId, mobile, otp, mode }) {
//   return withTx(async (client) => {
//     const sql = `
//       CALL admins.aoms_proplogin_otp(
//         $1::text,  -- in_userid
//         $2::numeric,  -- in_mobile
//         $3::text,  -- in_otp
//         $4::numeric,  --  in_mode
        
//         NULL::numeric, -- out_errorcode
//         NULL::text    --out_errormsg
   
//       )
//     `;

//     const params = [userId, mobile, otp, mode];
//     const r = await client.query(sql, params);

//     // CALL typically returns no rows in node-postgres
//     return r.rows?.[0] || null;
//   });
// }

// async function verifyOtp({ userId, mobile, otp, mode }) {
//   return withTx(async (client) => {
//     const sql = `
//       CALL admins.aoms_proplogin_otp(
//         $1::text,  -- in_userid
//         $2::numeric,  -- in_mobile
//         $3::text,  -- in_otp
//         $4::numeric,  --  in_mode
        
//         NULL::numeric, -- out_errorcode
//         NULL::text    --out_errormsg
   
//       )
//     `;

//     const params = [userId, mobile, otp, mode];
//     const r = await client.query(sql, params);

//     // CALL typically returns no rows in node-postgres
//     return r.rows?.[0] || null;
//   });
// }

// /**
//  * ✅ Email/password login (optional)
//  * Replace query with your schema.
//  */
// async function loginWithPassword({ email }) {
//   return withTx(async (client) => {
//     const r = await client.query(
//       `SELECT id, name, email, password_hash
//        FROM users
//        WHERE email = $1
//        LIMIT 1`,
//       [email]
//     );
//     return r.rows[0] || null;
//   });
// }

// /**
//  * ✅ Register user (optional)
//  * Replace query with your schema.
//  */
// async function registerUser({ name, email, mobile, passwordHash }) {
//   return withTx(async (client) => {
//     const r = await client.query(
//       `INSERT INTO users (name, email, mobile, password_hash)
//        VALUES ($1,$2,$3,$4)
//        RETURNING id, name, email, mobile`,
//       [name, email, mobile, passwordHash]
//     );
//     return r.rows[0];
//   });
// }

// /**
//  * ✅ Save refresh token (optional)
//  */
// async function saveRefreshToken({ userId, refreshToken }) {
//   return withTx(async (client) => {
//     // Create table if needed: refresh_tokens(user_id, token, created_at)
//     await client.query(
//       `INSERT INTO refresh_tokens (user_id, token, created_at)
//        VALUES ($1,$2,NOW())`,
//       [userId, refreshToken]
//     );
//     return true;
//   });
// }

// /**
//  * ✅ Get refresh token by token string (validate it exists)
//  */
// async function getRefreshToken({ refreshToken }) {
//   return withTx(async (client) => {
//     const r = await client.query(
//       `SELECT user_id, token, created_at FROM refresh_tokens WHERE token = $1`,
//       [refreshToken]
//     );
//     return r.rows[0] || null;
//   });
// }

// /**
//  * ✅ Add token to blacklist (for access tokens after logout)
//  */
// async function blacklistAccessToken({ token }) {
//   return withTx(async (client) => {
//     // Decode token to get expiration time
//     const jwt = require('jsonwebtoken');
//     let expiresAt = null;
//     try {
//       const decoded = jwt.decode(token);
//       if (decoded && decoded.exp) {
//         expiresAt = new Date(decoded.exp * 1000);
//       }
//     } catch (e) {
//       // If decode fails, just use null for expiresAt
//     }

//     await client.query(
//       `INSERT INTO token_blacklist (token, blacklisted_at, expires_at)
//        VALUES ($1, NOW(), $2)
//        ON CONFLICT (token) DO NOTHING`,
//       [token, expiresAt]
//     );
//     return true;
//   });
// }

// /**
//  * ✅ Check if token is blacklisted
//  */
// async function isAccessTokenBlacklisted({ token }) {
//   return withTx(async (client) => {
//     const r = await client.query(
//       `SELECT 1 FROM token_blacklist WHERE token = $1`,
//       [token]
//     );
//     return r.rows.length > 0;
//   });
// }

// /**
//  * ✅ Remove refresh token (optional)
//  */
// async function deleteRefreshToken({ refreshToken }) {
//   return withTx(async (client) => {
//     await client.query(`DELETE FROM refresh_tokens WHERE token = $1`, [
//       refreshToken,
//     ]);
//     return true;
//   });
// }

// /**
//  * ✅ Get user by id (for /me) (optional)
//  */
// async function getUserById(id) {
//   return withTx(async (client) => {
//     const r = await client.query(
//       `SELECT id, name, email, mobile
//        FROM users
//        WHERE id = $1
//        LIMIT 1`,
//       [id]
//     );
//     return r.rows[0] || null;
//   });
// }


// async function loginByProcedure({ userId, password, macaddr, ipaddr, hostname, source }) {
//   return withTx(async (client) => {
//     const sql = `
//       CALL admins.aoma_login_fetch_prop(
//         $1::text,  -- in_userid
//         $2::text,  -- in_password
//         $3::text,  -- in_macaddr
//         $4::text,  -- in_ipaddr
//         $5::text,  -- in_hostname
//         $6::text,  -- in_source

//         NULL::text,    -- out_username
//         NULL::text,    -- out_userid
//         NULL::text,    -- out_lastlogin
//         NULL::text,    -- out_lastlogout
//         NULL::text,    -- out_corporation
//         NULL::text,    -- out_corporationaddress
//         NULL::text,    -- out_receiptofficename
//         NULL::text,    -- out_chalanofficename
//         NULL::text,    -- out_prabhagname
//         NULL::text,    -- out_prabhagid
//         NULL::text,    -- out_desigid
//         NULL::text,    -- out_usertype
//         NULL::numeric, -- out_collectioncenter
//         NULL::text,    -- out_mobileno
//         NULL::text,    -- out_otpvalidate
//         NULL::numeric, -- out_errorcode
//         NULL::text,    -- out_errormsg
//         NULL::numeric  -- out_orgid
//       )
//     `;

//     const params = [userId, password, macaddr, ipaddr, hostname, source];
//     const r = await client.query(sql, params);

//     // CALL typically returns no rows in node-postgres
//     return r.rows?.[0] || null;
//   });
// }



// async function changePassword({ userId, oldPassword, newPassword, ulbId }) {
//   return withTx(async (client) => {
//     const sql = `
//       CALL admins.aoma_changepassword_ins(
//         $1::text,   -- in_userid
//         $2::text,   -- in_oldpassword
//         $3::text,   -- in_newpassword
//         $4::numeric,-- in_ulbid

//         NULL::numeric, -- out_errorcode
//         NULL::text     -- out_errormsg
//       )
//     `;

//     const params = [
//       userId,
//       oldPassword,
//       newPassword,
//       ulbId,
//     ];

//     const r = await client.query(sql, params);

//     return r.rows?.[0] || null;
//   });
// }

// module.exports = {
//   sendOtp,
//   verifyOtp,
//   loginWithPassword,
//   registerUser,
//   saveRefreshToken,
//   deleteRefreshToken,
//   getRefreshToken,
//   blacklistAccessToken,
//   isAccessTokenBlacklisted,
//   getUserById,
//     loginByProcedure,
//     changePassword
// };

// auth.repo.js (ORACLE VERSION)

const oracledb = require("oracledb");
const getConnection = require("../../db");

async function loginWithPassword({ email }) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = :email
       FETCH FIRST 1 ROWS ONLY`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows[0] || null;
  } finally {
    await conn.close();
  }
}

async function saveRefreshToken({ userId, refreshToken }) {
  const conn = await getConnection();

  try {
    await conn.execute(
      `INSERT INTO refresh_tokens (user_id, token, created_at)
       VALUES (:userId, :token, SYSDATE)`,
      {
        userId,
        token: refreshToken,
      },
      { autoCommit: true }
    );

    return true;
  } finally {
    await conn.close();
  }
}

async function getRefreshToken({ refreshToken }) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      `SELECT user_id, token, created_at 
       FROM refresh_tokens 
       WHERE token = :token`,
      { token: refreshToken },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows[0] || null;
  } finally {
    await conn.close();
  }
}

async function blacklistAccessToken({ token }) {
  const conn = await getConnection();

  try {
    const jwt = require("jsonwebtoken");
    let expiresAt = null;

    try {
      const decoded = jwt.decode(token);
      if (decoded?.exp) {
        expiresAt = new Date(decoded.exp * 1000);
      }
    } catch (e) {}

    await conn.execute(
      `BEGIN
         INSERT INTO token_blacklist (token, blacklisted_at, expires_at)
         VALUES (:token, SYSDATE, :expiresAt);
       EXCEPTION
         WHEN DUP_VAL_ON_INDEX THEN NULL;
       END;`,
      { token, expiresAt },
      { autoCommit: true }
    );

    return true;
  } finally {
    await conn.close();
  }
}

async function isAccessTokenBlacklisted({ token }) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      `SELECT 1 FROM token_blacklist WHERE token = :token`,
      { token },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows.length > 0;
  } finally {
    await conn.close();
  }
}

async function deleteRefreshToken({ refreshToken }) {
  const conn = await getConnection();

  try {
    await conn.execute(
      `DELETE FROM refresh_tokens WHERE token = :token`,
      { token: refreshToken },
      { autoCommit: true }
    );

    return true;
  } finally {
    await conn.close();
  }
}

async function loginByProcedure(payload) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      `BEGIN
        admins.aoma_login_fetch(
          :userId,
          :password,
          :macaddr,
          :ipaddr,
          :hostname,
          :source,
          :deptId,

          :out_username,
          :out_userid,
          :out_lastlogin,
          :out_lastlogout,
          :out_corporation,
          :out_corporationaddress,
          :out_receiptofficename,
          :out_chalanofficename,
          :out_prabhagname,
          :out_prabhagid,
          :out_desigid,
          :out_usertype,
          :out_collectioncenter,
          :out_mobileno,
          :out_otpvalidate,
          :out_errorcode,
          :out_errormsg,
          :out_orgid,
          :out_forceFullPassChage
        );
      END;`,
      {
        ...payload,

        out_username: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_userid: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_lastlogin: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_lastlogout: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_corporation: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_corporationaddress: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_receiptofficename: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_chalanofficename: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_prabhagname: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_prabhagid: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_desigid: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_usertype: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_collectioncenter: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        out_mobileno: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_otpvalidate: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_errorcode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        out_errormsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
        out_orgid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        out_forceFullPassChage: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
      }
    );

    return {
      ...result.outBinds,
      errorCode: result.outBinds.out_errorcode,
      errorMsg: result.outBinds.out_errormsg,
      userId: result.outBinds.out_userid,
      username: result.outBinds.out_username,
      orgId: result.outBinds.out_orgid
    };

  } finally {
    await conn.close();
  }
}

async function changePassword({ userId, oldPassword, newPassword, ulbId }) {
  const conn = await getConnection();

  try {
    const result = await conn.execute(
      `BEGIN
        admins.aoma_changepassword_ins(
          :userId,
          :oldPassword,
          :newPassword,
          :ulbId,
          :out_errorcode,
          :out_errormsg
        );
      END;`,
      {
        userId,
        oldPassword,
        newPassword,
        ulbId,

        out_errorcode: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        out_errormsg: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
      }
    );

    return {
      errorCode: result.outBinds.out_errorcode,
      errorMsg: result.outBinds.out_errormsg
    };

  } finally {
    await conn.close();
  }
}

module.exports = {
  loginWithPassword,
  saveRefreshToken,
  deleteRefreshToken,
  getRefreshToken,
  blacklistAccessToken,
  isAccessTokenBlacklisted,
  loginByProcedure,
  changePassword
};
