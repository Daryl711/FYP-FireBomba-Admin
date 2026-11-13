const supabase = require("../config/supabase");

exports.getAllActuators = async () => {
  const { data, error } = await supabase
    .from("actuators")
    .select("actuator_id, room_id, waterpump_enabled, last_updated, rooms(name)")
    .order("actuator_id", { ascending: true });

  if (error) {
    throw error;
  }

  // Flatten the embedded room name to match the previous API shape.
  return (data || []).map((a) => ({
    actuator_id: a.actuator_id,
    room_id: a.room_id,
    waterpump_enabled: a.waterpump_enabled,
    last_updated: a.last_updated,
    room_name: a.rooms ? a.rooms.name : null,
  }));
};
