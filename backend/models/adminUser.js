const supabase = require("../config/supabase");

exports.getAllUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select(
      "user_id, full_name, email, role, created_at, bilik_id, bilik(bilik_number, household_name)",
    )
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

// Deleting the auth account cascades to the users profile row.
exports.deleteUser = async (userId) => {
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    if (error.status === 404) return false;
    throw error;
  }

  return true;
};

exports.updateUserBilik = async (userId, bilikId) => {
  const { data, error } = await supabase
    .from("users")
    .update({ bilik_id: bilikId })
    .eq("user_id", userId)
    .select("user_id, bilik_id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

exports.addUserByAdmin = async (fullName, email, role, bilikId) => {
  const { data, error } = await supabase
    .from("users")
    .insert({
      user_id: null, // Do NOT use this if user_id references auth.users
      full_name: fullName,
      email,
      role,
      bilik_id: bilikId,
    })
    .select("user_id")
    .single();

  if (error) {
    throw error;
  }

  return data.user_id;
};
