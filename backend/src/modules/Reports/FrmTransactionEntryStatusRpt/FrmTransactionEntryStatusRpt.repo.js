const { executeQuery } = require("../../../db/queryExecutor");
const oracledb = require("oracledb");
const { withTx } = require("../../../db/tx");


const getUserList = async (ulbId) => {
    try {
        const query = `
      SELECT  
        var_user_username AS UserName,
        num_user_userid AS UserId
      FROM admins.aoma_user_def
      WHERE num_user_ulbid = :UlbId
    `;

        const bindParams = {
            UlbId: ulbId,
        };

        return await executeQuery(query, bindParams);
    } catch (err) {
        throw err;
    }
};

const getReceiptRegisterEntryStatus = async (params) => {
    try {
        let query = `
      SELECT
          TRNSDATE,
          PRABHAGNAME,
          PRABHAGID,
          VIBHAGID,
          VIBHAGNAME,
          USERID,
          RECNO,
          TRANSNO,
          CNT,
          AMOUNT
      FROM vw_transentstatus
      WHERE 1 = 1
    `;

        const bindParams = {};

        if (params.fromDate) {
            query += ` AND TRNSDATE >= TO_DATE(:FROMDATE, 'DD-MM-YYYY')`;
            bindParams.FROMDATE = params.fromDate;
        }

        if (params.toDate) {
            query += ` AND TRNSDATE <= TO_DATE(:TODATE, 'DD-MM-YYYY')`;
            bindParams.TODATE = params.toDate;
        }

        if (
            params.zoneId &&
            params.zoneId !== "-1" &&
            params.zoneId !== ""
        ) {
            query += ` AND PRABHAGID = :ZONEID`;
            bindParams.ZONEID = Number(params.zoneId);
        }

        if (
            params.department &&
            params.department !== "-1" &&
            params.department !== ""
        ) {
            query += ` AND VIBHAGID = :DEPARTMENTID`;
            bindParams.DEPARTMENTID = Number(params.department);
        }

        if (
            params.userId &&
            params.userId !== "-1" &&
            params.userId !== "0" &&
            params.userId !== ""
        ) {
            query += ` AND UPPER(USERID) = UPPER(:USERID)`;
            bindParams.USERID = params.userId;
        }

        query += `
      ORDER BY
          TRNSDATE,
          PRABHAGNAME,
          VIBHAGNAME,
          USERID,
          RECNO
    `;

        console.log("Entry Status Query:\n", query);
        console.log("Bind Params:", bindParams);

        return await executeQuery(query, bindParams);
    } catch (err) {
        console.error("Error in getReceiptRegisterEntryStatus:", err);
        throw err;
    }
};


module.exports = {
    getUserList,
    getReceiptRegisterEntryStatus
};
