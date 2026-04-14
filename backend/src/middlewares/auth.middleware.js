const jwt = require("jsonwebtoken");
const { AppError } = require("../libs/errors");
const { JWT_SECRET } = require("../config/env");
const authRepo = require("../modules/auth/auth.repo");

module.exports = function auth(allowedRoles = null) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || "";

      if (!authHeader.startsWith("Bearer ")) {
        throw new AppError("Authorization token missing", 401);
      }

      const token = authHeader.substring(7).trim();
      if (!token) throw new AppError("Authorization token missing", 401);

      // ✅ ONLY DB BLACKLIST CHECK (correct way)
      try {
        const isBlacklisted = await authRepo.isAccessTokenBlacklisted({ token });

        if (isBlacklisted) {
          throw new AppError("Token has been revoked (logged out)", 401);
        }
      } catch (dbError) {
        console.warn("⚠️ DB blacklist check failed:", dbError.message);
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        throw new AppError("Invalid or expired token", 401);
      }

      req.user = {
        id: decoded.sub,
        ...decoded,
      };

      // ✅ Role Guard
      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const userRoles = decoded.roles || decoded.role || [];
        const rolesArr = Array.isArray(userRoles) ? userRoles : [userRoles];

        const hasAccess = rolesArr.some((r) => allowedRoles.includes(r));
        if (!hasAccess) throw new AppError("Forbidden", 403);
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};