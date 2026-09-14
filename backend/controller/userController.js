const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AdminUser = require("../models/adminUser");
const supabase = require('../config/supabase');

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
    const affected = await AdminUser.deleteUser(id);
    if (!affected) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    console.error(error);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: "Email, password and full name are required",
      });
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
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);

      // IMPORTANT:
      // Auth user was already created.
      // We should clean it up if profile creation fails.
      await supabase.auth.admin.deleteUser(userId);

      return res.status(500).json({
        error: "Failed to create user profile",
      });
    }

    // 3. Give the new account normal-user role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: "user",
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

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: userId,
        email,
        full_name,
        role: "user",
      },
    });
  } catch (err) {
    console.error("Create user error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
