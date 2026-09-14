const jwt = require("jsonwebtoken");

const SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "dev_jwt_secret_change_me";

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const role =
      decoded.role ||
      decoded.user?.role ||
      decoded.app_metadata?.role ||
      decoded.user_metadata?.role;
    const normalizedRole = typeof role === "string" ? role.toLowerCase() : "";

    if (normalizedRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    req.user = {
      id: decoded.sub || decoded.user_id || decoded.userId || decoded.id,
      email: decoded.email || decoded.user?.email,
      role: role,
      ...decoded,
    };

    req.userId = req.user.id;
    req.isAdmin = true;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
