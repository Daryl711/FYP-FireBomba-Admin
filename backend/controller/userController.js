const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AdminUser = require("../models/adminUser");
const AuditLog = require("../models/auditLog");
const supabase = require('../config/supabase');

const VALID_ROLES = ["user", "admin"];

// Postgres foreign key violation, raised when bilik_id does not exist
const FK_VIOLATION = "23503";

const parseBilikId = (value) => {
  const bilikId = Number(value);
  return Number.isInteger(bilikId) && bilikId > 0 ? bilikId : null;
};

exports.getUsers = async (req, res) => {
  try {
    const users = await AdminUser.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    console.error(error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    const affected = await AdminUser.deleteUser(id);
    if (!affected) return res.status(404).json({ error: "User not found" });
    await AuditLog.logAction(req.user, "DELETE", "user", id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    console.error(error);
  }
};

exports.assignBilik = async (req, res) => {
  try {
    const { id } = req.params;
    const bilikId = parseBilikId(req.body.bilik_id);

    if (!bilikId) {
      return res.status(400).json({ error: "A valid bilik is required" });
    }

    const updated = await AdminUser.updateUserBilik(id, bilikId);
    if (!updated) return res.status(404).json({ error: "User not found" });

    await AuditLog.logAction(req.user, "UPDATE", "user", id, {
      bilik_id: bilikId,
    });
    res.json({ message: "Bilik assigned", user: updated });
  } catch (error) {
    if (error.code === FK_VIOLATION) {
      return res.status(400).json({ error: "Selected bilik does not exist" });
    }
    res.status(500).json({ error: "Server error" });
    console.error(error);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    const role = String(req.body.role || "user").toLowerCase();
    const bilikId = parseBilikId(req.body.bilik_id);

    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: "Email, password and full name are required",
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Role must be user or admin" });
    }

    if (!bilikId) {
      return res.status(400).json({ error: "A bilik must be assigned" });
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      console.error("Auth creation error:", authError);

      return res.status(400).json({
        error: authError.message,
      });
    }

    const userId = authData.user.id;

    // 2. Create application profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .insert({
        user_id: userId,
        email,
        full_name,
        role,
        bilik_id: bilikId,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);

      // IMPORTANT:
      // Auth user was already created.
      // We should clean it up if profile creation fails.
      await supabase.auth.admin.deleteUser(userId);

      if (profileError.code === FK_VIOLATION) {
        return res.status(400).json({ error: "Selected bilik does not exist" });
      }

      return res.status(500).json({
        error: "Failed to create user profile",
      });
    }

    // 3. Give the new account its role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role,
    });

    if (roleError) {
      console.error("Role creation error:", roleError);

      // Clean up both records
      await supabase.from("users").delete().eq("user_id", userId);

      await supabase.auth.admin.deleteUser(userId);

      return res.status(500).json({
        error: "Failed to create user role",
      });
    }

    await AuditLog.logAction(req.user, "CREATE", "user", userId, {
      email,
      full_name,
      role,
      bilik_id: bilikId,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: userId,
        email,
        full_name,
        role,
        bilik_id: bilikId,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
