const supabase = require("../config/supabase");

// Each room has one sensor node that writes rows into sensor_readings.
// A node is "online" while its newest reading is younger than this window.
const OFFLINE_AFTER_MINUTES = Number(process.env.SENSOR_OFFLINE_MINUTES) || 60;

// Newest reading for one room. Ordered by created_at (when the row reached
// Supabase) rather than the device `timestamp`, which is often empty and
// depends on the device clock.
const getLatestReading = async (roomId) => {
  const { data, error } = await supabase
    .from("sensor_readings")
    .select("created_at, temperature, humidity, smoke, co, flame_detected")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

exports.OFFLINE_AFTER_MINUTES = OFFLINE_AFTER_MINUTES;

exports.getSensorStatuses = async (now = new Date()) => {
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("room_id, name, bilik_id, bilik(bilik_number)")
    .order("room_id", { ascending: true });

  if (error) throw error;

  const latest = await Promise.all(rooms.map((r) => getLatestReading(r.room_id)));
  const cutoff = now.getTime() - OFFLINE_AFTER_MINUTES * 60 * 1000;

  return rooms.map((room, i) => {
    const reading = latest[i];
    const lastReadingAt = reading?.created_at ?? null;
    const online = lastReadingAt !== null && new Date(lastReadingAt).getTime() >= cutoff;

    return {
      room_id: room.room_id,
      room_name: room.name,
      bilik_id: room.bilik_id,
      bilik_number: room.bilik?.bilik_number ?? null,
      status: online ? "online" : "offline",
      last_reading_at: lastReadingAt,
      latest: reading
        ? {
            temperature: reading.temperature,
            humidity: reading.humidity,
            smoke: reading.smoke,
            co: reading.co,
            flame_detected: reading.flame_detected,
          }
        : null,
    };
  });
};
