const supabase = require("../config/supabase.js");

// Authorization guard. Runs AFTER requireToken (which sets req.user from a
// verified Supabase session). requireToken only proves the caller is a valid
// user; this confirms the caller is actually an admin before any admin route
// runs. Without it, any authenticated non-admin could call the admin API.
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Missing authentication token" });
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", req.user.id)
      .single();

    if (error || !data || data.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.userRole = data.role;
    next();
  } catch (err) {
    console.error("Authorization error:", err);
    return res.status(500).json({ error: "Authorization failed" });
  }
};

module.exports = requireAdmin;
