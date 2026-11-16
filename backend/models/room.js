const supabase = require("../config/supabase");

const ROOM_COLUMNS =
  "room_id, name, status, last_updated, camera_enabled, bilik_id, has_camera, has_sensor, has_waterpump";

exports.getAllRooms = async () => {
  const { data, error } = await supabase
    .from("rooms")
    .select(ROOM_COLUMNS)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

// devices: { has_camera, has_sensor, has_waterpump }; omitted keys keep the
// column default (not installed).
exports.addRoom = async (name, status, cameraEnabled, bilikId = null, devices = {}) => {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      name,
      status,
      camera_enabled: cameraEnabled,
      bilik_id: bilikId,
      ...devices,
      last_updated: new Date().toISOString(),
    })
    .select("room_id")
    .single();

  if (error) {
    throw error;
  }

  return data.room_id;
};

// devices: only the keys given are changed.
exports.updateRoom = async (roomId, name, status, cameraEnabled, bilikId, devices = {}) => {
  const updates = {
    name,
    status,
    camera_enabled: cameraEnabled,
    ...devices,
    last_updated: new Date().toISOString(),
  };
  if (bilikId !== undefined) updates.bilik_id = bilikId;

  const { data, error } = await supabase
    .from("rooms")
    .update(updates)
    .eq("room_id", roomId)
    .select("room_id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.room_id ?? null;
};

exports.deleteRoom = async (roomId) => {
  const { error } = await supabase.from("rooms").delete().eq("room_id", roomId);

  if (error) {
    throw error;
  }

  return true;
};
