const bcrypt = require("bcryptjs");
const User = require("../models/User");
const supabase = require("../config/supabase");
const createAuthClient = require("../config/supabaseAuth");

exports.signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const doesEmailExist = await User.checkEmail(email);

    if (doesEmailExist) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await User.addUser(fullName, email, hashedPassword);

    return res.status(201).json({
      message: "Account created successfully",
      userId,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    console.error(error);
  }
};

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

    // 5. Return login information
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
        access_token: session.access_token,
        refresh_token: session.refresh_token,
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
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Lets the signed-in admin change their own name, email and/or password.
// The current password is always required, so a stolen or left-open session
// cannot be used to take over the account.
exports.updateCredentials = async (req, res) => {
  try {
    const authUser = req.user;
    const { currentPassword, fullName, email, newPassword } = req.body || {};

    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required" });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const nextName = typeof fullName === "string" ? fullName.trim() : "";
    const nextEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    const nameChanged = nextName !== "" && nextName !== profile.full_name;
    const emailChanged =
      nextEmail !== "" && nextEmail !== (authUser.email || "").toLowerCase();
    const passwordChanged = typeof newPassword === "string" && newPassword !== "";

    if (!nameChanged && !emailChanged && !passwordChanged) {
      return res.status(400).json({ error: "No changes to save" });
    }
    if (nameChanged && nextName.length > 100) {
      return res
        .status(400)
        .json({ error: "Full name must be 100 characters or fewer" });
    }
    if (emailChanged && !EMAIL_PATTERN.test(nextEmail)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }
    if (passwordChanged && newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    // Confirm the current password on a throwaway client so the shared
    // service-role client never picks up the admin's session.
    const { error: verifyError } = await createAuthClient().auth.signInWithPassword(
      { email: authUser.email, password: currentPassword },
    );
    if (verifyError) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    if (emailChanged) {
      const { data: taken } = await supabase
        .from("users")
        .select("user_id")
        .eq("email", nextEmail)
        .neq("user_id", authUser.id)
        .maybeSingle();
      if (taken) {
        return res.status(409).json({ error: "That email is already in use" });
      }
    }

    // 1. Supabase Auth (login email + password). Admin API so the new email
    //    takes effect immediately instead of waiting on a confirmation link.
    if (emailChanged || passwordChanged) {
      const authUpdate = {};
      if (emailChanged) {
        authUpdate.email = nextEmail;
        authUpdate.email_confirm = true;
      }
      if (passwordChanged) authUpdate.password = newPassword;

      const { error: authError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        authUpdate,
      );
      if (authError) {
        console.error("Credential update (auth) error:", authError);
        return res
          .status(400)
          .json({ error: authError.message || "Could not update credentials" });
      }
    }

    // 2. Application profile row.
    if (nameChanged || emailChanged) {
      const profileUpdate = {};
      if (nameChanged) profileUpdate.full_name = nextName;
      if (emailChanged) profileUpdate.email = nextEmail;

      const { error: updateError } = await supabase
        .from("users")
        .update(profileUpdate)
        .eq("user_id", authUser.id);

      if (updateError) {
        console.error("Credential update (profile) error:", updateError);
        // Keep login email and profile email in step.
        if (emailChanged) {
          await supabase.auth.admin.updateUserById(authUser.id, {
            email: authUser.email,
            email_confirm: true,
          });
        }
        return res.status(500).json({ error: "Could not update profile" });
      }
    }

    return res.status(200).json({
      message: "Credentials updated",
      user: {
        id: authUser.id,
        email: emailChanged ? nextEmail : authUser.email,
        fullName: nameChanged ? nextName : profile.full_name,
      },
    });
  } catch (err) {
    console.error("Update credentials error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// const doesEmailExist = await User.checkEmail(email);

// if (!doesEmailExist) {
//     return res.status(400).json({error: "User not found"});
// }

// const userDetails = await User.getUserDetails(email);

// const passwordMatch = await bcrypt.compare(password, userDetails.hashedPassword);

// if (!passwordMatch)
// return res.status(401).json({ error: "Incorrect password" });

// const token = jwt.sign(
// { userId: userDetails.userId, email: userDetails.email, roomId: userDetails.roomId },
// JWT_SECRET,
// { expiresIn: JWT_EXPIRES_IN },
// );

// exports.adminLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password are required" });
//     }

//     const doesEmailExist = await User.checkEmail(email);
//     if (!doesEmailExist) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const userDetails = await User.getUserDetails(email);

//     const passwordMatch = await bcrypt.compare(
//       password,
//       userDetails.hashedPassword,
//     );
//     if (!passwordMatch) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     if (userDetails.role !== "Admin") {
//       return res
//         .status(403)
//         .json({ error: "Access denied. Admin privileges required." });
//     }

//     const token = jwt.sign(
//       {
//         userId: userDetails.userId,
//         email: userDetails.email,
//         role: userDetails.role,
//       },
//       JWT_SECRET,
//       { expiresIn: JWT_EXPIRES_IN },
//     );

//     return res.status(200).json({
//       message: "Login successful",
//       token,
//       user: {
//         userId: userDetails.userId,
//         fullName: userDetails.fullName,
//         email: userDetails.email,
//         role: userDetails.role,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//     console.error(error);
//   }
// };
