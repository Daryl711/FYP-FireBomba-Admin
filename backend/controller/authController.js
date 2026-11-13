const supabase = require("../config/supabase");
const createAuthClient = require("../config/supabaseAuth");
const AuditLog = require("../models/auditLog");

const ACCESS_COOKIE = "fb_access_token";

// httpOnly cookie options. httpOnly keeps the token out of reach of JavaScript
// (so XSS cannot steal it); secure is enabled in production (HTTPS); sameSite
// "lax" still allows the admin front-end (same site) to send it.
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 1000, // 1 hour
  path: "/",
});

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // 1. Authenticate with Supabase Auth
    const { data, error } = await createAuthClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const { user, session } = data;

    // 2. Check user's role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    // 3. Only allow admins
    if (roleData.role !== "admin") {
      return res.status(403).json({
        error: "Admin access required",
      });
    }

    // 4. Get application profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(500).json({
        error: "User profile not found",
      });
    }

    await AuditLog.logAction(user, "LOGIN", "admin", user.id);

    // Store the access token in an httpOnly cookie instead of returning it in
    // the response body. The browser sends it automatically on each request,
    // but page JavaScript can never read it, closing the XSS token-theft risk.
    res.cookie(ACCESS_COOKIE, session.access_token, cookieOptions());

    // 5. Return login information (no token in the body)
    return res.status(200).json({
      message: "Login successful",

      user: {
        id: user.id,
        email: user.email,
      },

      profile: {
        full_name: profile.full_name,
      },

      role: roleData.role,

      session: {
        expires_at: session.expires_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie(ACCESS_COOKIE, { ...cookieOptions(), maxAge: undefined });
  return res.status(200).json({ message: "Logged out" });
};
