const supabase = require('../config/supabase.js');


const requireToken = async (req, res, next) => {
  try {
    // Prefer the httpOnly cookie (set at login); fall back to a Bearer header
    // for non-browser clients / tools.
    const authHeader = req.headers.authorization;
    const token =
      req.cookies?.fb_access_token ||
      (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!token) {
      return res.status(401).json({
        error: "Missing authentication token",
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid or expired token",
      });
    }

    // User has been authenticated
    req.user = data.user;

    next();
  } catch (err) {
    console.error("Admin authentication error:", err);

    return res.status(500).json({
      error: "Authentication failed",
    });
  }
};


module.exports = requireToken;