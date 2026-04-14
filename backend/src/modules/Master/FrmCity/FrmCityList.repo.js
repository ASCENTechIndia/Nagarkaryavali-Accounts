const oracledb = require("oracledb");
const { executeQuery } = require("../../../db/queryExecutor");
const { withTx } = require("../../../db/tx");

// 1. State List
async function getStateList() {
  const sql = `
    SELECT 
      num_statemst_stateid AS State_ID,
      var_statemst_statename AS State_Name
    FROM aoac_statemst_def
    ORDER BY var_statemst_statename
  `;

  const result = await executeQuery(sql);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 2. District List (All)
async function getDistrictList() {
  const sql = `
    SELECT 
      num_districtmst_districtid AS District_ID,
      var_districtmst_districtname AS District_Name,
      num_districtmst_stateid AS Parent_State_ID
    FROM aoac_districtmst_def
    ORDER BY var_districtmst_districtname
  `;

  const result = await executeQuery(sql);
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 3. District By State
async function getDistrictByState(stateId) {
  const sql = `
    SELECT 
      num_districtmst_districtid AS District_ID,
      var_districtmst_districtname AS District_Name
    FROM aoac_districtmst_def
    WHERE num_districtmst_stateid = :stateId
    ORDER BY var_districtmst_districtname
  `;

  const result = await executeQuery(sql, { stateId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 4. City By District
async function getCityByDistrict(districtId) {
  const sql = `
    SELECT 
      num_citymst_cityid AS CityId,
      var_citymst_cityname AS CityName,
      num_citymst_districtid AS DistrictId
    FROM aoac_citymst_def
    WHERE num_citymst_districtid = :districtId
    ORDER BY var_citymst_cityname
  `;

  const result = await executeQuery(sql, { districtId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 5. District By ID (to get state)
async function getStateByDistrict(districtId) {
  const sql = `
    SELECT num_districtmst_stateid AS Stateid
    FROM aoac_districtmst_def
    WHERE num_districtmst_districtid = :districtId
  `;

  const result = await executeQuery(sql, { districtId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 6. City By ID
async function getCityById(cityId, districtId) {
  const sql = `
    SELECT 
      num_citymst_districtid AS DistrictId,
      num_citymst_cityid AS CityId,
      var_citymst_cityname AS CityName
    FROM aoac_citymst_def
    WHERE num_citymst_cityid = :cityId
      AND num_citymst_districtid = :districtId
  `;

  const result = await executeQuery(sql, { cityId, districtId });
  if (!result.success) throw new Error(result.error);

  return result.rows;
}

// 7. Procedure
async function cityProc(data) {
  try {
    const result = await withTx(async (conn) => {
      const res = await conn.execute(
        `BEGIN 
          aoac_city_ins(
            :in_cityid,
            :in_districtid,
            :in_cityname,
            :in_UserId,
            :in_Mode,
            :out_ErrorCode,
            :out_ErrorMsg
          );
        END;`,
        {
          in_cityid: data.cityId || null,
          in_districtid: data.districtId,
          in_cityname: data.cityName,
          in_UserId: data.userId,
          in_Mode: data.mode,

          out_ErrorCode: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER,
          },
          out_ErrorMsg: {
            dir: oracledb.BIND_OUT,
            type: oracledb.STRING,
            maxSize: 2000,
          },
        }
      );

      return res.outBinds;
    });

    return {
      success: true,
      errorCode: result.OUT_ERRORCODE,
      errorMsg: result.OUT_ERRORMSG,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  getStateList,
  getDistrictList,
  getDistrictByState,
  getCityByDistrict,
  getStateByDistrict,
  getCityById,
  cityProc,
};