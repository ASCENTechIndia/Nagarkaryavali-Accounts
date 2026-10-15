const repo = require("./FrmDCPSnoGenarationMst.repo");
const { AppError } = require("../../../libs/errors");

/**
 * Format Date value to DD/MM/YYYY
 * @param {Date|string|null} dateVal
 * @returns {string} Formatted date string
 */
const formatDate = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return String(dateVal);
  }
};

/**
 * Service: Fetch employee details by Employee Number, ID, or Name
 * @param {Object} payload
 * @returns {Promise<Object>} Formatted employee data and list
 */
async function getEmployeeByNoService(payload) {
  console.log("📥 Service: Fetch Employee By Query:", payload);

  const rows = await repo.getEmployeeByNoRepo(payload);

  if (!rows || rows.length === 0) {
    return {
      success: true,
      count: 0,
      data: null,
      list: [],
      message: "कर्मचारी माहिती आढळली नाही",
    };
  }

  // Format first matched row
  const raw = rows[0];
  const formattedData = {
    employeeId: raw.NUM_EMPLOYEE_EMPID,
    ulbId: raw.NUM_EMPLOYEE_ULBID,
    name: raw.EMPLOYEENAME || raw.VAR_EMPLOYEE_ENGNAME || "",
    dob: formatDate(raw.DATE_EMPLOYEE_DOB),
    address: raw.VAR_EMPLOYEE_PSNTADDRESS || "",
    emailId: raw.VAR_EMPLOYEE_EMAILID || "",
    mobileNo: raw.NUM_EMPLOYEE_MOBILENO ? String(raw.NUM_EMPLOYEE_MOBILENO) : "",
    contactNo: raw.NUM_EMPLOYEE_MOBILENO ? String(raw.NUM_EMPLOYEE_MOBILENO) : "",
    nomineeName: raw.VAR_NOMINEE_NAME || "",
    designation: raw.DESIGNATION || "",
    doj: formatDate(raw.DATE_EMPLOYEE_JOINDATE),
    confirmationDate: formatDate(raw.DATE_EMPLOYEE_CONFIRMDATE),
    retirementDate: formatDate(raw.DATE_EMPLOYEE_RETIREMNTDATE),
    bankAccNo: raw.NUM_EMPLOYEE_BANKACCNO || "",
    categoryName: raw.VAR_CATEGORY_NAME || "",
    zoneName: raw.VAR_ZONE_NAME || "",
    deptName: raw.VAR_DEPTMST_DEPTNAMEE || "",
    deptSlipSeq: raw.VAR_DEPTSLIP_SEQUENCE || "",
    oldEmpNo: raw.VAR_EMPLOYEE_OLDEMPNO || "",
    dcpsNo: raw.VAR_DCPSNOGEN_DCPSNO || "",
    openingDcpsBalance: raw.NUM_DCPSNOGEN_OPENINGBAL !== null ? raw.NUM_DCPSNOGEN_OPENINGBAL : "",
    raw,
  };

  return {
    success: true,
    count: rows.length,
    data: formattedData,
    list: rows,
  };
}

/**
 * Service: Execute AOAC_DCPSNOGEN_INS procedure to generate and save DCPS number
 * @param {Object} payload
 * @returns {Promise<Object>} Operation outcome with status and generated DCPS number
 */
async function saveDCPSService(payload) {
  console.log("📥 Service: Save DCPS:", payload);

  const { employeeId, openingBalance } = payload;

  if (!employeeId) {
    throw new AppError("कर्मचारी आयडी आवश्यक आहे", 400);
  }

  if (openingBalance === undefined || openingBalance === null || openingBalance === "") {
    throw new AppError("आरंभी शिल्लक (Opening DCPS Balance) प्रविष्ट करणे आवश्यक आहे", 400);
  }

  const result = await repo.saveDCPSRepo(payload);

  const isSuccess = result.out_ErrorCode === -100;

  // Extract generated DCPS number from procedure message (e.g., 'Generated DCPS Number : JCMCDCPS000000X')
  let generatedDcpsNo = "";
  if (result.out_ErrorMsg && result.out_ErrorMsg.includes(":")) {
    const parts = result.out_ErrorMsg.split(":");
    generatedDcpsNo = parts[parts.length - 1].trim();
  }

  return {
    success: isSuccess,
    errorCode: result.out_ErrorCode,
    message: result.out_ErrorMsg,
    generatedDcpsNo,
  };
}

/**
 * Service: Fetch generated DCPS list
 * @param {Object} payload
 * @returns {Promise<Object>} List of DCPS records
 */
async function getDCPSListService(payload) {
  console.log("📥 Service: Fetch DCPS List:", payload);

  const data = await repo.getDCPSListRepo(payload);

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

module.exports = {
  getEmployeeByNoService,
  saveDCPSService,
  getDCPSListService,
};
