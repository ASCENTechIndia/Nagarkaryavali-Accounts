const oracledb = require("oracledb");
const getConnection = require("../../config/db");
// const logger = require("../../libs/logger");

async function isValidToken(req, res) {
  const tokenno =
    req.cookies?.access_token ||
    req.body?.in_tokenno;

  let connection;

  try {
    // logger.info({
    //   message: "VALIDATE TOKEN START",
    //   hasToken: !!tokenno,
    //   tokenLength: tokenno?.length,
    //   tokenPreview: tokenno?.substring(0, 30),
    // });

    connection = await getConnection();

    // logger.info("Oracle connection established");

    const binds = {
      in_mode: 2,
      in_userid: "",
      in_UserPassword: "",
      in_tokenno: tokenno,
      in_ipaddress: "",
      in_requestloginurl: "",
      in_requestfromurl: "",
      in_deptFlag: "",

      out_ErrorCode: {
        dir: oracledb.BIND_OUT,
        type: oracledb.NUMBER,
      },
      out_ErrorMsg: {
        dir: oracledb.BIND_OUT,
        type: oracledb.STRING,
        maxSize: 3000,
      },
      out_userid: {
        dir: oracledb.BIND_OUT,
        type: oracledb.STRING,
        maxSize: 3000,
      },
      out_encpassword: {
        dir: oracledb.BIND_OUT,
        type: oracledb.STRING,
        maxSize: 3000,
      },
    };

    // logger.info({
    //   message: "Calling Procedure",
    //   tokenLength: tokenno?.length,
    // });

    const result = await connection.execute(
      `BEGIN
         admins.aoma_singlelogintoken_ins(
           :in_mode,
           :in_userid,
           :in_UserPassword,
           :in_tokenno,
           :in_ipaddress,
           :in_requestloginurl,
           :in_requestfromurl,
           :in_deptFlag,
           :out_ErrorCode,
           :out_ErrorMsg,
           :out_userid,
           :out_encpassword
         );
       END;`,
      binds
    );

    // logger.info({
    //   message: "Oracle Procedure Response",
    //   outBinds: result.outBinds,
    // });

    return res.status(200).json({
      success: true,
      outBinds: result.outBinds,
    });
  } catch (err) {
    // logger.error({
    //   message: "isValidToken Error",
    //   error: err.message,
    //   stack: err.stack,
    // });

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();

        // logger.info("Oracle connection closed");
      } catch (err) {
        // logger.error({
        //   message: "Error closing Oracle connection",
        //   error: err.message,
        // });
      }
    }
  }
}

module.exports = isValidToken;