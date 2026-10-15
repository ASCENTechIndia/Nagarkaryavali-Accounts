const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../../config/env");
const controller = require("./FrmDCPSnoGenarationMst.controller");

/**
 * Optional Auth Middleware
 * Extracts and decodes user token if present, while gracefully supporting guest/dev requests
 */
const optionalAuth = () => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || "";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        if (token && token !== "undefined" && token !== "null") {
          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = { id: decoded.sub, ...decoded };
          } catch (e) {
            console.warn("⚠️ Token decode warning (guest/dev mode):", e.message);
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ Auth header warning:", err.message);
    }
    return next();
  };
};

// ================= Routes =================

// 1. Employee Search
router.post("/getEmployeeByNo", optionalAuth(), controller.getEmployeeByNo);
router.post("/EmployeeByNo", optionalAuth(), controller.getEmployeeByNo);

// 2. Generate / Save DCPS Number
router.post("/SaveDCPS", optionalAuth(), controller.saveDCPS);
router.post("/generateDcpsNo", optionalAuth(), controller.saveDCPS);

// 3. DCPS Records List
router.post("/DCPSList", optionalAuth(), controller.getDCPSList);
router.get("/DCPSList", optionalAuth(), controller.getDCPSList);

module.exports = router;
