const supabase = require("../config/supabase");

// One water pump per room. The user app writes its state to `actuators`
// (waterpump_enabled = pump switched on) and only creates a room's row the
// first time that pump is used, so every room is listed here and a room
// without a row is reported as off and never used.
exports.getAllActuators = async () => {
  const [roomsResult, actuatorsResult] = await Promise.all([
    supabase
      .from("rooms")
      .select("room_id, name, bilik(bilik_number)")
      .order("room_id", { ascending: true }),
    supabase
      .from("actuators")
      .select("actuator_id, room_id, waterpump_enabled, last_updated"),
  ]);

  if (roomsResult.error) throw roomsResult.error;
  if (actuatorsResult.error) throw actuatorsResult.error;

  const byRoom = new Map(actuatorsResult.data.map((a) => [a.room_id, a]));

  return roomsResult.data.map((room) => {
    const actuator = byRoom.get(room.room_id);
    return {
      actuator_id: actuator?.actuator_id ?? null,
      room_id: room.room_id,
      room_name: room.name,
      bilik_number: room.bilik?.bilik_number ?? null,
      waterpump_enabled: actuator?.waterpump_enabled ?? false,
      last_updated: actuator?.last_updated ?? null,
    };
  });
};
