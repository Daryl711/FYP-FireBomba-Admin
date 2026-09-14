const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const supabase = require("../config/supabase");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

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
    const { data, error } = await supabase.auth.signInWithPassword({
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


    console.log(roleData);
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
      .select("full_name, room_id")
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
        room_id: profile.room_id,
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


