// const repo = require("./MenuAccess.repo");
// const { AppError } = require("../../libs/errors");

// async function getMenuAccess(UserId) {
//   if (!UserId) {
//     throw new AppError(" UserId is required", 400);
//   }

//   const result = await repo.getMenuAccess(UserId);

//   if (!result.success) {
//     throw new AppError(result.error || "Failed to fetch menu access", 500);
//   }

//   if (result.rows.length === 0) {
//     throw new AppError("Menu access not found", 404);
//   }

//   return result.rows;
// }

// module.exports = {

//   getMenuAccess,

// };


const repo = require("./MenuAccess.repo");
const { AppError } = require("../../libs/errors");

async function getMenusService(payload) {
  console.log("📥 Service Payload:", payload);

  const { userId, ulbId, deptId } = payload;

  // ✅ VALIDATION
  if (!userId || !ulbId || !deptId) {
    throw new AppError("userId, ulbId and deptId are required", 400);
  }

  const data = await repo.getMenusRepo(payload);

  // 🔥 FILTER TITLES
  const excludedTitles = ['मेनु मास्टर', 'वापरकर्ता प्रवेश'];

  const filtered = data.filter(
    (row) => !excludedTitles.includes(row.MENUTITLE)
  );

  // 🔥 CLEAN PAGEPATH (.aspx remove)
  const cleaned = filtered.map((row) => ({
    ...row,
    PAGEPATH: row.PAGEPATH
      ? row.PAGEPATH.replace(/\.aspx(?=$|\?)/i, "")
      : row.PAGEPATH,
  }));

  return {
    success: true,
    count: cleaned.length,
    data: cleaned,
  };
}

async function getCorporationService(payload) {
  console.log("📥 Service Payload:", payload);

  const { ulbId } = payload;

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const data = await repo.getCorporationRepo(payload);

  if (!data || data.length === 0) {
    throw new AppError("Corporation data not found", 404);
  }

  const row = data[0];

  let logoBase64 = null;

  if (row.CORPORATIONLOGO) {
    logoBase64 = `data:image/png;base64,${row.CORPORATIONLOGO.toString(
      "base64"
    )}`;
  }

  return {
    ULBLOGO: logoBase64,
    ABC_MUNICIPAL_TEXT: row.CORPORATIONNAME,
  };
}

module.exports = {
  getMenusService,
  getCorporationService
};