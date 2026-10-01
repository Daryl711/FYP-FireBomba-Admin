const supabase = require("../config/supabase");

exports.getAllRooms = async () => {
  const { data, error } = await supabase
    .from("rooms")
    .select("room_id, name, status, last_updated, camera_enabled")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

exports.addRoom = async (name, status, cameraEnabled) => {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      name,
      status,
      camera_enabled: cameraEnabled,
      last_updated: new Date().toISOString(),
    })
    .select("room_id")
    .single();

  if (error) {
    throw error;
  }

  return data.room_id;
};

exports.updateRoom = async (roomId, name, status, cameraEnabled) => {
  const { data, error } = await supabase
    .from("rooms")
    .update({
      name,
      status,
      camera_enabled: cameraEnabled,
      last_updated: new Date().toISOString(),
    })
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
