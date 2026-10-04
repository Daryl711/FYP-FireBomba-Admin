const supabase = require("../config/supabase");

exports.getAllBilik = async () => {
  const { data, error } = await supabase
    .from("bilik")
    .select("bilik_id, bilik_number, household_name, created_at")
    .order("bilik_number", { ascending: true });

  if (error) throw error;
  return data;
};

exports.createBilik = async (bilikNumber, householdName) => {
  const { data, error } = await supabase
    .from("bilik")
    .insert({ bilik_number: bilikNumber, household_name: householdName })
    .select("bilik_id, bilik_number, household_name, created_at")
    .single();

  if (error) throw error;
  return data;
};

exports.updateBilik = async (bilikId, bilikNumber, householdName) => {
  const { data, error } = await supabase
    .from("bilik")
    .update({ bilik_number: bilikNumber, household_name: householdName })
    .eq("bilik_id", bilikId)
    .select("bilik_id, bilik_number, household_name, created_at")
    .maybeSingle();

  if (error) throw error;
  return data;
};

exports.deleteBilik = async (bilikId) => {
  const { data, error } = await supabase
    .from("bilik")
    .delete()
    .eq("bilik_id", bilikId)
    .select("bilik_id")
    .maybeSingle();

  if (error) throw error;
  return data;
};
