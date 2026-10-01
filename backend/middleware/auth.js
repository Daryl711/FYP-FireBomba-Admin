const supabase = require('../config/supabase.js');


const requireToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing authentication token",
      });
    }

    const token = authHeader.split(" ")[1];

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