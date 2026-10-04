const supabase = require("../config/supabase");

exports.getAllRooms = async () => {
  const { data, error } = await supabase
    .from("rooms")
    .select("room_id, name, status, last_updated, camera_enabled, bilik_id")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

exports.addRoom = async (name, status, cameraEnabled, bilikId = null) => {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      name,
      status,
      camera_enabled: cameraEnabled,
      bilik_id: bilikId,
      last_updated: new Date().toISOString(),
    })
    .select("room_id")
    .single();

  if (error) {
    throw error;
  }

  return data.room_id;
};

exports.updateRoom = async (roomId, name, status, cameraEnabled, bilikId) => {
  const updates = {
    name,
    status,
    camera_enabled: cameraEnabled,
    last_updated: new Date().toISOString(),
  };
  if (bilikId !== undefined) updates.bilik_id = bilikId;

  const { data, error } = await supabase
    .from("rooms")
    .update(updates)
    .eq("room_id", roomId)
    .select("room_id")
    .single();

  if (error) {
    throw error;
  }

  return data.room_id;
};

exports.deleteRoom = async (roomId) => {
  const { error } = await supabase.from("rooms").delete().eq("room_id", roomId);

  if (error) {
    throw error;
  }

  return true;
};
